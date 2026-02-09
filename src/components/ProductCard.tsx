import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Zap, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import ProductQuickView from '@/components/ProductQuickView';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

export default function ProductCard({ id, name, price, image, category, stock }: ProductCardProps) {
  const { addItem, setCheckoutIntent } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const outOfStock = stock <= 0;
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ id, name, price, image, stock });
    toast({ title: 'تمت الإضافة', description: `تمت إضافة "${name}" إلى السلة` });
  };

  const handleDirectOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCheckoutIntent({
      type: 'direct',
      items: [{ id, name, price, image, stock, quantity: 1 }],
    });
    navigate('/checkout');
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewOpen(true);
  };

  return (
    <>
      <Link to={`/product/${id}`} className="group block animate-fade-in">
        <div className="bg-card rounded-lg border overflow-hidden hover:shadow-lg transition-all duration-300">
          <div className="relative aspect-square overflow-hidden bg-muted">
            {image ? (
              <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <ShoppingCart className="w-12 h-12" />
              </div>
            )}
            {outOfStock && (
              <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
                <Badge variant="destructive" className="font-cairo text-sm px-3 py-1">غير متوفر</Badge>
              </div>
            )}
            <Badge className="absolute top-2 right-2 font-cairo bg-secondary text-secondary-foreground">{category}</Badge>
            {/* Quick view button */}
            <button
              onClick={handleQuickView}
              className="absolute top-2 left-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 max-sm:opacity-70 transition-opacity hover:bg-background"
            >
              <Eye className="w-4 h-4 text-foreground" />
            </button>
          </div>
          <div className="p-4">
            <h3 className="font-cairo font-semibold text-foreground line-clamp-2 mb-2">{name}</h3>
            {/* Mobile: stack price above buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="font-roboto font-bold text-primary text-lg">{formatPrice(price)}</span>
              <div className="flex gap-1">
                <Button size="sm" disabled={outOfStock} onClick={handleAdd} className="font-cairo text-xs gap-1 flex-1 sm:flex-initial" variant="outline">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  السلة
                </Button>
                <Button size="sm" disabled={outOfStock} onClick={handleDirectOrder} className="font-cairo text-xs gap-1 flex-1 sm:flex-initial">
                  <Zap className="w-3.5 h-3.5" />
                  طلب مباشرة
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Link>
      <ProductQuickView productId={id} open={quickViewOpen} onOpenChange={setQuickViewOpen} />
    </>
  );
}
