import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Minus, Plus, ChevronRight, ChevronLeft, ArrowRight, Zap, Star, Send, Loader2 } from 'lucide-react';
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
  const [isZoomed, setIsZoomed] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const actionAreaRef = useRef<HTMLDivElement>(null);

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

  // Sticky bar observer
  useEffect(() => {
    if (!actionAreaRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(actionAreaRef.current);
    return () => observer.disconnect();
  }, [product]);

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

  const handleDirectOrder = () => {
    for (let i = 0; i < qty; i++) {
      addItem({ id: product.id, name: product.name, price: Number(product.price), image: images[0] || '', stock: product.stock ?? 0 });
    }
    navigate('/checkout');
  };

  const goToPrevImage = () => setSelectedImage(i => (i === 0 ? images.length - 1 : i - 1));
  const goToNextImage = () => setSelectedImage(i => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div className="container py-8 pb-28">
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
        {/* Images - Enhanced Gallery */}
        <div className="flex flex-col-reverse md:flex-row gap-3">
          {/* Thumbnails - vertical on desktop, horizontal on mobile */}
          {images.length > 1 && (
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[500px] md:w-20 shrink-0">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 md:w-full md:h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    i === selectedImage ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-muted-foreground/30'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main image with zoom & arrows */}
          <div className="flex-1 relative group">
            <div
              className="aspect-square rounded-2xl overflow-hidden bg-muted cursor-zoom-in"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
            >
              {images[selectedImage] ? (
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className={`w-full h-full object-cover transition-transform duration-500 ${isZoomed ? 'scale-150' : 'scale-100'}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ShoppingCart className="w-16 h-16" />
                </div>
              )}
            </div>

            {/* Image counter */}
            {images.length > 1 && (
              <span className="absolute top-3 left-3 bg-foreground/60 backdrop-blur-sm text-background text-xs font-roboto font-bold rounded-full px-2.5 py-1">
                {selectedImage + 1}/{images.length}
              </span>
            )}

            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goToNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-background"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={goToPrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-background"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div className="bg-card border rounded-2xl p-6 space-y-4">
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
          </div>

          {!outOfStock && (
            <div ref={actionAreaRef} className="bg-card border rounded-2xl p-6 space-y-3">
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
                onClick={handleDirectOrder}
                className="w-full font-cairo font-semibold gap-2 rounded-xl"
              >
                <Zap className="w-4 h-4" />
                طلب مباشرة
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Rich Product Details - Masonry Grid ─── */}
      {product.description && images.length > 1 && (
        <section className="mt-16">
          <h2 className="font-cairo font-bold text-2xl mb-4 text-foreground">تفاصيل المنتج</h2>
          <p className="font-cairo text-muted-foreground leading-relaxed mb-6 max-w-2xl">{product.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {images.map((img, i) => (
              <div key={i} className={`rounded-2xl overflow-hidden shadow-sm border ${i === 0 ? 'md:col-span-2' : ''}`}>
                <img src={img} alt={`${product.name} - ${i + 1}`} className="w-full aspect-[4/3] object-cover hover:scale-105 transition-transform duration-500" />
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

      {/* ─── Sticky Bottom Bar ─── */}
      {!outOfStock && showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          <div className="container flex items-center gap-3 py-3">
            <div className="flex-1 min-w-0 hidden sm:block">
              <p className="font-cairo font-semibold text-sm truncate">{product.name}</p>
              <p className="font-roboto font-bold text-primary text-sm">{formatPrice(Number(product.price))}</p>
            </div>
            <div className="flex items-center border rounded-xl shrink-0">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setQty(q => Math.max(1, q - 1))}>
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <span className="w-8 text-center font-roboto font-bold text-sm">{qty}</span>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setQty(q => Math.min(product.stock ?? 1, q + 1))}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            <Button onClick={handleAdd} variant="outline" className="font-cairo text-sm gap-1.5 rounded-xl h-10 shrink-0">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">سلة</span>
            </Button>
            <Button onClick={handleDirectOrder} className="font-cairo font-semibold text-sm gap-1.5 rounded-xl h-10 flex-1 sm:flex-none sm:px-6">
              <Zap className="w-4 h-4" />
              اطلب الآن
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
