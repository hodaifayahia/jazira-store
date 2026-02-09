import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/format';
import { calculateShippingForOrder, getShippingBreakdown } from '@/lib/shipping';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Upload, CheckCircle, LogIn, Truck, Banknote } from 'lucide-react';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [wilayaId, setWilayaId] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (items.length === 0) navigate('/cart');
  }, [items, navigate]);

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

  // Fetch per-product shipping prices
  const { data: productShippingMap } = useQuery({
    queryKey: ['product-shipping', items.map(i => i.id)],
    queryFn: async () => {
      if (items.length === 0) return new Map<string, number>();
      const { data } = await supabase
        .from('products')
        .select('id, shipping_price')
        .in('id', items.map(i => i.id));
      const map = new Map<string, number>();
      data?.forEach(p => map.set(p.id, Number(p.shipping_price) || 0));
      return map;
    },
    enabled: items.length > 0,
  });

  const selectedWilaya = wilayas?.find(w => w.id === wilayaId);
  const wilayaBaseRate = selectedWilaya ? Number(selectedWilaya.shipping_price) : 0;
  const shippingCost = productShippingMap
    ? calculateShippingForOrder(items, productShippingMap, wilayaBaseRate)
    : 0;
  const shippingBreakdown = productShippingMap
    ? getShippingBreakdown(items, productShippingMap, wilayaBaseRate)
    : [];
  const total = subtotal - discount + shippingCost;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.trim())
      .eq('is_active', true)
      .single();
    if (!data) {
      toast({ title: 'خطأ', description: 'كود الخصم غير صالح', variant: 'destructive' });
      return;
    }
    if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
      toast({ title: 'خطأ', description: 'كود الخصم منتهي الصلاحية', variant: 'destructive' });
      return;
    }

    const { data: couponProds } = await supabase
      .from('coupon_products')
      .select('product_id')
      .eq('coupon_id', data.id);

    let eligibleSubtotal = subtotal;
    if (couponProds && couponProds.length > 0) {
      const eligibleIds = new Set((couponProds as { product_id: string }[]).map(cp => cp.product_id));
      eligibleSubtotal = items
        .filter(item => eligibleIds.has(item.id))
        .reduce((sum, item) => sum + item.price * item.quantity, 0);
    }

    const discountVal = data.discount_type === 'percentage'
      ? eligibleSubtotal * Number(data.discount_value) / 100
      : Math.min(Number(data.discount_value), eligibleSubtotal);
    setDiscount(discountVal);
    setCouponApplied(true);
    toast({ title: 'تم تطبيق الخصم', description: `خصم ${formatPrice(discountVal)}` });
  };

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !wilayaId || !paymentMethod) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' });
      return;
    }
    if (!/^0[567]\d{8}$/.test(phone)) {
      toast({ title: 'خطأ', description: 'رقم الهاتف غير صالح', variant: 'destructive' });
      return;
    }

    // Receipt required for baridimob/flexy
    if ((paymentMethod === 'baridimob' || paymentMethod === 'flexy') && !receiptFile) {
      toast({ title: 'خطأ', description: 'يرجى إرفاق إيصال الدفع', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
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
        customer_name: name,
        customer_phone: phone,
        wilaya_id: wilayaId,
        address: address || null,
        subtotal,
        shipping_cost: shippingCost,
        total_amount: total,
        payment_method: paymentMethod,
        payment_receipt_url: receiptUrl || null,
        coupon_code: couponApplied ? couponCode : null,
        discount_amount: discount,
        user_id: user?.id || null,
      }).select().single();
      if (error) throw error;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
      }));
      await supabase.from('order_items').insert(orderItems);

      clearCart();
      navigate(`/order-confirmation/${order.order_number}`);
    } catch (err) {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء إرسال الطلب', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'تم النسخ' });
  };

  const baridimobEnabled = settings?.baridimob_enabled === 'true';
  const flexyEnabled = settings?.flexy_enabled === 'true';

  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="font-cairo font-bold text-3xl mb-8">إتمام الطلب</h1>

      {!user && (
        <Link to="/auth" className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6 hover:bg-primary/10 transition-colors">
          <LogIn className="w-5 h-5 text-primary" />
          <span className="font-cairo text-sm text-foreground">سجّل دخولك لتتبع طلباتك بسهولة من حسابك</span>
        </Link>
      )}

      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3 space-y-6">
          {/* Customer Info */}
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="font-cairo font-bold text-xl">معلومات العميل</h2>
            <div>
              <Label className="font-cairo">الاسم الكامل *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="أدخل اسمك الكامل" className="font-cairo mt-1" />
            </div>
            <div>
              <Label className="font-cairo">رقم الهاتف *</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="05XXXXXXXX" className="font-roboto mt-1" dir="ltr" />
            </div>
            <div>
              <Label className="font-cairo">الولاية *</Label>
              <Select value={wilayaId} onValueChange={setWilayaId}>
                <SelectTrigger className="font-cairo mt-1"><SelectValue placeholder="اختر الولاية" /></SelectTrigger>
                <SelectContent>
                  {wilayas?.map(w => (
                    <SelectItem key={w.id} value={w.id} className="font-cairo">
                      {w.name} — {formatPrice(Number(w.shipping_price))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-cairo">العنوان التفصيلي</Label>
              <Textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="اختياري" className="font-cairo mt-1" />
            </div>
          </div>

          {/* Coupon */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="font-cairo font-bold text-xl mb-4">كود الخصم</h2>
            <div className="flex gap-2">
              <Input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="أدخل كود الخصم" className="font-cairo" disabled={couponApplied} />
              <Button onClick={applyCoupon} disabled={couponApplied} variant="outline" className="font-cairo shrink-0">
                {couponApplied ? <><CheckCircle className="w-4 h-4 ml-1" /> تم</> : 'تطبيق'}
              </Button>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="font-cairo font-bold text-xl">طريقة الدفع</h2>
            <div className="space-y-3">
              {/* Cash on Delivery - always available */}
              <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-primary bg-accent' : ''}`}>
                <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={e => setPaymentMethod(e.target.value)} className="mt-1" />
                <div className="flex-1">
                  <p className="font-cairo font-semibold flex items-center gap-2">
                    <Banknote className="w-4 h-4" />
                    الدفع عند التسليم
                  </p>
                  {paymentMethod === 'cod' && (
                    <p className="mt-2 text-sm font-cairo text-muted-foreground">
                      ستدفع المبلغ الكامل ({formatPrice(total)}) عند استلام الطلب.
                    </p>
                  )}
                </div>
              </label>

              {baridimobEnabled && (
                <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'baridimob' ? 'border-primary bg-accent' : ''}`}>
                  <input type="radio" name="payment" value="baridimob" checked={paymentMethod === 'baridimob'} onChange={e => setPaymentMethod(e.target.value)} className="mt-1" />
                  <div className="flex-1">
                    <p className="font-cairo font-semibold">بريدي موب</p>
                    {paymentMethod === 'baridimob' && settings && (
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center gap-2 bg-muted p-2 rounded">
                          <span className="font-cairo">رقم الحساب:</span>
                          <span className="font-roboto font-bold">{settings.ccp_number}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(settings.ccp_number)}><Copy className="w-3 h-3" /></Button>
                        </div>
                        <p className="font-cairo">الاسم: {settings.ccp_name}</p>
                        <p className="font-cairo">المبلغ: <span className="font-roboto font-bold">{formatPrice(total)}</span></p>
                        <div className="mt-2">
                          <Label className="font-cairo text-xs">أرفق إيصال الدفع *</Label>
                          <Input type="file" accept="image/*,.pdf" onChange={e => setReceiptFile(e.target.files?.[0] || null)} className="mt-1" />
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              )}
              {flexyEnabled && (
                <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'flexy' ? 'border-primary bg-accent' : ''}`}>
                  <input type="radio" name="payment" value="flexy" checked={paymentMethod === 'flexy'} onChange={e => setPaymentMethod(e.target.value)} className="mt-1" />
                  <div className="flex-1">
                    <p className="font-cairo font-semibold">فليكسي (تعبئة)</p>
                    {paymentMethod === 'flexy' && settings && (
                      <div className="mt-3 space-y-2 text-sm">
                        <p className="font-cairo">أرسل تعبئة بقيمة <span className="font-roboto font-bold">{formatPrice(Number(settings.flexy_deposit_amount || 500))}</span> إلى الرقم:</p>
                        <div className="flex items-center gap-2 bg-muted p-2 rounded">
                          <span className="font-roboto font-bold">{settings.flexy_number}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(settings.flexy_number)}><Copy className="w-3 h-3" /></Button>
                        </div>
                        <p className="font-cairo">المبلغ المتبقي عند التسليم: <span className="font-roboto font-bold">{formatPrice(total - Number(settings.flexy_deposit_amount || 500))}</span></p>
                        <div className="mt-2">
                          <Label className="font-cairo text-xs">أرفق لقطة شاشة للتعبئة *</Label>
                          <Input type="file" accept="image/*" onChange={e => setReceiptFile(e.target.files?.[0] || null)} className="mt-1" />
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="md:col-span-2">
          <div className="bg-card border rounded-lg p-6 sticky top-20 space-y-3">
            <h2 className="font-cairo font-bold text-xl mb-4">ملخص الطلب</h2>
            {items.map((item, idx) => (
              <div key={`${item.id}-${item.variation?.value || ''}-${idx}`} className="flex justify-between text-sm font-cairo">
                <span>
                  {item.name} {item.variation ? `(${item.variation.value})` : ''} ×{item.quantity}
                </span>
                <span className="font-roboto">{formatPrice((item.price + (item.variation?.priceAdjustment || 0)) * item.quantity)}</span>
              </div>
            ))}
            <hr className="my-3" />
            <div className="flex justify-between font-cairo text-sm">
              <span>المجموع الفرعي</span>
              <span className="font-roboto font-bold">{formatPrice(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between font-cairo text-sm text-success">
                <span>الخصم</span>
                <span className="font-roboto font-bold">-{formatPrice(discount)}</span>
              </div>
            )}
            {/* Shipping breakdown */}
            <div className="space-y-1">
              <div className="flex justify-between font-cairo text-sm">
                <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> التوصيل</span>
                <span className="font-roboto font-bold">{shippingCost > 0 ? formatPrice(shippingCost) : '—'}</span>
              </div>
              {shippingBreakdown.length > 1 && shippingCost > 0 && (
                <div className="pr-5 space-y-0.5">
                  {shippingBreakdown.map(s => (
                    <div key={s.itemId} className="flex justify-between text-xs text-muted-foreground font-cairo">
                      <span>{s.name} ×{s.quantity}</span>
                      <span className="font-roboto">{formatPrice(s.total)}</span>
                    </div>
                  ))}
                </div>
              )}
              {shippingCost > 0 && (
                <p className="text-[11px] text-muted-foreground font-cairo pr-1">* سعر التوصيل يُحسب لكل منتج حسب الكمية</p>
              )}
            </div>
            <hr className="my-3" />
            <div className="flex justify-between font-cairo font-bold text-lg">
              <span>الإجمالي</span>
              <span className="font-roboto text-primary">{formatPrice(total)}</span>
            </div>
            <Button onClick={handleSubmit} disabled={submitting} className="w-full font-cairo font-semibold mt-4">
              {submitting ? 'جاري الإرسال...' : 'تأكيد الطلب'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
