import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Zap, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/format';

interface ProductQuickViewProps {
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProductQuickView({ productId, open, onOpenChange }: ProductQuickViewProps) {
  const { addItem, setCheckoutIntent } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [imgIndex, setImgIndex] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product-quickview', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open && !!productId,
  });

  const images = product?.images || [];
  const outOfStock = (product?.stock ?? 0) <= 0;
  const mainIdx = product?.main_image_index ?? 0;

  const handleAdd = () => {
    if (!product) return;
    addItem({ id: product.id, name: product.name, price: Number(product.price), image: images[mainIdx] || images[0] || '', stock: product.stock ?? 0, shippingPrice: Number(product.shipping_price ?? 0) });
    toast({ title: 'تمت الإضافة', description: `تمت إضافة "${product.name}" إلى السلة` });
  };

  const handleDirectOrder = () => {
    if (!product) return;
    setCheckoutIntent({
      type: 'direct',
      items: [{ id: product.id, name: product.name, price: Number(product.price), image: images[mainIdx] || images[0] || '', stock: product.stock ?? 0, quantity: 1, shippingPrice: Number(product.shipping_price ?? 0) }],
    });
    onOpenChange(false);
    navigate('/checkout');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">معاينة سريعة</DialogTitle>
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : product ? (
          <div className="flex flex-col md:flex-row">
            {/* Image */}
            <div className="relative w-full md:w-1/2 aspect-square bg-muted">
              {images.length > 0 ? (
                <img src={images[imgIndex]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ShoppingCart className="w-16 h-16" />
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIndex(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setImgIndex(i => (i + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setImgIndex(i)} className={`w-2 h-2 rounded-full transition-colors ${i === imgIndex ? 'bg-primary' : 'bg-background/60'}`} />
                    ))}
                  </div>
                </>
              )}
              {outOfStock && (
                <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
                  <Badge variant="destructive" className="font-cairo text-sm px-3 py-1">غير متوفر</Badge>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="w-full md:w-1/2 p-5 flex flex-col">
              <Badge className="self-start font-cairo bg-secondary text-secondary-foreground mb-2">{product.category}</Badge>
              <h2 className="font-cairo font-bold text-xl text-foreground mb-2">{product.name}</h2>
              <span className="font-roboto font-bold text-primary text-2xl mb-3">{formatPrice(Number(product.price))}</span>

              {product.description && (
                <p className="font-cairo text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-4">{product.description}</p>
              )}

              <div className="flex items-center gap-2 mb-4">
                <span className="font-cairo text-sm text-muted-foreground">المخزون:</span>
                <Badge variant={outOfStock ? 'destructive' : 'outline'} className="font-cairo">
                  {outOfStock ? 'غير متوفر' : `${product.stock} متوفر`}
                </Badge>
              </div>

              <div className="mt-auto space-y-2">
                <div className="flex gap-2">
                  <Button disabled={outOfStock} onClick={handleAdd} className="flex-1 font-cairo gap-1">
                    <ShoppingCart className="w-4 h-4" />
                    إضافة إلى السلة
                  </Button>
                  <Button disabled={outOfStock} onClick={handleDirectOrder} variant="outline" className="flex-1 font-cairo gap-1">
                    <Zap className="w-4 h-4" />
                    طلب مباشرة
                  </Button>
                </div>
                <Link to={`/product/${product.id}`} onClick={() => onOpenChange(false)}>
                  <Button variant="ghost" className="w-full font-cairo gap-1 text-muted-foreground">
                    <ExternalLink className="w-4 h-4" />
                    عرض التفاصيل الكاملة
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
