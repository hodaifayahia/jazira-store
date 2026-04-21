import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, Home, Package, MapPin, User, LogIn, Info, Search, Shirt, Watch, Footprints, Smartphone, Home as HomeIcon, Grid3X3, ChevronDown, Heart, LayoutDashboard, HelpCircle, type LucideIcon } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useStoreLogo } from '@/hooks/useStoreLogo';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import SmartSearch from '@/components/SmartSearch';
import { useTranslation, type Language } from '@/i18n';

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

export default function Navbar() {
  const { totalItems } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: logoUrl, isLoading: logoLoading } = useStoreLogo();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: categories } = useCategories();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { t, language, setLanguage } = useTranslation();

  const NAV_LINKS = [
    { to: '/', label: t('public.nav.home'), icon: Home },
    { to: '/products', label: t('public.nav.products'), icon: Package },
    { to: '/categories', label: t('public.nav.categories'), icon: Grid3X3 },
    { to: '/faq', label: t('public.nav.faq'), icon: HelpCircle },
    { to: '/track', label: t('public.nav.track'), icon: MapPin },
    { to: '/about', label: t('public.nav.about'), icon: Info },
  ];

  const { data: storeName } = useQuery({
    queryKey: ['store-name'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'store_name').maybeSingle();
      return data?.value || 'SloutionsHub';
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: isAdmin } = useQuery({
    queryKey: ['navbar-is-admin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      return !!data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const displayName = storeName || 'SloutionsHub';

  const handleCatEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCatOpen(true);
  }, []);

  const handleCatLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setCatOpen(false), 150);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Main Nav */}
      <div className="bg-card/90 backdrop-blur-xl border-b">
        <div className="container flex items-center justify-between h-[60px] gap-4">
          {/* Logo + Search */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt={displayName} className="w-9 h-9 rounded-lg object-contain transition-transform group-hover:scale-105" />
              ) : (
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center transition-transform group-hover:scale-105 shadow-md shadow-violet-500/20">
                  <span className="text-primary-foreground font-bold text-sm">S</span>
                </div>
              )}
              <span className="font-space font-bold text-lg text-foreground">{displayName}</span>
            </Link>

            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex shrink-0">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('productsPage.searchPlaceholder')}
                  className="w-48 pr-9 pl-3 py-2 rounded-xl bg-muted/50 border border-border/50 text-sm placeholder:text-muted-foreground hover:border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200 text-foreground"
                />
              </div>
            </form>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {NAV_LINKS.map(link => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
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
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    catOpen
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                  الفئات
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${catOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {catOpen && (
                  <div className="absolute top-full left-0 mt-1 w-72 bg-card border rounded-xl shadow-lg p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Link
                      to="/products"
                      onClick={() => setCatOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
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
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
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
          <div className="flex items-center gap-1 shrink-0">
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

            {/* Admin Dashboard button - visible only for admin users */}
            {!loading && user && isAdmin && (
              <Link
                to="/admin"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                title={t('public.nav.admin')}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                {t('public.nav.admin')}
              </Link>
            )}

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="hidden md:block h-9 rounded-xl border border-border bg-background px-2 text-xs font-medium text-foreground"
              aria-label={t('landing.language')}
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>

            <Link
              to="/wishlist"
              className="relative p-2.5 rounded-xl hover:bg-muted transition-colors"
              aria-label={t('public.nav.wishlist')}
            >
              <Heart className={`w-5 h-5 ${wishlistCount > 0 ? 'text-destructive fill-destructive' : 'text-muted-foreground'}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-white text-[10px] font-roboto rounded-full flex items-center justify-center font-bold shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              to="/cart"
              className="relative p-2.5 rounded-xl hover:bg-muted transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-foreground" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-primary-foreground text-[11px] font-roboto rounded-full flex items-center justify-center font-bold shadow-sm animate-in zoom-in-50 duration-200">
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
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="flex">
              <div className="relative w-full">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('productsPage.searchPlaceholder')}
                  className="w-full pr-9 pl-3 py-2 rounded-xl bg-muted/50 border border-border/50 text-sm placeholder:text-muted-foreground hover:border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200 text-foreground"
                />
              </div>
            </form>

            {categories && categories.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-2 border-b border-border/50">
                <Link
                  to="/products"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 bg-primary/10 text-primary"
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  {t('common.all')}
                </Link>
                {categories.map(cat => {
                  const Icon = getCategoryIcon(cat.icon);
                  return (
                    <Link
                      key={cat.name}
                      to={`/products?category=${encodeURIComponent(cat.name)}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 bg-muted text-muted-foreground hover:text-foreground"
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
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
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
                to="/wishlist"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium text-sm text-muted-foreground hover:bg-muted"
              >
                <Heart className={`w-4 h-4 ${wishlistCount > 0 ? 'text-destructive fill-destructive' : ''}`} />
                {t('public.nav.wishlist')} {wishlistCount > 0 && `(${wishlistCount})`}
              </Link>
              <Link
                to={user ? '/dashboard' : '/auth'}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium text-sm text-muted-foreground hover:bg-muted"
              >
                <User className="w-4 h-4" />
                {user ? t('public.nav.account') : t('public.nav.login')}
              </Link>
              {user && isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold text-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {t('public.nav.admin')}
                </Link>
              )}

              <div className="pt-2 border-t border-border/50 mt-1">
                <label className="text-xs text-muted-foreground mb-1 block">{t('landing.language')}</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground"
                  aria-label={t('landing.language')}
                >
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </nav>
          </div>
        </div>
      )}
      {/* Smart Search Modal */}
      {searchOpen && <SmartSearch onClose={() => setSearchOpen(false)} />}
    </header>
  );
}
