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
  category: string | string[];
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
      <div className="bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
              <ShoppingCart className="w-10 h-10" />
            </div>
          )}

          {outOfStock && (
            <div className="absolute inset-0 bg-foreground/50 backdrop-blur-[2px] flex items-center justify-center">
              <Badge variant="destructive" className="font-cairo text-sm px-4 py-1.5 rounded-full">غير متوفر</Badge>
            </div>
          )}

          <Badge className="absolute top-2.5 right-2.5 font-cairo text-[11px] bg-foreground/70 backdrop-blur-sm text-background border-0 rounded-full px-2.5 py-0.5">
            {Array.isArray(category) ? category[0] : category}
          </Badge>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <h3 className="font-cairo font-semibold text-foreground text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
            {name}
          </h3>
          <div className="flex items-center justify-between gap-2">
            <span className="font-roboto font-bold text-primary text-lg tracking-tight">
              {formatPrice(price)}
            </span>
            <Button
              size="sm"
              disabled={outOfStock}
              onClick={handleAdd}
              className="font-cairo text-xs gap-1.5 rounded-xl h-8 px-3 shadow-sm hover:shadow transition-shadow"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              إضافة
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
