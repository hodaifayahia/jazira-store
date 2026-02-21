import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/i18n';
import { formatPrice } from '@/lib/format';
import { Plus, Minus, Trash2, Search, Loader2, X } from 'lucide-react';

interface OrderProduct {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  variant_id?: string;
  variant_label?: string;
}

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateOrderDialog({ open, onOpenChange }: CreateOrderDialogProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [wilayaId, setWilayaId] = useState('');
  const [baladiya, setBaladiya] = useState('');
  const [deliveryType, setDeliveryType] = useState('office');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [status, setStatus] = useState('جديد');
  const [couponCode, setCouponCode] = useState('');
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: wilayas } = useQuery({
    queryKey: ['wilayas-active'],
    queryFn: async () => {
      const { data } = await supabase.from('wilayas').select('*').eq('is_active', true).order('name');
      return data || [];
    },
  });

  const { data: baladiyat } = useQuery({
    queryKey: ['baladiyat', wilayaId],
    queryFn: async () => {
      const { data } = await supabase.from('baladiyat').select('*').eq('wilaya_id', wilayaId).eq('is_active', true).order('name');
      return data || [];
    },
    enabled: !!wilayaId,
  });

  const { data: products } = useQuery({
    queryKey: ['all-products-for-order'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').eq('is_active', true).order('name');
      return data || [];
    },
  });

  const filteredProducts = useMemo(() => {
    if (!products || !productSearch.trim()) return [];
    const q = productSearch.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [products, productSearch]);

  const selectedWilaya = wilayas?.find(w => w.id === wilayaId);
  const shippingCost = selectedWilaya
    ? (deliveryType === 'home' ? Number(selectedWilaya.shipping_price_home) : Number(selectedWilaya.shipping_price))
    : 0;
  const subtotal = orderProducts.reduce((s, p) => s + p.price * p.quantity, 0);
  const total = subtotal + shippingCost;

  const addProduct = (product: any) => {
    const existing = orderProducts.find(p => p.product_id === product.id);
    if (existing) {
      setOrderProducts(prev => prev.map(p => p.product_id === product.id ? { ...p, quantity: p.quantity + 1 } : p));
    } else {
      setOrderProducts(prev => [...prev, {
        product_id: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: 1,
      }]);
    }
    setProductSearch('');
  };

  const updateQuantity = (productId: string, delta: number) => {
    setOrderProducts(prev => prev.map(p => {
      if (p.product_id !== productId) return p;
      const newQty = p.quantity + delta;
      return newQty > 0 ? { ...p, quantity: newQty } : p;
    }));
  };

  const removeProduct = (productId: string) => {
    setOrderProducts(prev => prev.filter(p => p.product_id !== productId));
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setWilayaId('');
    setBaladiya('');
    setDeliveryType('office');
    setAddress('');
    setPaymentMethod('cod');
    setStatus('جديد');
    setCouponCode('');
    setOrderProducts([]);
    setProductSearch('');
  };

  const handleSubmit = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      toast({ title: 'الاسم والهاتف مطلوبان', variant: 'destructive' });
      return;
    }
    if (orderProducts.length === 0) {
      toast({ title: 'أضف منتجاً واحداً على الأقل', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { data: order, error } = await supabase.from('orders').insert({
        order_number: '',
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        wilaya_id: wilayaId || null,
        baladiya: baladiya || null,
        delivery_type: deliveryType,
        address: address || null,
        subtotal,
        shipping_cost: shippingCost,
        total_amount: total,
        payment_method: paymentMethod,
        coupon_code: couponCode || null,
        status,
      }).select().single();

      if (error) throw error;

      const items = orderProducts.map(p => ({
        order_id: order.id,
        product_id: p.product_id,
        quantity: p.quantity,
        unit_price: p.price,
        variant_id: p.variant_id || null,
      }));
      const { error: itemsError } = await supabase.from('order_items').insert(items);
      if (itemsError) throw itemsError;

      // Try to notify via telegram
      supabase.functions.invoke('telegram-notify', { body: { type: 'new_order', order_id: order.id } }).catch(() => {});

      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({ title: `تم إنشاء الطلب ${order.order_number} ✅` });
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'خطأ في إنشاء الطلب', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const STATUSES = ['جديد', 'قيد المعالجة', 'تم الشحن', 'تم التسليم', 'ملغي'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-cairo text-lg">إضافة طلب يدوي</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Customer Info */}
          <div className="space-y-3">
            <h3 className="font-cairo font-semibold text-sm text-muted-foreground">معلومات العميل</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="font-cairo text-xs">الاسم *</Label>
                <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="اسم العميل" className="font-cairo mt-1" />
              </div>
              <div>
                <Label className="font-cairo text-xs">الهاتف *</Label>
                <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="05XXXXXXXX" className="font-roboto mt-1" dir="ltr" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="font-cairo text-xs">الولاية</Label>
                <Select value={wilayaId} onValueChange={v => { setWilayaId(v); setBaladiya(''); }}>
                  <SelectTrigger className="font-cairo mt-1"><SelectValue placeholder="اختر الولاية" /></SelectTrigger>
                  <SelectContent>
                    {wilayas?.map(w => <SelectItem key={w.id} value={w.id} className="font-cairo">{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {wilayaId && baladiyat && baladiyat.length > 0 && (
                <div>
                  <Label className="font-cairo text-xs">البلدية</Label>
                  <Select value={baladiya} onValueChange={setBaladiya}>
                    <SelectTrigger className="font-cairo mt-1"><SelectValue placeholder="اختر البلدية" /></SelectTrigger>
                    <SelectContent>
                      {baladiyat.map(b => <SelectItem key={b.id} value={b.name} className="font-cairo">{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="font-cairo text-xs">نوع التوصيل</Label>
                <Select value={deliveryType} onValueChange={setDeliveryType}>
                  <SelectTrigger className="font-cairo mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office" className="font-cairo">إلى المكتب</SelectItem>
                    <SelectItem value="home" className="font-cairo">إلى المنزل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-cairo text-xs">طريقة الدفع</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="font-cairo mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cod" className="font-cairo">الدفع عند الاستلام</SelectItem>
                    <SelectItem value="baridimob" className="font-cairo">بريدي موب</SelectItem>
                    <SelectItem value="flexy" className="font-cairo">فليكسي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {deliveryType === 'home' && (
              <div>
                <Label className="font-cairo text-xs">العنوان</Label>
                <Textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="العنوان التفصيلي" className="font-cairo mt-1 min-h-[60px]" />
              </div>
            )}
          </div>

          {/* Products */}
          <div className="space-y-3">
            <h3 className="font-cairo font-semibold text-sm text-muted-foreground">المنتجات *</h3>
            
            {/* Product Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="ابحث عن منتج لإضافته..."
                className="font-cairo pr-10"
              />
              {filteredProducts.length > 0 && (
                <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredProducts.map(p => (
                    <button
                      key={p.id}
                      onClick={() => addProduct(p)}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted text-sm font-cairo transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        {p.images?.[0] && <img src={p.images[0]} alt="" className="w-8 h-8 rounded object-cover" />}
                        {p.name}
                      </span>
                      <span className="font-roboto text-primary">{formatPrice(Number(p.price))}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Products */}
            {orderProducts.length > 0 && (
              <div className="border rounded-lg divide-y">
                {orderProducts.map(p => (
                  <div key={p.product_id} className="flex items-center gap-3 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-cairo text-sm truncate">{p.name}</p>
                      <p className="font-roboto text-xs text-muted-foreground">{formatPrice(p.price)} × {p.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(p.product_id, -1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="font-roboto text-sm w-8 text-center">{p.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(p.product_id, 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <span className="font-roboto text-sm font-medium w-20 text-left">{formatPrice(p.price * p.quantity)}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeProduct(p.product_id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="font-cairo text-xs">الحالة</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="font-cairo mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s} className="font-cairo">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-cairo text-xs">كوبون (اختياري)</Label>
              <Input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="كود الخصم" className="font-cairo mt-1" />
            </div>
          </div>

          {/* Summary */}
          {orderProducts.length > 0 && (
            <div className="bg-muted rounded-lg p-3 space-y-1.5 text-sm font-cairo">
              <div className="flex justify-between">
                <span className="text-muted-foreground">المجموع الفرعي</span>
                <span className="font-roboto">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">التوصيل</span>
                <span className="font-roboto">{formatPrice(shippingCost)}</span>
              </div>
              <hr />
              <div className="flex justify-between font-bold">
                <span>الإجمالي</span>
                <span className="font-roboto text-primary">{formatPrice(total)}</span>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="font-cairo">
              إلغاء
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="font-cairo gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              إنشاء الطلب
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}