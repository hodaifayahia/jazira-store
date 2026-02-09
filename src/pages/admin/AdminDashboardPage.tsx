import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, DollarSign, TrendingUp, Package, CalendarDays } from 'lucide-react';
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

  const { data: topProducts } = useQuery({
    queryKey: ['admin-top-products'],
    queryFn: async () => {
      const { data } = await supabase
        .from('order_items')
        .select('product_id, quantity, products(name)');
      if (!data) return [];
      const map: Record<string, { name: string; total: number }> = {};
      data.forEach((item: any) => {
        const id = item.product_id;
        if (!map[id]) map[id] = { name: item.products?.name || '', total: 0 };
        map[id].total += item.quantity;
      });
      return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
    },
  });

  const { data: topWilayas } = useQuery({
    queryKey: ['admin-top-wilayas'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('wilaya_id, wilayas(name)');
      if (!data) return [];
      const map: Record<string, { name: string; count: number }> = {};
      data.forEach((o: any) => {
        const id = o.wilaya_id;
        if (!id) return;
        if (!map[id]) map[id] = { name: o.wilayas?.name || '', count: 0 };
        map[id].count++;
      });
      return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
    },
  });

  const now = new Date();
  const today = orders?.filter(o => new Date(o.created_at!).toDateString() === now.toDateString()) || [];

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeek = orders?.filter(o => new Date(o.created_at!) >= weekAgo) || [];

  const thisMonth = orders?.filter(o => {
    const d = new Date(o.created_at!);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }) || [];
  const revenue = thisMonth.reduce((s, o) => s + Number(o.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ShoppingCart} label="طلبات اليوم" value={String(today.length)} color="bg-primary/10 text-primary" />
        <StatCard icon={CalendarDays} label="طلبات الأسبوع" value={String(thisWeek.length)} color="bg-secondary/10 text-secondary-foreground" />
        <StatCard icon={Package} label="طلبات الشهر" value={String(thisMonth.length)} color="bg-accent text-accent-foreground" />
        <StatCard icon={DollarSign} label="إيرادات الشهر" value={formatPrice(revenue)} color="bg-muted text-muted-foreground" />
      </div>

      {/* Latest 5 Orders */}
      <div className="bg-card border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="font-cairo font-bold text-lg">آخر 5 طلبات</h2>
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
              {(orders || []).slice(0, 5).map(o => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-3 font-roboto font-bold text-primary">{o.order_number}</td>
                  <td className="p-3 font-cairo">{o.customer_name}</td>
                  <td className="p-3 font-roboto">{formatPrice(Number(o.total_amount))}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-cairo ${
                      o.status === 'جديد' ? 'bg-secondary/10 text-secondary-foreground' :
                      o.status === 'تم التسليم' ? 'bg-primary/10 text-primary' :
                      o.status === 'ملغي' ? 'bg-destructive/10 text-destructive' :
                      'bg-accent text-accent-foreground'
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

      {/* Bottom grid: Top Products + Top Wilayas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-lg">
          <div className="p-4 border-b">
            <h2 className="font-cairo font-bold text-lg">أكثر المنتجات مبيعاً</h2>
          </div>
          <div className="p-4 space-y-3">
            {topProducts?.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-roboto font-bold">{i + 1}</span>
                  <span className="font-cairo text-sm">{p.name}</span>
                </div>
                <span className="font-roboto text-sm font-bold text-muted-foreground">{p.total} وحدة</span>
              </div>
            ))}
            {(!topProducts || topProducts.length === 0) && (
              <p className="text-center font-cairo text-muted-foreground text-sm py-4">لا توجد بيانات بعد</p>
            )}
          </div>
        </div>

        <div className="bg-card border rounded-lg">
          <div className="p-4 border-b">
            <h2 className="font-cairo font-bold text-lg">أكثر الولايات طلباً</h2>
          </div>
          <div className="p-4 space-y-3">
            {topWilayas?.map((w, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-roboto font-bold">{i + 1}</span>
                  <span className="font-cairo text-sm">{w.name}</span>
                </div>
                <span className="font-roboto text-sm font-bold text-muted-foreground">{w.count} طلب</span>
              </div>
            ))}
            {(!topWilayas || topWilayas.length === 0) && (
              <p className="text-center font-cairo text-muted-foreground text-sm py-4">لا توجد بيانات بعد</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
