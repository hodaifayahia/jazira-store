import { Link } from 'react-router-dom';
import { ShoppingCart, Menu, X, Search, Home, Package, MapPin } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-cairo font-bold text-lg">DZ</span>
          </div>
          <span className="font-cairo font-bold text-xl text-foreground">DZ Store</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors font-cairo font-medium">
            <Home className="w-4 h-4" />
            الرئيسية
          </Link>
          <Link to="/products" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors font-cairo font-medium">
            <Package className="w-4 h-4" />
            المنتجات
          </Link>
          <Link to="/track" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors font-cairo font-medium">
            <MapPin className="w-4 h-4" />
            تتبع الطلب
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/cart" className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <ShoppingCart className="w-5 h-5 text-foreground" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -left-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-roboto rounded-full flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t bg-card animate-fade-in">
          <nav className="container py-4 flex flex-col gap-3">
            <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted font-cairo font-medium">
              <Home className="w-4 h-4" /> الرئيسية
            </Link>
            <Link to="/products" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted font-cairo font-medium">
              <Package className="w-4 h-4" /> المنتجات
            </Link>
            <Link to="/track" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted font-cairo font-medium">
              <MapPin className="w-4 h-4" /> تتبع الطلب
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
