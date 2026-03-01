import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, CloudOff, CheckCircle2 } from 'lucide-react';
import { getPendingCount, subscribeSyncProgress, type SyncProgress } from '@/lib/offlineQueue';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({ total: 0, done: 0, failed: 0, status: 'idle' });

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => {
      setIsOffline(false);
      setShowBackOnline(true);
      setTimeout(() => setShowBackOnline(false), 6000);
    };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  // Subscribe to sync progress events
  useEffect(() => {
    return subscribeSyncProgress(setSyncProgress);
  }, []);

  // Poll pending count while offline
  useEffect(() => {
    if (!isOffline) return;
    const interval = setInterval(async () => {
      const count = await getPendingCount();
      setPendingCount(count);
    }, 2000);
    return () => clearInterval(interval);
  }, [isOffline]);

  const isSyncing = syncProgress.status === 'syncing';
  const syncDone = syncProgress.status === 'done';

  if (!isOffline && !showBackOnline && !isSyncing) return null;

  // Progress percentage
  const progressPct = syncProgress.total > 0 ? Math.round((syncProgress.done / syncProgress.total) * 100) : 0;

  return (
    <div
      className={`fixed top-0 inset-x-0 z-[100] text-center text-sm font-cairo font-semibold transition-all duration-500 animate-in slide-in-from-top ${
        isOffline
          ? 'bg-gradient-to-r from-destructive to-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/20'
          : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20'
      }`}
    >
      {/* Sync progress bar */}
      {isSyncing && syncProgress.total > 0 && (
        <div className="absolute bottom-0 left-0 h-0.5 bg-white/40 transition-all duration-300" style={{ width: `${progressPct}%` }} />
      )}

      <div className="py-2.5 px-4">
        {isOffline ? (
          <span className="flex items-center justify-center gap-2.5 flex-wrap">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive-foreground/60 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive-foreground" />
            </span>
            <CloudOff className="w-4 h-4" />
            أنت غير متصل بالإنترنت — بياناتك محفوظة محلياً
            {pendingCount > 0 && (
              <span className="bg-background/20 rounded-full px-3 py-0.5 text-xs flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3" />
                {pendingCount} عمليات معلقة
              </span>
            )}
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2.5">
            {isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                جاري مزامنة بياناتك... ({syncProgress.done}/{syncProgress.total})
              </>
            ) : syncDone || syncProgress.failed === 0 ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                تم الاتصال والمزامنة بنجاح ✓
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4" />
                تم الاتصال — {syncProgress.failed > 0 ? `${syncProgress.failed} عمليات تنتظر إعادة المحاولة` : 'تم الاتصال بنجاح ✓'}
              </>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
