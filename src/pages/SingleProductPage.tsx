import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { ShoppingCart, Minus, Plus, ChevronRight, ArrowRight, Zap, Star, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/contexts/CartContext';
import { formatPrice, formatDate } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(i)}
          className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          <Star className={`w-5 h-5 ${i <= value ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
        </button>
      ))}
    </div>
  );
}

export default function SingleProductPage() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  // Review form state
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').eq('id', id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', id!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('reviews').insert({
        product_id: id!,
        reviewer_name: reviewName,
        rating: reviewRating,
        comment: reviewComment || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', id] });
      setReviewName('');
      setReviewRating(5);
      setReviewComment('');
      toast({ title: 'شكراً لتقييمك! ⭐' });
    },
    onError: () => {
      toast({ title: 'حدث خطأ، حاول مرة أخرى', variant: 'destructive' });
    },
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
  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

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
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted mb-3">
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
                <button key={i} onClick={() => setSelectedImage(i)} className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-colors ${i === selectedImage ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(Array.isArray(product.category) ? product.category : [product.category]).map((c: string) => (
              <Badge key={c} className="font-cairo bg-secondary text-secondary-foreground">{c}</Badge>
            ))}
          </div>
          <h1 className="font-cairo font-bold text-3xl text-foreground">{product.name}</h1>

          {/* Rating summary */}
          {reviews && reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <StarRating value={Math.round(avgRating)} readonly />
              <span className="font-roboto font-bold text-sm">{avgRating.toFixed(1)}</span>
              <span className="font-cairo text-sm text-muted-foreground">({reviews.length} تقييم)</span>
            </div>
          )}

          <p className="font-roboto font-bold text-3xl text-primary">{formatPrice(Number(product.price))}</p>

          {outOfStock ? (
            <Badge variant="destructive" className="font-cairo">غير متوفر حالياً</Badge>
          ) : (
            <p className="font-cairo text-sm text-primary">متوفر في المخزون ({product.stock} قطعة)</p>
          )}

          {product.description && (
            <p className="font-cairo text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          {!outOfStock && (
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-xl">
                  <Button variant="ghost" size="icon" onClick={() => setQty(q => Math.max(1, q - 1))} className="rounded-xl"><Minus className="w-4 h-4" /></Button>
                  <span className="w-10 text-center font-roboto font-bold">{qty}</span>
                  <Button variant="ghost" size="icon" onClick={() => setQty(q => Math.min(product.stock ?? 1, q + 1))} className="rounded-xl"><Plus className="w-4 h-4" /></Button>
                </div>
                <Button onClick={handleAdd} variant="outline" className="font-cairo font-semibold gap-2 flex-1 rounded-xl">
                  <ShoppingCart className="w-4 h-4" />
                  إضافة إلى السلة
                </Button>
              </div>
              <Button
                onClick={() => {
                  for (let i = 0; i < qty; i++) {
                    addItem({ id: product.id, name: product.name, price: Number(product.price), image: images[0] || '', stock: product.stock ?? 0 });
                  }
                  navigate('/checkout');
                }}
                className="w-full font-cairo font-semibold gap-2 rounded-xl"
              >
                <Zap className="w-4 h-4" />
                طلب مباشرة
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Rich Product Details ─── */}
      {product.description && images.length > 1 && (
        <section className="mt-16">
          <h2 className="font-cairo font-bold text-2xl mb-8 text-foreground">تفاصيل المنتج</h2>
          <div className="space-y-12">
            {images.map((img, i) => (
              <div key={i} className={`flex flex-col md:flex-row gap-8 items-center ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                <div className="w-full md:w-1/2">
                  <img src={img} alt={`${product.name} - ${i + 1}`} className="rounded-2xl w-full aspect-[4/3] object-cover" />
                </div>
                <div className="w-full md:w-1/2">
                  {i === 0 && (
                    <div>
                      <h3 className="font-cairo font-bold text-xl mb-3">{product.name}</h3>
                      <p className="font-cairo text-muted-foreground leading-relaxed">{product.description}</p>
                    </div>
                  )}
                  {i > 0 && (
                    <div className="bg-muted/50 rounded-2xl p-6">
                      <p className="font-cairo text-muted-foreground leading-relaxed">
                        صورة توضيحية {i + 1} للمنتج
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Reviews Section ─── */}
      <section className="mt-16 mb-8">
        <h2 className="font-cairo font-bold text-2xl mb-6 text-foreground flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          التقييمات ({reviews?.length || 0})
        </h2>

        {/* Add Review Form */}
        <div className="bg-card border rounded-2xl p-6 mb-8">
          <h3 className="font-cairo font-bold text-lg mb-4">أضف تقييمك</h3>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  value={reviewName}
                  onChange={e => setReviewName(e.target.value)}
                  placeholder="اسمك"
                  className="font-cairo"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-cairo text-sm text-muted-foreground">تقييمك:</span>
                <StarRating value={reviewRating} onChange={setReviewRating} />
              </div>
            </div>
            <Textarea
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
              placeholder="اكتب تعليقك هنا... (اختياري)"
              className="font-cairo"
              rows={3}
            />
            <Button
              onClick={() => {
                if (!reviewName.trim()) {
                  toast({ title: 'يرجى إدخال اسمك', variant: 'destructive' });
                  return;
                }
                submitReview.mutate();
              }}
              disabled={submitReview.isPending}
              className="font-cairo font-semibold gap-2 rounded-xl"
            >
              {submitReview.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              إرسال التقييم
            </Button>
          </div>
        </div>

        {/* Reviews list */}
        {reviews && reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review.id} className="bg-muted/30 border rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-cairo font-bold text-sm text-primary">{review.reviewer_name[0]}</span>
                    </div>
                    <div>
                      <p className="font-cairo font-semibold text-sm">{review.reviewer_name}</p>
                      <p className="font-cairo text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                    </div>
                  </div>
                  <StarRating value={review.rating} readonly />
                </div>
                {review.comment && (
                  <p className="font-cairo text-sm text-muted-foreground leading-relaxed mt-2">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="font-cairo text-muted-foreground">لا توجد تقييمات بعد. كن أول من يقيّم هذا المنتج!</p>
          </div>
        )}
      </section>
    </div>
  );
}
