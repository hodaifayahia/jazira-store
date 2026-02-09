import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import { usePageTitle } from '@/hooks/usePageTitle';

const STATUS_STEPS = ['جديد', 'قيد المعالجة', 'تم الشحن', 'تم التسليم'];
const STATUS_ICONS = [Clock, Package, Truck, CheckCircle];

export default function TrackOrderPage() {
  usePageTitle('تتبع الطلب - DZ Store');
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!orderNumber.trim()) return;
    setLoading(true);
    setSearched(true);
    const { data } = await supabase
      .from('orders')
      .select('*, wilayas(name)')
      .eq('order_number', orderNumber.trim().toUpperCase())
      .maybeSingle();
    setOrder(data);
    setLoading(false);
    if (!data) {
      toast({ title: 'غير موجود', description: 'لم يتم العثور على الطلب', variant: 'destructive' });
    }
  };

  const currentStep = order ? (order.status === 'ملغي' ? -1 : STATUS_STEPS.indexOf(order.status)) : -1;

  return (
    <div className="container py-8 max-w-2xl">
      <h1 className="font-cairo font-bold text-3xl mb-6">تتبع الطلب</h1>
      
      <div className="flex gap-2 mb-8">
        <Input
          value={orderNumber}
          onChange={e => setOrderNumber(e.target.value)}
          placeholder="أدخل رقم الطلب (مثال: ORD-001)"
          className="font-roboto"
          dir="ltr"
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={loading} className="font-cairo shrink-0 gap-1">
          <Search className="w-4 h-4" />
          تتبع الطلب
        </Button>
      </div>

      {order && (
        <div className="bg-card border rounded-lg p-6 animate-fade-in space-y-6">
          <div className="text-center">
            <p className="font-cairo text-sm text-muted-foreground">رقم الطلب</p>
            <p className="font-roboto font-bold text-xl text-primary">{order.order_number}</p>
            <p className="font-cairo text-sm text-muted-foreground mt-1">{formatDate(order.created_at)}</p>
          </div>

          {order.status === 'ملغي' ? (
            <div className="flex items-center justify-center gap-2 text-destructive py-4">
              <XCircle className="w-6 h-6" />
              <span className="font-cairo font-bold text-lg">تم إلغاء الطلب</span>
            </div>
          ) : (
            <div className="flex items-center justify-between px-4">
              {STATUS_STEPS.map((step, i) => {
                const Icon = STATUS_ICONS[i];
                const active = i <= currentStep;
                return (
                  <div key={step} className="flex flex-col items-center gap-1 relative flex-1">
                    {i > 0 && (
                      <div className={`absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2 ${i <= currentStep ? 'bg-primary' : 'bg-border'}`} style={{ right: '50%', width: '100%', zIndex: 0 }} />
                    )}
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`font-cairo text-xs text-center ${active ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{step}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between font-cairo text-sm">
              <span className="text-muted-foreground">الاسم</span>
              <span>{order.customer_name}</span>
            </div>
            <div className="flex justify-between font-cairo text-sm">
              <span className="text-muted-foreground">الولاية</span>
              <span>{order.wilayas?.name}</span>
            </div>
            <div className="flex justify-between font-cairo text-sm">
              <span className="text-muted-foreground">طريقة الدفع</span>
              <span>{order.payment_method === 'baridimob' ? 'بريدي موب' : 'فليكسي'}</span>
            </div>
            <div className="flex justify-between font-cairo text-sm font-bold">
              <span>الإجمالي</span>
              <span className="font-roboto text-primary">{formatPrice(Number(order.total_amount))}</span>
            </div>
          </div>
        </div>
      )}

      {searched && !order && !loading && (
        <div className="text-center py-12">
          <p className="font-cairo text-muted-foreground text-lg">لم يتم العثور على الطلب، يرجى التحقق من رقم الطلب</p>
        </div>
      )}
    </div>
  );
}
