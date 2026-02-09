import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, wilayas(name)')
        .eq('order_number', orderNumber!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!orderNumber,
  });

  if (isLoading) return <div className="container py-16"><Skeleton className="h-64 max-w-lg mx-auto rounded-lg" /></div>;

  if (!order) return (
    <div className="container py-16 text-center">
      <p className="font-cairo text-xl text-muted-foreground">الطلب غير موجود</p>
    </div>
  );

  return (
    <div className="container py-16 max-w-lg mx-auto text-center">
      <div className="bg-card border rounded-lg p-8 animate-fade-in">
        <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
        <h1 className="font-cairo font-bold text-2xl mb-2">تم استلام طلبك بنجاح! ✅</h1>
        <p className="font-cairo text-muted-foreground mb-6">شكراً لك، سنتواصل معك قريباً لتأكيد الطلب.</p>
        
        <div className="bg-muted rounded-lg p-4 mb-6">
          <p className="font-cairo text-sm text-muted-foreground">رقم الطلب</p>
          <p className="font-roboto font-bold text-2xl text-primary">{order.order_number}</p>
        </div>

        <div className="text-right space-y-2 mb-6">
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
          <div className="flex justify-between font-cairo text-sm">
            <span className="text-muted-foreground">طريقة الدفع</span>
            <span>{order.payment_method === 'baridimob' ? 'بريدي موب' : 'فليكسي'}</span>
          </div>
          <hr />
          <div className="flex justify-between font-cairo font-bold">
            <span>الإجمالي</span>
            <span className="font-roboto text-primary">{formatPrice(Number(order.total_amount))}</span>
          </div>
        </div>

        <Link to="/">
          <Button className="w-full font-cairo font-semibold">العودة إلى المتجر</Button>
        </Link>
      </div>
    </div>
  );
}
