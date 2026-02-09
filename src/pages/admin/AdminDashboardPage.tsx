import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, DollarSign, TrendingUp, Package, Users, Eye, BarChart3, AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { formatPrice, formatDate } from '@/lib/format';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function StatCard({ icon: Icon, label, value, color, subtext }: { icon: any; label: string; value: string; color: string; subtext?: string }) {
  return (
    <div className="bg-card border rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-cairo text-sm text-muted-foreground">{label}</p>
          <p className="font-roboto font-bold text-2xl mt-1">{value}</p>
          {subtext && <p className="font-cairo text-xs text-muted-foreground mt-1">{subtext}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  'جديد': 'hsl(var(--secondary))',
  'قيد المعالجة': 'hsl(var(--primary))',
  'تم الشحن': 'hsl(30, 80%, 55%)',
  'تم التسليم': 'hsl(142, 76%, 36%)',
  'ملغي': 'hsl(var(--destructive))',
};

const PIE_COLORS = ['hsl(var(--secondary))', 'hsl(var(--primary))', 'hsl(30, 80%, 55%)', 'hsl(142, 76%, 36%)', 'hsl(var(--destructive))'];

export default function AdminDashboardPage() {
  const { data: orders } = useQuery({
    queryKey: ['admin-orders-all'],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('*, wilayas(name)').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: products } = useQuery({
    queryKey: ['admin-products-stats'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*');
      return data || [];
    },
  });

  const { data: leads } = useQuery({
    queryKey: ['admin-leads-stats'],
    queryFn: async () => {
      const { data } = await supabase.from('leads').select('*');
      return data || [];
    },
  });

  const now = new Date();
  const today = orders?.filter(o => new Date(o.created_at!).toDateString() === now.toDateString()) || [];
  const thisMonth = orders?.filter(o => {
    const d = new Date(o.created_at!);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }) || [];
  const lastMonth = orders?.filter(o => {
    const d = new Date(o.created_at!);
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  }) || [];

  const revenue = thisMonth.reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const lastMonthRevenue = lastMonth.reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const avgOrderValue = thisMonth.length > 0 ? revenue / thisMonth.length : 0;
  const activeProducts = products?.filter(p => p.is_active) || [];
  const lowStockProducts = products?.filter(p => (p.stock ?? 0) <= 5 && p.is_active) || [];
  const newLeads = leads?.filter(l => l.status === 'جديد') || [];

  const statusCounts = (orders || []).reduce((acc, o) => {
    acc[o.status || 'جديد'] = (acc[o.status || 'جديد'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toDateString();
    const dayOrders = (orders || []).filter(o => new Date(o.created_at!).toDateString() === dayStr);
    const dayNames = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
    return {
      name: dayNames[d.getDay()],
      orders: dayOrders.length,
      revenue: dayOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0),
    };
  });

  const { data: orderItems } = useQuery({
    queryKey: ['admin-order-items-stats'],
    queryFn: async () => {
      const { data } = await supabase.from('order_items').select('product_id, quantity, products(name)');
      return data || [];
    },
  });

  const topProducts = Object.values(
    (orderItems || []).reduce((acc, item) => {
      const id = item.product_id;
      if (!acc[id]) acc[id] = { name: (item as any).products?.name || 'غير معروف', qty: 0 };
      acc[id].qty += item.quantity;
      return acc;
    }, {} as Record<string, { name: string; qty: number }>)
  ).sort((a, b) => b.qty - a.qty).slice(0, 5);

  const wilayaCounts = (orders || []).reduce((acc, o) => {
    const name = (o as any).wilayas?.name || 'غير محدد';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topWilayas = Object.entries(wilayaCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Risky wilayas with high cancellation rate
  const riskyWilayas = useMemo(() => {
    if (!orders) return [];
    const stats: Record<string, { total: number; cancelled: number }> = {};
    orders.forEach(o => {
      const name = (o as any).wilayas?.name;
      if (!name) return;
      if (!stats[name]) stats[name] = { total: 0, cancelled: 0 };
      stats[name].total++;
      if (o.status === 'ملغي') stats[name].cancelled++;
    });
    return Object.entries(stats)
      .filter(([, s]) => s.total >= 3 && s.cancelled / s.total > 0.3)
      .map(([name, s]) => ({ name, rate: Math.round((s.cancelled / s.total) * 100), cancelled: s.cancelled, total: s.total }))
      .sort((a, b) => b.rate - a.rate);
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Low Stock Alert Banner */}
      {lowStockProducts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>تنبيه: مخزون منخفض ({lowStockProducts.length} منتج)</AlertTitle>
          <AlertDescription>
            {lowStockProducts.map(p => `${p.name} (${p.stock} متبقي)`).join(' • ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ShoppingCart} label="طلبات اليوم" value={String(today.length)} color="bg-primary/10 text-primary" subtext={`${thisMonth.length} هذا الشهر`} />
        <StatCard icon={DollarSign} label="إيرادات الشهر" value={formatPrice(revenue)} color="bg-secondary/10 text-secondary" subtext={lastMonthRevenue > 0 ? `الشهر الماضي: ${formatPrice(lastMonthRevenue)}` : undefined} />
        <StatCard icon={TrendingUp} label="متوسط قيمة الطلب" value={formatPrice(avgOrderValue)} color="bg-accent text-accent-foreground" subtext={`${orders?.length || 0} طلب إجمالي`} />
        <StatCard icon={Users} label="عملاء محتملون جدد" value={String(newLeads.length)} color="bg-primary/10 text-primary" subtext={`${leads?.length || 0} إجمالي`} />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-primary" />
            <span className="font-cairo text-sm font-semibold">المنتجات</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between font-cairo text-sm">
              <span className="text-muted-foreground">منتجات نشطة</span>
              <span className="font-roboto font-bold">{activeProducts.length}</span>
            </div>
            <div className="flex justify-between font-cairo text-sm">
              <span className="text-muted-foreground">إجمالي المنتجات</span>
              <span className="font-roboto font-bold">{products?.length || 0}</span>
            </div>
            <div className="flex justify-between font-cairo text-sm">
              <span className="text-destructive">مخزون منخفض (&le;5)</span>
              <span className="font-roboto font-bold text-destructive">{lowStockProducts.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="font-cairo text-sm font-semibold">حالات الطلبات</span>
          </div>
          <div className="space-y-2">
            {Object.entries(statusCounts).slice(0, 4).map(([status, count]) => (
              <div key={status} className="flex justify-between font-cairo text-sm">
                <span className="text-muted-foreground">{status}</span>
                <span className="font-roboto font-bold">{count as number}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-primary" />
            <span className="font-cairo text-sm font-semibold">أكثر الولايات طلباً</span>
          </div>
          <div className="space-y-2">
            {topWilayas.map(([name, count]) => (
              <div key={name} className="flex justify-between font-cairo text-sm">
                <span className="text-muted-foreground">{name}</span>
                <span className="font-roboto font-bold">{count}</span>
              </div>
            ))}
            {topWilayas.length === 0 && <p className="font-cairo text-xs text-muted-foreground">لا توجد بيانات</p>}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-cairo font-semibold text-base mb-4">طلبات آخر 7 أيام</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: 'Cairo' }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontFamily: 'Cairo', fontSize: 12, borderRadius: 8 }}
                  formatter={(value: number, name: string) => [name === 'revenue' ? formatPrice(value) : value, name === 'revenue' ? 'الإيرادات' : 'الطلبات']}
                />
                <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-cairo font-semibold text-base mb-4">توزيع حالات الطلبات</h3>
          {pieData.length > 0 ? (
            <div className="h-56 flex items-center">
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" paddingAngle={2}>
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: 'Cairo', fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                    <span className="font-cairo text-xs text-muted-foreground">{entry.name}</span>
                    <span className="font-roboto text-xs font-bold">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center font-cairo text-muted-foreground text-sm">لا توجد بيانات</div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border rounded-xl">
          <div className="p-4 border-b">
            <h3 className="font-cairo font-semibold text-base">المنتجات الأكثر مبيعاً</h3>
          </div>
          <div className="p-4 space-y-3">
            {topProducts.length > 0 ? topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-roboto text-xs text-muted-foreground w-5 text-center">{i + 1}</span>
                  <span className="font-cairo text-sm font-medium">{p.name}</span>
                </div>
                <span className="font-roboto text-sm font-bold text-primary">{p.qty} وحدة</span>
              </div>
            )) : (
              <p className="font-cairo text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>
            )}
          </div>
        </div>

        <div className="bg-card border rounded-xl">
          <div className="p-4 border-b">
            <h3 className="font-cairo font-semibold text-base text-destructive">⚠ تنبيه المخزون المنخفض</h3>
          </div>
          <div className="p-4 space-y-3">
            {lowStockProducts.length > 0 ? lowStockProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between">
                <span className="font-cairo text-sm">{p.name}</span>
                <span className="font-roboto text-sm font-bold text-destructive">{p.stock} متبقي</span>
              </div>
            )) : (
              <p className="font-cairo text-sm text-muted-foreground text-center py-4">جميع المنتجات بمخزون كافي ✅</p>
            )}
          </div>
        </div>
      </div>

      {/* Risky Wilayas Card */}
      {riskyWilayas.length > 0 && (
        <div className="bg-card border border-destructive/30 rounded-xl">
          <div className="p-4 border-b border-destructive/20">
            <h3 className="font-cairo font-semibold text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-destructive">ولايات بنسبة إلغاء مرتفعة</span>
            </h3>
            <p className="font-cairo text-xs text-muted-foreground mt-1">ولايات تجاوزت نسبة الإلغاء فيها 30% (حد أدنى 3 طلبات)</p>
          </div>
          <div className="p-4 space-y-3">
            {riskyWilayas.map(w => (
              <div key={w.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                  <span className="font-cairo text-sm font-medium">{w.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-cairo text-xs text-muted-foreground">{w.cancelled}/{w.total} ملغي</span>
                  <span className="font-roboto text-sm font-bold text-destructive">{w.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latest Orders */}
      <div className="bg-card border rounded-xl">
        <div className="p-4 border-b">
          <h2 className="font-cairo font-bold text-lg">آخر الطلبات</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-right font-cairo font-semibold">رقم الطلب</th>
                <th className="p-3 text-right font-cairo font-semibold">العميل</th>
                <th className="p-3 text-right font-cairo font-semibold">الولاية</th>
                <th className="p-3 text-right font-cairo font-semibold">الإجمالي</th>
                <th className="p-3 text-right font-cairo font-semibold">الحالة</th>
                <th className="p-3 text-right font-cairo font-semibold">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(orders || []).slice(0, 10).map(o => (
                <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-roboto font-bold text-primary">{o.order_number}</td>
                  <td className="p-3 font-cairo">{o.customer_name}</td>
                  <td className="p-3 font-cairo text-muted-foreground text-xs">{(o as any).wilayas?.name || '—'}</td>
                  <td className="p-3 font-roboto">{formatPrice(Number(o.total_amount))}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-cairo ${
                      o.status === 'جديد' ? 'bg-secondary/10 text-secondary' :
                      o.status === 'تم التسليم' ? 'bg-primary/10 text-primary' :
                      o.status === 'ملغي' ? 'bg-destructive/10 text-destructive' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-3 font-cairo text-muted-foreground text-xs">{formatDate(o.created_at!)}</td>
                </tr>
              ))}
              {(!orders || orders.length === 0) && (
                <tr><td colSpan={6} className="p-8 text-center font-cairo text-muted-foreground">لا توجد طلبات بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
