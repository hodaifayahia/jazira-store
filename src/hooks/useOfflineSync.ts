import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getPendingOps, markSynced, clearSynced } from '@/lib/offlineQueue';
import { toast } from 'sonner';

export function useOfflineSync() {
  const syncPending = useCallback(async () => {
    const ops = await getPendingOps();
    if (ops.length === 0) return;

    toast.info(`جاري مزامنة ${ops.length} عمليات معلقة...`);
    let successCount = 0;
    let failCount = 0;

    for (const op of ops) {
      try {
        if (op.operation === 'insert') {
          const { error } = await supabase.from(op.table as any).insert(op.data);
          if (error) throw error;
        } else if (op.operation === 'update' && op.match) {
          const matchEntries = Object.entries(op.match);
          let q: any = supabase.from(op.table as any).update(op.data);
          for (const [key, val] of matchEntries) {
            q = q.eq(key, val);
          }
          const { error } = await q;
          if (error) throw error;
        } else if (op.operation === 'delete' && op.match) {
          const matchEntries = Object.entries(op.match);
          let q: any = supabase.from(op.table as any).delete();
          for (const [key, val] of matchEntries) {
            q = q.eq(key, val);
          }
          const { error } = await q;
          if (error) throw error;
        }
        if (op.id) await markSynced(op.id);
        successCount++;
      } catch {
        failCount++;
      }
    }

    await clearSynced();

    if (failCount === 0) {
      toast.success('تمت مزامنة جميع بياناتك بنجاح! ✅');
    } else {
      toast.warning(`تم مزامنة ${successCount} عمليات، فشلت ${failCount} عمليات`);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      syncPending();
    };
    window.addEventListener('online', handleOnline);

    // Also sync on mount if online and there are pending ops
    if (navigator.onLine) {
      syncPending();
    }

    return () => window.removeEventListener('online', handleOnline);
  }, [syncPending]);
}
