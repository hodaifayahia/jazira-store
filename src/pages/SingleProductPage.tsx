import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { ShoppingCart, Minus, Plus, ChevronRight, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

export default function SingleProductPage() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').eq('id', id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

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

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) {
      addItem({ id: product.id, name: product.name, price: Number(product.price), image: images[0] || '', stock: product.stock ?? 0 });
    }
    toast({ title: 'تمت الإضافة إلى السلة ✅', description: `تمت إضافة "${product.name}" (×${qty}) إلى السلة` });
  };

  return (
    <div className="container py-8">
      {/* Back link */}
      <Link to="/products" className="inline-flex items-center gap-2 font-cairo text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowRight className="w-4 h-4" />
        العودة إلى المنتجات
      </Link>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 font-cairo">
        <Link to="/" className="hover:text-foreground">الرئيسية</Link>
        <ChevronRight className="w-3 h-3 rotate-180" />
        <Link to="/products" className="hover:text-foreground">المنتجات</Link>
        <ChevronRight className="w-3 h-3 rotate-180" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-3">
            {images[selectedImage] ? (
              <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <ShoppingCart className="w-16 h-16" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)} className={`w-16 h-16 rounded-md overflow-hidden border-2 shrink-0 ${i === selectedImage ? 'border-primary' : 'border-transparent'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <Badge className="font-cairo bg-secondary text-secondary-foreground">{Array.isArray(product.category) ? product.category.join(', ') : product.category}</Badge>
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
            <div className="flex items-center gap-4 pt-4">
              <div className="flex items-center border rounded-lg">
                <Button variant="ghost" size="icon" onClick={() => setQty(q => Math.max(1, q - 1))}><Minus className="w-4 h-4" /></Button>
                <span className="w-10 text-center font-roboto font-bold">{qty}</span>
                <Button variant="ghost" size="icon" onClick={() => setQty(q => Math.min(product.stock ?? 1, q + 1))}><Plus className="w-4 h-4" /></Button>
              </div>
              <Button onClick={handleAdd} className="font-cairo font-semibold gap-2 flex-1">
                <ShoppingCart className="w-4 h-4" />
                إضافة إلى السلة
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
