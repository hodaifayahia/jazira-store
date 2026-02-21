import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, Home, Package, MapPin, User, LogIn, Info, Search, Shirt, Watch, Footprints, Smartphone, Home as HomeIcon, Grid3X3, ChevronDown, type LucideIcon } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useStoreLogo } from '@/hooks/useStoreLogo';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const ICON_MAP: Record<string, LucideIcon> = {
  Shirt,
  Watch,
  Footprints,
  Smartphone,
  Home: HomeIcon,
};

function getCategoryIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Grid3X3;
}

const NAV_LINKS = [
  { to: '/', label: 'الرئيسية', icon: Home },
  { to: '/products', label: 'المنتجات', icon: Package },
  { to: '/track', label: 'تتبع الطلب', icon: MapPin },
  { to: '/about', label: 'من نحن', icon: Info },
];

export default function Navbar() {
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const { data: logoUrl } = useStoreLogo();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: categories } = useCategories();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: storeName } = useQuery({
    queryKey: ['store-name'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'store_name').maybeSingle();
      return data?.value || 'DZ Store';
    },
    staleTime: 10 * 60 * 1000,
  });

  const displayName = storeName || 'جزيرة الطبيعة';

  const handleCatEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCatOpen(true);
  }, []);

  const handleCatLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setCatOpen(false), 150);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      {/* Main Nav */}
      <div className="bg-card/90 backdrop-blur-xl border-b">
        <div className="container flex items-center justify-between h-[60px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            {logoUrl ? (
              <img src={logoUrl} alt={displayName} className="w-9 h-9 rounded-lg object-contain transition-transform group-hover:scale-105" />
            ) : (
              <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
                <span className="text-primary-foreground font-cairo font-bold text-sm">🌴</span>
              </div>
            )}
            <span className="font-cairo font-bold text-lg text-foreground">{displayName}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map(link => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-cairo font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}

            {/* Categories dropdown trigger */}
            {categories && categories.length > 0 && (
              <div
                className="relative"
                onMouseEnter={handleCatEnter}
                onMouseLeave={handleCatLeave}
              >
                <button
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-cairo font-medium transition-all duration-200 ${
                    catOpen
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                  التصنيفات
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${catOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {catOpen && (
                  <div className="absolute top-full right-0 mt-1 w-72 bg-card border rounded-xl shadow-lg p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Link
                      to="/products"
                      onClick={() => setCatOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-cairo font-semibold transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                      <Grid3X3 className="w-4 h-4" />
                      الكل
                    </Link>
                    <div className="grid grid-cols-2 gap-0.5">
                      {categories.map(cat => {
                        const Icon = getCategoryIcon(cat.icon);
                        const isActive = location.search.includes(`category=${encodeURIComponent(cat.name)}`);
                        return (
                          <Link
                            key={cat.name}
                            to={`/products?category=${encodeURIComponent(cat.name)}`}
                            onClick={() => setCatOpen(false)}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-cairo font-medium transition-colors ${
                              isActive
                                ? 'text-primary bg-primary/10'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {cat.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('/products')}
              className="hidden md:flex p-2.5 rounded-xl hover:bg-muted transition-colors"
              aria-label="بحث"
            >
              <Search className="w-5 h-5 text-muted-foreground" />
            </button>

            {!loading && (
              <Link
                to={user ? '/dashboard' : '/auth'}
                className="p-2.5 rounded-xl hover:bg-muted transition-colors"
              >
                {user ? (
                  <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-primary" />
                  </div>
                ) : (
                  <LogIn className="w-5 h-5 text-muted-foreground" />
                )}
              </Link>
            )}

            <Link
              to="/cart"
              className="relative p-2.5 rounded-xl hover:bg-muted transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-foreground" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -left-0.5 w-5 h-5 bg-primary text-primary-foreground text-[11px] font-roboto rounded-full flex items-center justify-center font-bold shadow-sm animate-in zoom-in-50 duration-200">
                  {totalItems}
                </span>
              )}
            </Link>
            <Button variant="ghost" size="icon" className="md:hidden rounded-xl" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-b bg-card/95 backdrop-blur-xl animate-fade-in">
          <div className="container py-3 space-y-3">
            {categories && categories.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-2 border-b border-border/50">
                <Link
                  to="/products"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-cairo font-semibold whitespace-nowrap shrink-0 bg-primary/10 text-primary"
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  الكل
                </Link>
                {categories.map(cat => {
                  const Icon = getCategoryIcon(cat.icon);
                  return (
                    <Link
                      key={cat.name}
                      to={`/products?category=${encodeURIComponent(cat.name)}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-cairo font-semibold whitespace-nowrap shrink-0 bg-muted text-muted-foreground hover:text-foreground"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {cat.name}
                    </Link>
                  );
                })}
              </div>
            )}

            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map(link => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-cairo font-medium text-sm transition-colors ${
                      isActive
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
              <Link
                to={user ? '/dashboard' : '/auth'}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-cairo font-medium text-sm text-muted-foreground hover:bg-muted"
              >
                <User className="w-4 h-4" />
                {user ? 'حسابي' : 'تسجيل الدخول'}
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
