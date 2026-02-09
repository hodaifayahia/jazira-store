import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { ShoppingCart, Minus, Plus, ChevronRight, ChevronLeft, ArrowRight, Star, Send, Loader2, Copy, Truck, CheckCircle, Upload, User, MapPin, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCart, type CartItemVariation } from '@/contexts/CartContext';
import { formatPrice, formatDate } from '@/lib/format';
import { calculateShippingForOrder } from '@/lib/shipping';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
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
  const { user } = useAuth();
  const qc = useQueryClient();
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Review form state
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Inline order form state
  const [orderName, setOrderName] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [orderWilayaId, setOrderWilayaId] = useState('');
  const [orderAddress, setOrderAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const { data: wilayas } = useQuery({
    queryKey: ['wilayas'],
    queryFn: async () => {
      const { data } = await supabase.from('wilayas').select('*').eq('is_active', true).order('name');
      return data || [];
    },
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('*');
      const map: Record<string, string> = {};
      data?.forEach(s => { map[s.key] = s.value || ''; });
      return map;
    },
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

  const goToPrevImage = () => setSelectedImage(i => (i === 0 ? images.length - 1 : i - 1));
  const goToNextImage = () => setSelectedImage(i => (i === images.length - 1 ? 0 : i + 1));

  // Inline order calculations
  const selectedWilaya = wilayas?.find(w => w.id === orderWilayaId);
  const wilayaBaseRate = selectedWilaya ? Number(selectedWilaya.shipping_price) : 0;
  const productShippingRate = Number(product.shipping_price) || 0;
  const shippingRate = productShippingRate > 0 ? productShippingRate : wilayaBaseRate;
  const shippingCost = shippingRate * qty;
  const itemSubtotal = Number(product.price) * qty;
  const orderTotal = itemSubtotal + shippingCost;

  const baridimobEnabled = settings?.baridimob_enabled === 'true';
  const flexyEnabled = settings?.flexy_enabled === 'true';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'تم النسخ' });
  };

  const handleDirectOrder = async () => {
    const newErrors: Record<string, string> = {};
    if (!orderName.trim()) newErrors.orderName = 'يرجى إدخال الاسم الكامل';
    if (!orderPhone.trim()) newErrors.orderPhone = 'يرجى إدخال رقم الهاتف';
    else if (!/^0[567]\d{8}$/.test(orderPhone)) newErrors.orderPhone = 'رقم الهاتف غير صالح (مثال: 05XXXXXXXX)';
    if (!orderWilayaId) newErrors.orderWilayaId = 'يرجى اختيار الولاية';
    if (!paymentMethod) newErrors.paymentMethod = 'يرجى اختيار طريقة الدفع';
    if ((paymentMethod === 'baridimob' || paymentMethod === 'flexy') && !receiptFile) newErrors.receiptFile = 'يرجى إرفاق إيصال الدفع';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmittingOrder(true);
    try {
      let receiptUrl = '';
      if (receiptFile) {
        const ext = receiptFile.name.split('.').pop();
        const filePath = `${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('receipts').upload(filePath, receiptFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(filePath);
        receiptUrl = urlData.publicUrl;
      }

      const { data: order, error } = await supabase.from('orders').insert({
        order_number: '',
        customer_name: orderName,
        customer_phone: orderPhone,
        wilaya_id: orderWilayaId,
        address: orderAddress || null,
        subtotal: itemSubtotal,
        shipping_cost: shippingCost,
        total_amount: orderTotal,
        payment_method: paymentMethod,
        payment_receipt_url: receiptUrl || null,
        user_id: user?.id || null,
      }).select().single();
      if (error) throw error;

      await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: product.id,
        quantity: qty,
        unit_price: Number(product.price),
      });

      navigate(`/order-confirmation/${order.order_number}`);
    } catch (err) {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء إرسال الطلب', variant: 'destructive' });
    } finally {
      setSubmittingOrder(false);
    }
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

        {/* Info + Order Form */}
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

          {/* Quantity + Add to Cart */}
          {!outOfStock && (
            <div className="bg-card border rounded-2xl p-6 space-y-3">
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
            </div>
          )}

          {/* ─── Inline Order Form ─── */}
          {!outOfStock && (
            <div className="bg-card border-2 border-primary/20 rounded-2xl p-6 space-y-5">
              <h2 className="font-cairo font-bold text-xl flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                اطلب الآن مباشرة
              </h2>
              <p className="font-cairo text-sm text-muted-foreground">أكمل بياناتك وسنوصلك طلبك بأسرع وقت</p>

              {/* Step 1: User Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold font-roboto shrink-0">1</div>
                  <User className="w-4 h-4 text-primary" />
                  <span className="font-cairo font-semibold text-sm">المعلومات الشخصية</span>
                </div>
                <div>
                  <Label className="font-cairo text-sm">الاسم الكامل *</Label>
                  <Input
                    value={orderName}
                    onChange={e => { setOrderName(e.target.value); setErrors(prev => ({ ...prev, orderName: '' })); }}
                    placeholder="أدخل اسمك الكامل"
                    className={`font-cairo mt-1 ${errors.orderName ? 'border-destructive' : ''}`}
                  />
                  {errors.orderName && <p className="text-destructive text-xs font-cairo mt-1">{errors.orderName}</p>}
                </div>
                <div>
                  <Label className="font-cairo text-sm">رقم الهاتف *</Label>
                  <Input
                    value={orderPhone}
                    onChange={e => { setOrderPhone(e.target.value); setErrors(prev => ({ ...prev, orderPhone: '' })); }}
                    placeholder="05XXXXXXXX"
                    className={`font-roboto mt-1 ${errors.orderPhone ? 'border-destructive' : ''}`}
                    dir="ltr"
                  />
                  {errors.orderPhone && <p className="text-destructive text-xs font-cairo mt-1">{errors.orderPhone}</p>}
                </div>
              </div>

              <hr className="border-border" />

              {/* Step 2: Delivery */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold font-roboto shrink-0">2</div>
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-cairo font-semibold text-sm">التوصيل</span>
                </div>
                <div>
                  <Label className="font-cairo text-sm">الولاية *</Label>
                  <Select value={orderWilayaId} onValueChange={v => { setOrderWilayaId(v); setErrors(prev => ({ ...prev, orderWilayaId: '' })); }}>
                    <SelectTrigger className={`font-cairo mt-1 ${errors.orderWilayaId ? 'border-destructive' : ''}`}><SelectValue placeholder="اختر الولاية" /></SelectTrigger>
                    <SelectContent>
                      {wilayas?.map(w => (
                        <SelectItem key={w.id} value={w.id} className="font-cairo">
                          {w.name} — {formatPrice(Number(w.shipping_price))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.orderWilayaId && <p className="text-destructive text-xs font-cairo mt-1">{errors.orderWilayaId}</p>}
                </div>
                <div>
                  <Label className="font-cairo text-sm">العنوان التفصيلي</Label>
                  <Input value={orderAddress} onChange={e => setOrderAddress(e.target.value)} placeholder="اختياري" className="font-cairo mt-1" />
                </div>
              </div>

              <hr className="border-border" />

              {/* Step 3: Payment */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold font-roboto shrink-0">3</div>
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span className="font-cairo font-semibold text-sm">طريقة الدفع</span>
                </div>
                <div className="space-y-2">
                  {baridimobEnabled && (
                    <label className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors text-sm ${paymentMethod === 'baridimob' ? 'border-primary bg-accent' : ''}`}>
                      <input type="radio" name="inline-payment" value="baridimob" checked={paymentMethod === 'baridimob'} onChange={e => { setPaymentMethod(e.target.value); setErrors(prev => ({ ...prev, paymentMethod: '', receiptFile: '' })); }} className="mt-0.5" />
                      <div className="flex-1">
                        <span className="font-cairo font-semibold">بريدي موب</span>
                        {paymentMethod === 'baridimob' && settings && (
                          <div className="mt-2 space-y-1.5 text-xs">
                            <div className="flex items-center gap-2 bg-muted p-2 rounded-lg">
                              <span className="font-cairo">الحساب:</span>
                              <span className="font-roboto font-bold">{settings.ccp_number}</span>
                              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => copyToClipboard(settings.ccp_number)}><Copy className="w-3 h-3" /></Button>
                            </div>
                            <p className="font-cairo">الاسم: {settings.ccp_name}</p>
                            <div className="mt-1.5">
                              <Label className="font-cairo text-[11px]">أرفق الإيصال *</Label>
                              <Input type="file" accept="image/*,.pdf" onChange={e => { setReceiptFile(e.target.files?.[0] || null); setErrors(prev => ({ ...prev, receiptFile: '' })); }} className={`mt-0.5 h-8 text-xs ${errors.receiptFile ? 'border-destructive' : ''}`} />
                              {errors.receiptFile && <p className="text-destructive text-xs font-cairo mt-1">{errors.receiptFile}</p>}
                            </div>
                          </div>
                        )}
                      </div>
                    </label>
                  )}

                  {flexyEnabled && (
                    <label className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors text-sm ${paymentMethod === 'flexy' ? 'border-primary bg-accent' : ''}`}>
                      <input type="radio" name="inline-payment" value="flexy" checked={paymentMethod === 'flexy'} onChange={e => { setPaymentMethod(e.target.value); setErrors(prev => ({ ...prev, paymentMethod: '', receiptFile: '' })); }} className="mt-0.5" />
                      <div className="flex-1">
                        <span className="font-cairo font-semibold">فليكسي</span>
                        {paymentMethod === 'flexy' && settings && (
                          <div className="mt-2 space-y-1.5 text-xs">
                            <p className="font-cairo">أرسل تعبئة <span className="font-roboto font-bold">{formatPrice(Number(settings.flexy_deposit_amount || 500))}</span> إلى:</p>
                            <div className="flex items-center gap-2 bg-muted p-2 rounded-lg">
                              <span className="font-roboto font-bold">{settings.flexy_number}</span>
                              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => copyToClipboard(settings.flexy_number)}><Copy className="w-3 h-3" /></Button>
                            </div>
                            <div className="mt-1.5">
                              <Label className="font-cairo text-[11px]">أرفق لقطة الشاشة *</Label>
                              <Input type="file" accept="image/*" onChange={e => { setReceiptFile(e.target.files?.[0] || null); setErrors(prev => ({ ...prev, receiptFile: '' })); }} className={`mt-0.5 h-8 text-xs ${errors.receiptFile ? 'border-destructive' : ''}`} />
                              {errors.receiptFile && <p className="text-destructive text-xs font-cairo mt-1">{errors.receiptFile}</p>}
                            </div>
                          </div>
                        )}
                      </div>
                    </label>
                  )}
                </div>
                {errors.paymentMethod && <p className="text-destructive text-xs font-cairo mt-1">{errors.paymentMethod}</p>}
              </div>

              {/* Order Summary */}
              {orderWilayaId && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-1.5 text-sm font-cairo">
                  <div className="flex justify-between">
                    <span>المنتج (×{qty})</span>
                    <span className="font-roboto font-bold">{formatPrice(itemSubtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>التوصيل</span>
                    <span className="font-roboto font-bold">{formatPrice(shippingCost)}</span>
                  </div>
                  <hr className="my-1 border-primary/20" />
                  <div className="flex justify-between font-bold text-base">
                    <span>الإجمالي</span>
                    <span className="font-roboto text-primary">{formatPrice(orderTotal)}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleDirectOrder}
                disabled={submittingOrder}
                className="w-full font-cairo font-bold text-base gap-2 rounded-xl h-12 bg-gradient-to-l from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground"
              >
                {submittingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                {submittingOrder ? 'جاري الإرسال...' : 'تأكيد الطلب'}
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
    </div>
  );
}
