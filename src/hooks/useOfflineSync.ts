import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  getPendingOps,
  markSynced,
  markRetry,
  clearSynced,
  getBackoffDelay,
  emitSyncProgress,
  MAX_RETRIES,
} from '@/lib/offlineQueue';
import { toast } from 'sonner';

export function useOfflineSync() {
  const isSyncing = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout>>();

  const syncPending = useCallback(async () => {
    if (isSyncing.current || !navigator.onLine) return;
    isSyncing.current = true;

    const ops = await getPendingOps();
    if (ops.length === 0) {
      isSyncing.current = false;
      return;
    }

    emitSyncProgress({ total: ops.length, done: 0, failed: 0, status: 'syncing' });
    toast.info(`جاري مزامنة ${ops.length} عمليات معلقة...`);

    let successCount = 0;
    let failCount = 0;
    let needsRetry = false;

    for (const op of ops) {
      // Re-check connectivity before each operation
      if (!navigator.onLine) {
        needsRetry = true;
        break;
      }

      try {
        if (op.operation === 'insert') {
          const { error } = await supabase.from(op.table as any).insert(op.data);
          if (error) throw error;
        } else if (op.operation === 'update' && op.match) {
          let q: any = supabase.from(op.table as any).update(op.data);
          for (const [key, val] of Object.entries(op.match)) {
            q = q.eq(key, val);
          }
          const { error } = await q;
          if (error) throw error;
        } else if (op.operation === 'delete' && op.match) {
          let q: any = supabase.from(op.table as any).delete();
          for (const [key, val] of Object.entries(op.match)) {
            q = q.eq(key, val);
          }
          const { error } = await q;
          if (error) throw error;
        }

        if (op.id) await markSynced(op.id);
        successCount++;
        emitSyncProgress({ done: successCount, failed: failCount });
      } catch (err: any) {
        const errorMsg = err?.message || 'Unknown error';
        if (op.id) await markRetry(op.id, errorMsg);
        failCount++;
        emitSyncProgress({ done: successCount, failed: failCount });

        // If the op can be retried, schedule a delayed retry
        if ((op.retry_count ?? 0) + 1 < MAX_RETRIES) {
          needsRetry = true;
        }
      }
    }

    await clearSynced();

    if (failCount === 0) {
      emitSyncProgress({ status: 'done' });
      toast.success('تمت مزامنة جميع بياناتك بنجاح! ✅');
    } else if (successCount > 0) {
      emitSyncProgress({ status: 'error' });
      toast.warning(`تم مزامنة ${successCount} عمليات، فشلت ${failCount} عمليات — ستتم إعادة المحاولة`);
    } else {
      emitSyncProgress({ status: 'error' });
      toast.error(`فشلت مزامنة ${failCount} عمليات — ستتم إعادة المحاولة تلقائياً`);
    }

    isSyncing.current = false;

    // Schedule retry with exponential backoff for remaining ops
    if (needsRetry && navigator.onLine) {
      const remaining = await getPendingOps();
      if (remaining.length > 0) {
        const maxRetry = Math.max(...remaining.map(o => o.retry_count ?? 0));
        const delay = getBackoffDelay(maxRetry);
        if (retryTimer.current) clearTimeout(retryTimer.current);
        retryTimer.current = setTimeout(syncPending, delay);
      }
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      // Small delay to let the connection stabilize
      setTimeout(syncPending, 1500);
    };
    window.addEventListener('online', handleOnline);

    // Sync on mount if online
    if (navigator.onLine) {
      syncPending();
    }

    // Register for Background Sync API if available
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        (reg as any).sync?.register?.('offline-sync').catch(() => {
          // Background sync not supported or denied
        });
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [syncPending]);
}
