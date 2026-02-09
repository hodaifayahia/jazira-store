import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

export default function ProductCard({ id, name, price, image, category, stock }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const outOfStock = stock <= 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ id, name, price, image, stock });
    toast({ title: 'تمت الإضافة', description: `تمت إضافة "${name}" إلى السلة` });
  };

  return (
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
        </div>
        <div className="p-4">
          <h3 className="font-cairo font-semibold text-foreground line-clamp-2 mb-2">{name}</h3>
          <div className="flex items-center justify-between gap-2">
            <span className="font-roboto font-bold text-primary text-lg">{formatPrice(price)}</span>
            <Button size="sm" disabled={outOfStock} onClick={handleAdd} className="font-cairo text-xs gap-1">
              <ShoppingCart className="w-3.5 h-3.5" />
              إضافة
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
