import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { getPendingCount } from '@/lib/offlineQueue';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => {
      setIsOffline(false);
      setShowBackOnline(true);
      setTimeout(() => setShowBackOnline(false), 3000);
    };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  useEffect(() => {
    if (!isOffline) return;
    const interval = setInterval(async () => {
      const count = await getPendingCount();
      setPendingCount(count);
    }, 2000);
    return () => clearInterval(interval);
  }, [isOffline]);

  if (!isOffline && !showBackOnline) return null;

  return (
    <div
      className={`fixed top-0 inset-x-0 z-[100] text-center py-2 px-4 text-sm font-cairo font-semibold transition-all duration-300 ${
        isOffline
          ? 'bg-destructive text-destructive-foreground'
          : 'bg-primary text-primary-foreground'
      }`}
    >
      {isOffline ? (
        <span className="flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          أنت غير متصل بالإنترنت — سيتم حفظ بياناتك محلياً
          {pendingCount > 0 && <span className="bg-background/20 rounded-full px-2 py-0.5 text-xs">{pendingCount} عمليات معلقة</span>}
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <Wifi className="w-4 h-4" />
          تم الاتصال بالإنترنت — جاري المزامنة...
        </span>
      )}
    </div>
  );
}
