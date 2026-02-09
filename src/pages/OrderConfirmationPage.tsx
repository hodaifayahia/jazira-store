import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Copy } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function OrderConfirmationPage() {
  usePageTitle('تأكيد الطلب - DZ Store');
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { toast } = useToast();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, wilayas(name)')
        .eq('order_number', orderNumber!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orderNumber,
  });

  const { data: orderItems } = useQuery({
    queryKey: ['order-items', order?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('*, products(name)')
        .eq('order_id', order!.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!order?.id,
  });

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order?.order_number || '');
    toast({ title: 'تم النسخ ✅' });
  };

  if (isLoading) return <div className="container py-16"><Skeleton className="h-64 max-w-lg mx-auto rounded-lg" /></div>;

  if (!order) return (
    <div className="container py-16 text-center space-y-4">
      <p className="font-cairo text-xl text-muted-foreground">الطلب غير موجود</p>
      <Link to="/">
        <Button className="font-cairo">العودة إلى المتجر</Button>
      </Link>
    </div>
  );

  return (
    <div className="container py-16 max-w-lg mx-auto text-center">
      <div className="bg-card border rounded-lg p-8 animate-fade-in">
        <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
        <h1 className="font-cairo font-bold text-2xl mb-2">تم استلام طلبك بنجاح! ✅</h1>
        <p className="font-cairo text-muted-foreground mb-6">شكراً لك، سنتواصل معك قريباً لتأكيد الطلب.</p>
        
        <div className="bg-muted rounded-lg p-4 mb-6">
          <p className="font-cairo text-sm text-muted-foreground">رقم الطلب</p>
          <div className="flex items-center justify-center gap-2">
            <p className="font-roboto font-bold text-2xl text-primary">{order.order_number}</p>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyOrderNumber}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Order Items */}
        {orderItems && orderItems.length > 0 && (
          <div className="text-right space-y-2 mb-4">
            <h3 className="font-cairo font-semibold text-sm text-muted-foreground mb-2">تفاصيل الطلب</h3>
            {orderItems.map((item: any) => (
              <div key={item.id} className="flex justify-between font-cairo text-sm">
                <span>{item.products?.name} ×{item.quantity}</span>
                <span className="font-roboto">{formatPrice(Number(item.unit_price) * item.quantity)}</span>
              </div>
            ))}
            <hr className="my-2" />
          </div>
        )}

        {/* Price Breakdown */}
        <div className="text-right space-y-2 mb-4">
          <div className="flex justify-between font-cairo text-sm">
            <span className="text-muted-foreground">المجموع الفرعي</span>
            <span className="font-roboto">{formatPrice(Number(order.subtotal))}</span>
          </div>
          {Number(order.discount_amount) > 0 && (
            <div className="flex justify-between font-cairo text-sm text-primary">
              <span>الخصم</span>
              <span className="font-roboto">-{formatPrice(Number(order.discount_amount))}</span>
            </div>
          )}
          <div className="flex justify-between font-cairo text-sm">
            <span className="text-muted-foreground">التوصيل</span>
            <span className="font-roboto">{formatPrice(Number(order.shipping_cost))}</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between font-cairo font-bold text-lg">
            <span>الإجمالي</span>
            <span className="font-roboto text-primary">{formatPrice(Number(order.total_amount))}</span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="text-right space-y-2 mb-6 pt-4 border-t">
          <div className="flex justify-between font-cairo text-sm">
            <span className="text-muted-foreground">الاسم</span>
            <span>{order.customer_name}</span>
          </div>
          <div className="flex justify-between font-cairo text-sm">
            <span className="text-muted-foreground">الهاتف</span>
            <span className="font-roboto">{order.customer_phone}</span>
          </div>
          <div className="flex justify-between font-cairo text-sm">
            <span className="text-muted-foreground">الولاية</span>
            <span>{(order as any).wilayas?.name}</span>
          </div>
          {order.address && (
            <div className="flex justify-between font-cairo text-sm">
              <span className="text-muted-foreground">العنوان</span>
              <span>{order.address}</span>
            </div>
          )}
          <div className="flex justify-between font-cairo text-sm">
            <span className="text-muted-foreground">طريقة الدفع</span>
            <span>{order.payment_method === 'baridimob' ? 'بريدي موب' : 'فليكسي'}</span>
          </div>
        </div>

        <Link to="/">
          <Button className="w-full font-cairo font-semibold">العودة إلى المتجر</Button>
        </Link>
      </div>
    </div>
  );
}
