import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Home, Package, MapPin, User, LogIn } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useStoreLogo } from '@/hooks/useStoreLogo';
import { useAuth } from '@/hooks/useAuth';

const NAV_LINKS = [
  { to: '/', label: 'الرئيسية', icon: Home },
  { to: '/products', label: 'المنتجات', icon: Package },
  { to: '/track', label: 'تتبع الطلب', icon: MapPin },
];

export default function Navbar() {
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: logoUrl } = useStoreLogo();
  const location = useLocation();
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          {logoUrl ? (
            <img src={logoUrl} alt="DZ Store" className="w-9 h-9 rounded-lg object-contain" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-cairo font-bold text-base">DZ</span>
            </div>
          )}
          <span className="font-cairo font-bold text-lg text-foreground">DZ Store</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(link => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-cairo font-medium transition-colors ${
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
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {/* Auth */}
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
              <span className="absolute -top-0.5 -left-0.5 w-5 h-5 bg-primary text-primary-foreground text-[11px] font-roboto rounded-full flex items-center justify-center font-bold shadow-sm">
                {totalItems}
              </span>
            )}
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden rounded-xl" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t bg-card/95 backdrop-blur-xl animate-fade-in">
          <nav className="container py-3 flex flex-col gap-1">
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
      )}
    </header>
  );
}
