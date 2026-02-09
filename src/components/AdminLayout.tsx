import { useEffect, useState, ReactNode } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LayoutDashboard, Package, MapPin, ShoppingCart, Tag, Settings, LogOut, Menu, X, Layers, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const NAV_ITEMS = [
  { href: '/admin', label: 'لوحة القيادة', icon: LayoutDashboard },
  { href: '/admin/products', label: 'المنتجات', icon: Package },
  { href: '/admin/orders', label: 'الطلبات', icon: ShoppingCart },
  { href: '/admin/wilayas', label: 'الولايات', icon: MapPin },
  { href: '/admin/coupons', label: 'كوبونات', icon: Tag },
  { href: '/admin/categories', label: 'التصنيفات', icon: Layers },
  { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAdmin = async (userId: string) => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      return !!data;
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!session?.user) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        navigate('/admin/login');
        return;
      }
      setUser(session.user);
      const admin = await checkAdmin(session.user.id);
      setIsAdmin(admin);
      setLoading(false);
      if (!admin) {
        await supabase.auth.signOut();
        navigate('/admin/login');
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        setLoading(false);
        navigate('/admin/login');
        return;
      }
      setUser(session.user);
      const admin = await checkAdmin(session.user.id);
      setIsAdmin(admin);
      setLoading(false);
      if (!admin) {
        await supabase.auth.signOut();
        navigate('/admin/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Skeleton className="w-32 h-8" /></div>;
  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen flex bg-muted">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-card border-l transform transition-transform md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <Link to="/admin" className="font-cairo font-bold text-lg">DZ Store Admin</Link>
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
        <header className="sticky top-0 z-40 bg-card border-b h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="font-cairo font-bold text-lg">
              {NAV_ITEMS.find(i => i.href === location.pathname)?.label || 'لوحة التحكم'}
            </h1>
          </div>
          <span className="font-cairo text-xs text-muted-foreground hidden sm:block">{user?.email}</span>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-foreground/30 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
