import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, DollarSign, TrendingUp, Package } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/format';

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="bg-card border rounded-lg p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="font-cairo text-sm text-muted-foreground">{label}</p>
          <p className="font-roboto font-bold text-xl">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: orders } = useQuery({
    queryKey: ['admin-orders-all'],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('*, wilayas(name)').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const now = new Date();
  const today = orders?.filter(o => new Date(o.created_at!).toDateString() === now.toDateString()) || [];
  const thisMonth = orders?.filter(o => {
    const d = new Date(o.created_at!);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }) || [];
  const revenue = thisMonth.reduce((s, o) => s + Number(o.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ShoppingCart} label="طلبات اليوم" value={String(today.length)} color="bg-primary/10 text-primary" />
        <StatCard icon={Package} label="طلبات الشهر" value={String(thisMonth.length)} color="bg-secondary/10 text-secondary" />
        <StatCard icon={DollarSign} label="إيرادات الشهر" value={formatPrice(revenue)} color="bg-accent text-accent-foreground" />
        <StatCard icon={TrendingUp} label="إجمالي الطلبات" value={String(orders?.length || 0)} color="bg-muted text-muted-foreground" />
      </div>

      {/* Latest Orders */}
      <div className="bg-card border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="font-cairo font-bold text-lg">آخر الطلبات</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-right font-cairo">رقم الطلب</th>
                <th className="p-3 text-right font-cairo">العميل</th>
                <th className="p-3 text-right font-cairo">الإجمالي</th>
                <th className="p-3 text-right font-cairo">الحالة</th>
                <th className="p-3 text-right font-cairo">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {(orders || []).slice(0, 10).map(o => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-3 font-roboto font-bold text-primary">{o.order_number}</td>
                  <td className="p-3 font-cairo">{o.customer_name}</td>
                  <td className="p-3 font-roboto">{formatPrice(Number(o.total_amount))}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-cairo ${
                      o.status === 'جديد' ? 'bg-secondary/10 text-secondary' :
                      o.status === 'تم التسليم' ? 'bg-primary/10 text-primary' :
                      o.status === 'ملغي' ? 'bg-destructive/10 text-destructive' :
                      'bg-warning/10 text-warning'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-3 font-cairo text-muted-foreground text-xs">{formatDate(o.created_at!)}</td>
                </tr>
              ))}
              {(!orders || orders.length === 0) && (
                <tr><td colSpan={5} className="p-8 text-center font-cairo text-muted-foreground">لا توجد طلبات بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
