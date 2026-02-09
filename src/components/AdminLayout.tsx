import { useEffect, useState, useCallback, ReactNode } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LayoutDashboard, Package, MapPin, ShoppingCart, Tag, Settings, LogOut, Menu, X, Layers, Users, Bell, AlertTriangle, Clock, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useStoreLogo } from '@/hooks/useStoreLogo';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'order' | 'low_stock';
  title: string;
  description: string;
  timestamp: Date;
  link: string;
}

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.value = 0.3;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

const NAV_ITEMS = [
  { href: '/admin', label: 'لوحة القيادة', icon: LayoutDashboard },
  { href: '/admin/products', label: 'المنتجات', icon: Package },
  { href: '/admin/categories', label: 'الفئات', icon: Layers },
  { href: '/admin/orders', label: 'الطلبات', icon: ShoppingCart },
  { href: '/admin/leads', label: 'العملاء المحتملون', icon: Users },
  { href: '/admin/wilayas', label: 'الولايات', icon: MapPin },
  { href: '/admin/coupons', label: 'كوبونات', icon: Tag },
  { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
];

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'الآن';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `منذ ${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} س`;
  return `منذ ${Math.floor(hours / 24)} ي`;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: logoUrl } = useStoreLogo();

  // Fetch low stock products on mount
  useEffect(() => {
    const fetchLowStock = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, stock')
        .eq('is_active', true)
        .lte('stock', 5);
      if (data) {
        const lowStockNotifs: Notification[] = data.map(p => ({
          id: `low_stock_${p.id}`,
          type: 'low_stock',
          title: `مخزون منخفض: ${p.name}`,
          description: `${p.stock ?? 0} قطعة متبقية`,
          timestamp: new Date(),
          link: '/admin/products',
        }));
        setNotifications(prev => {
          const existingIds = new Set(prev.filter(n => n.type === 'order').map(n => n.id));
          return [...prev.filter(n => n.type === 'order'), ...lowStockNotifs];
        });
      }
    };
    fetchLowStock();
  }, []);

  // Realtime new order notifications
  useEffect(() => {
    const channel = supabase
      .channel('new-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const order = payload.new as any;
          const notif: Notification = {
            id: `order_${order.id}`,
            type: 'order',
            title: `🛒 طلب جديد #${order.order_number}`,
            description: order.customer_name,
            timestamp: new Date(),
            link: '/admin/orders',
          };
          setNotifications(prev => [notif, ...prev]);
          playNotificationSound();
          toast(`🛒 طلب جديد #${order.order_number}`, {
            description: order.customer_name,
            action: {
              label: 'عرض',
              onClick: () => navigate('/admin/orders'),
            },
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [navigate]);

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async (userId: string) => {
      const { data } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
      if (!data) {
        toast.error('ليس لديك صلاحيات الوصول');
        navigate('/');
        return;
      }
      setIsAdmin(true);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setLoading(false);
        navigate('/admin/login');
      } else {
        checkAdmin(session.user.id).finally(() => setLoading(false));
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setLoading(false);
        navigate('/admin/login');
      } else {
        checkAdmin(session.user.id).finally(() => setLoading(false));
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const clearNotifications = () => setNotifications([]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Skeleton className="w-32 h-8" /></div>;
  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen flex bg-muted">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-card border-l transform transition-transform md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <Link to="/admin" className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt="DZ Store" className="w-8 h-8 rounded object-contain" />
            ) : (
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-cairo font-bold text-xs">DZ</span>
              </div>
            )}
            <span className="font-cairo font-bold text-lg">لوحة التحكم</span>
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-cairo text-sm transition-colors ${
                location.pathname === item.href ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t">
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-2 font-cairo text-destructive hover:text-destructive">
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 md:mr-64">
        <header className="sticky top-0 z-40 bg-card border-b h-14 flex items-center px-4 gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="font-cairo font-bold text-lg flex-1">
            {NAV_ITEMS.find(i => i.href === location.pathname)?.label || 'لوحة التحكم'}
          </h1>

          {/* Notification Bell Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 max-h-[420px] overflow-hidden" sideOffset={8}>
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                <h3 className="font-cairo font-bold text-sm">الإشعارات</h3>
                {notifications.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearNotifications} className="font-cairo text-xs h-7 text-muted-foreground hover:text-foreground">
                    مسح الكل
                  </Button>
                )}
              </div>
              <div className="overflow-y-auto max-h-[340px]">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="font-cairo text-sm text-muted-foreground">لا توجد إشعارات</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <button
                      key={notif.id}
                      onClick={() => navigate(notif.link)}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-right border-b last:border-b-0"
                    >
                      <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5 ${
                        notif.type === 'order' ? 'bg-primary/10' : 'bg-destructive/10'
                      }`}>
                        {notif.type === 'order' ? (
                          <ShoppingCart className="w-4 h-4 text-primary" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-cairo font-semibold text-sm text-foreground truncate">{notif.title}</p>
                        <p className="font-cairo text-xs text-muted-foreground truncate">{notif.description}</p>
                        <p className="font-cairo text-[11px] text-muted-foreground/70 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(notif.timestamp)}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-foreground/30 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
