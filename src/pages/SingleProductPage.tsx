import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { ShoppingCart, Minus, Plus, ChevronRight, ArrowRight, Zap } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

export default function SingleProductPage() {
  const { id } = useParams<{ id: string }>();
  const { addItem, setCheckoutIntent } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').eq('id', id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  usePageTitle(product ? `${product.name} - DZ Store` : 'DZ Store');

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-16 text-center space-y-4">
        <p className="font-cairo text-xl text-muted-foreground">المنتج غير موجود</p>
        <Link to="/products" className="inline-flex items-center gap-2 font-cairo text-primary hover:underline">
          <ArrowRight className="w-4 h-4" />
          العودة إلى المنتجات
        </Link>
      </div>
    );
  }

  const images = product.images || [];
  const outOfStock = (product.stock ?? 0) <= 0;
  const mainIdx = product.main_image_index ?? 0;
  const categories = Array.isArray(product.category) ? product.category : [product.category];

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) {
      addItem({ id: product.id, name: product.name, price: Number(product.price), image: images[mainIdx] || images[0] || '', stock: product.stock ?? 0, shippingPrice: Number(product.shipping_price ?? 0) });
    }
    toast({ title: 'تمت الإضافة إلى السلة ✅', description: `تمت إضافة "${product.name}" (×${qty}) إلى السلة` });
  };

  const handleDirectOrder = () => {
    setCheckoutIntent({
      type: 'direct',
      items: [{
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image: images[mainIdx] || images[0] || '',
        stock: product.stock ?? 0,
        quantity: qty,
        shippingPrice: Number(product.shipping_price ?? 0),
      }],
    });
    navigate('/checkout');
  };

  return (
    <div className="container py-8">
      <Link to="/products" className="inline-flex items-center gap-2 font-cairo text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowRight className="w-4 h-4" />
        العودة إلى المنتجات
      </Link>

      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 font-cairo">
        <Link to="/" className="hover:text-foreground">الرئيسية</Link>
        <ChevronRight className="w-3 h-3 rotate-180" />
        <Link to="/products" className="hover:text-foreground">المنتجات</Link>
        <ChevronRight className="w-3 h-3 rotate-180" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-3">
            {images[(selectedImage ?? mainIdx)] ? (
              <img src={images[(selectedImage ?? mainIdx)]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <ShoppingCart className="w-16 h-16" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)} className={`w-16 h-16 rounded-md overflow-hidden border-2 shrink-0 ${i === (selectedImage ?? mainIdx) ? 'border-primary' : 'border-transparent'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-1 mb-1">
            {categories.map(cat => (
              <Badge key={cat} className="font-cairo bg-secondary text-secondary-foreground">{cat}</Badge>
            ))}
          </div>
          <h1 className="font-cairo font-bold text-3xl text-foreground">{product.name}</h1>
          <p className="font-roboto font-bold text-2xl text-primary">{formatPrice(Number(product.price))}</p>
          
          {outOfStock ? (
            <Badge variant="destructive" className="font-cairo">غير متوفر حالياً</Badge>
          ) : (
            <p className="font-cairo text-sm text-success">متوفر في المخزون ({product.stock} قطعة)</p>
          )}

          {product.description && (
            <p className="font-cairo text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          {!outOfStock && (
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-lg">
                  <Button variant="ghost" size="icon" onClick={() => setQty(q => Math.max(1, q - 1))}><Minus className="w-4 h-4" /></Button>
                  <span className="w-10 text-center font-roboto font-bold">{qty}</span>
                  <Button variant="ghost" size="icon" onClick={() => setQty(q => Math.min(product.stock ?? 1, q + 1))}><Plus className="w-4 h-4" /></Button>
                </div>
                <Button onClick={handleAdd} className="font-cairo font-semibold gap-2 flex-1" variant="outline">
                  <ShoppingCart className="w-4 h-4" />
                  إضافة إلى السلة
                </Button>
              </div>
              <Button onClick={handleDirectOrder} className="font-cairo font-semibold gap-2 w-full">
                <Zap className="w-4 h-4" />
                طلب مباشرة
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
