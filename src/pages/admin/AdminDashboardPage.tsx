import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, DollarSign, TrendingUp, TrendingDown, Package, Users, Eye, BarChart3, AlertTriangle, Wallet, CreditCard, Plus, Settings, ArrowUpRight, ArrowDownRight, Clock, CheckCircle, XCircle, Percent } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { formatPrice, formatDate } from '@/lib/format';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { useTranslation } from '@/i18n';

function StatCard({ icon: Icon, label, value, color, subtext, trend, trendValue }: { icon: any; label: string; value: string; color: string; subtext?: string; trend?: 'up' | 'down' | 'neutral'; trendValue?: string }) {
  return (
    <div className="bg-card border rounded-xl p-4 sm:p-5 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 group">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-cairo text-xs sm:text-sm text-muted-foreground truncate">{label}</p>
          <p className="font-roboto font-bold text-xl sm:text-2xl mt-1 truncate">{value}</p>
          <div className="flex items-center gap-1.5 mt-1">
            {trend && trendValue && (
              <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                trend === 'up' ? 'bg-green-100 text-green-700' : trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'
              }`}>
                {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
                {trendValue}
              </span>
            )}
            {subtext && <p className="font-cairo text-[11px] sm:text-xs text-muted-foreground truncate">{subtext}</p>}
          </div>
        </div>
        <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${color}`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
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
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  // Enhanced metrics
  const deliveredOrders = (orders || []).filter(o => o.status === 'تم التسليم');
  const cancelledOrders = (orders || []).filter(o => o.status === 'ملغي');
  const conversionRate = (orders?.length || 0) > 0 ? Math.round((deliveredOrders.length / orders!.length) * 100) : 0;
  const revenueGrowth = lastMonthRevenue > 0 ? Math.round(((revenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0;
  const pendingOrders = (orders || []).filter(o => o.status === 'جديد');

  // Orders by hour (today)
  const hourlyData = useMemo(() => {
    return Array.from({ length: 24 }, (_, h) => {
      const count = today.filter(o => new Date(o.created_at!).getHours() === h).length;
      return { hour: `${h}${t('dashboard.hour')}`, orders: count };
    });
  }, [today, t]);

  // Revenue trend (7 days) line chart data
  const revenueTrend = useMemo(() => {
    const dayNames = t('dashboard.dayNames').split(',');
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const dayStr = d.toDateString();
      const dayOrders = (orders || []).filter(o => new Date(o.created_at!).toDateString() === dayStr);
      return {
        name: dayNames[d.getDay()],
        revenue: dayOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0),
      };
    });
  }, [orders, now, t]);

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
    const dayNames = t('dashboard.dayNames').split(',');
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

  // Supplier payment alerts - suppliers you owe money to
  const { data: supplierAlerts } = useQuery({
    queryKey: ['supplier-payment-alerts'],
    queryFn: async () => {
      const { data: suppliers } = await supabase.from('suppliers').select('id, name').eq('status', 'active');
      if (!suppliers?.length) return [];
      const { data: transactions } = await supabase.from('supplier_transactions').select('supplier_id, items_received, items_given');
      if (!transactions) return [];
      
      const balances: Record<string, { name: string; balance: number }> = {};
      suppliers.forEach(s => { balances[s.id] = { name: s.name, balance: 0 }; });
      transactions.forEach(tx => {
        if (balances[tx.supplier_id]) {
          balances[tx.supplier_id].balance += Number(tx.items_received) - Number(tx.items_given);
        }
      });
      return Object.entries(balances)
        .filter(([, v]) => v.balance > 0)
        .map(([id, v]) => ({ id, name: v.name, amount: v.balance }))
        .sort((a, b) => b.amount - a.amount);
    },
  });

  // Client payment alerts - clients who owe you money
  const { data: clientAlerts } = useQuery({
    queryKey: ['client-payment-alerts'],
    queryFn: async () => {
      const { data: clients } = await supabase.from('clients').select('id, name').eq('status', 'active');
      if (!clients?.length) return [];
      const { data: transactions } = await supabase.from('client_transactions').select('client_id, transaction_type, amount');
      if (!transactions) return [];
      
      const balances: Record<string, { name: string; balance: number }> = {};
      clients.forEach(c => { balances[c.id] = { name: c.name, balance: 0 }; });
      transactions.forEach(tx => {
        if (!balances[tx.client_id]) return;
        if (tx.transaction_type === 'product_given') balances[tx.client_id].balance += Number(tx.amount);
        else if (tx.transaction_type === 'payment_received') balances[tx.client_id].balance -= Number(tx.amount);
        else if (tx.transaction_type === 'product_returned') balances[tx.client_id].balance -= Number(tx.amount);
      });
      return Object.entries(balances)
        .filter(([, v]) => v.balance > 0)
        .map(([id, v]) => ({ id, name: v.name, amount: v.balance }))
        .sort((a, b) => b.amount - a.amount);
    },
  });

  return (
    <div className="space-y-6">
      {/* Low Stock Alert Banner */}
      {lowStockProducts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('dashboard.lowStockBanner').replace('{n}', String(lowStockProducts.length))}</AlertTitle>
          <AlertDescription className="line-clamp-2">
            {lowStockProducts.map(p => `${p.name} (${p.stock} ${t('common.remaining')})`).join(' • ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Actions Bar */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="font-cairo gap-1.5 shadow-sm" onClick={() => navigate('/admin/products')}>
          <Plus className="w-3.5 h-3.5" /> {t('dashboard.addProduct')}
        </Button>
        <Button size="sm" variant="outline" className="font-cairo gap-1.5" onClick={() => navigate('/admin/orders/create')}>
          <ShoppingCart className="w-3.5 h-3.5" /> {t('dashboard.createOrder')}
        </Button>
        <Button size="sm" variant="outline" className="font-cairo gap-1.5" onClick={() => navigate('/admin/costs')}>
          <BarChart3 className="w-3.5 h-3.5" /> {t('dashboard.viewReports')}
        </Button>
        <Button size="sm" variant="ghost" className="font-cairo gap-1.5" onClick={() => navigate('/admin/settings')}>
          <Settings className="w-3.5 h-3.5" /> {t('dashboard.manageSettings')}
        </Button>
      </div>

      {/* Payment Alerts */}
      {((supplierAlerts?.length ?? 0) > 0 || (clientAlerts?.length ?? 0) > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(supplierAlerts?.length ?? 0) > 0 && (
            <div className="bg-card border border-orange-500/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-5 h-5 text-orange-500" />
                <h3 className="font-cairo font-bold text-sm text-orange-600">{t('dashboard.suppliersToPayTitle')}</h3>
              </div>
              <div className="space-y-2">
                {supplierAlerts!.slice(0, 5).map(s => (
                  <div key={s.id} className="flex items-center justify-between">
                    <Button variant="link" className="font-cairo text-sm p-0 h-auto" onClick={() => navigate(`/admin/suppliers/${s.id}`)}>
                      {s.name}
                    </Button>
                    <span className="font-roboto text-sm font-bold text-orange-600">{formatPrice(s.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(clientAlerts?.length ?? 0) > 0 && (
            <div className="bg-card border border-primary/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-5 h-5 text-primary" />
                <h3 className="font-cairo font-bold text-sm text-primary">{t('dashboard.clientsToCollectTitle')}</h3>
              </div>
              <div className="space-y-2">
                {clientAlerts!.slice(0, 5).map(c => (
                  <div key={c.id} className="flex items-center justify-between">
                    <Button variant="link" className="font-cairo text-sm p-0 h-auto" onClick={() => navigate(`/admin/clients/${c.id}`)}>
                      {c.name}
                    </Button>
                    <span className="font-roboto text-sm font-bold text-primary">{formatPrice(c.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid - Enhanced with trends */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard icon={ShoppingCart} label={t('dashboard.todayOrders')} value={String(today.length)} color="bg-primary/10 text-primary" subtext={`${thisMonth.length} ${t('dashboard.thisMonth')}`} />
        <StatCard icon={DollarSign} label={t('dashboard.monthRevenue')} value={formatPrice(revenue)} color="bg-secondary/10 text-secondary" trend={revenueGrowth >= 0 ? 'up' : 'down'} trendValue={`${Math.abs(revenueGrowth)}%`} subtext={t('dashboard.vsLastMonth')} />
        <StatCard icon={TrendingUp} label={t('dashboard.avgOrderValue')} value={formatPrice(avgOrderValue)} color="bg-accent text-accent-foreground" subtext={`${orders?.length || 0} ${t('dashboard.totalOrders')}`} />
        <StatCard icon={Percent} label={t('dashboard.conversionRate')} value={`${conversionRate}%`} color="bg-green-500/10 text-green-600" subtext={`${deliveredOrders.length} ${t('dashboard.deliveredOrders')}`} />
        <StatCard icon={Users} label={t('dashboard.newLeads')} value={String(newLeads.length)} color="bg-primary/10 text-primary" subtext={`${leads?.length || 0} ${t('dashboard.totalLeads')}`} />
        <StatCard icon={XCircle} label={t('dashboard.cancelledCount')} value={String(cancelledOrders.length)} color="bg-destructive/10 text-destructive" subtext={`${pendingOrders.length} ${t('dashboard.pendingOrders')}`} />
      </div>

      {/* Order Status Summary Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200/50 rounded-xl p-4 text-center">
          <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <p className="font-roboto font-bold text-2xl text-blue-700 dark:text-blue-400">{pendingOrders.length}</p>
          <p className="font-cairo text-xs text-blue-600/70">{t('dashboard.pendingOrders')}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border border-green-200/50 rounded-xl p-4 text-center">
          <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="font-roboto font-bold text-2xl text-green-700 dark:text-green-400">{deliveredOrders.length}</p>
          <p className="font-cairo text-xs text-green-600/70">{t('dashboard.deliveredCount')}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border border-red-200/50 rounded-xl p-4 text-center">
          <XCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
          <p className="font-roboto font-bold text-2xl text-red-700 dark:text-red-400">{cancelledOrders.length}</p>
          <p className="font-cairo text-xs text-red-600/70">{t('dashboard.cancelledCount')}</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-primary" />
            <span className="font-cairo text-sm font-semibold">{t('dashboard.productsSection')}</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between font-cairo text-sm">
              <span className="text-muted-foreground">{t('dashboard.activeProducts')}</span>
              <span className="font-roboto font-bold">{activeProducts.length}</span>
            </div>
            <div className="flex justify-between font-cairo text-sm">
              <span className="text-muted-foreground">{t('dashboard.totalProducts')}</span>
              <span className="font-roboto font-bold">{products?.length || 0}</span>
            </div>
            <div className="flex justify-between font-cairo text-sm">
              <span className="text-destructive">{t('dashboard.lowStockAlert')}</span>
              <span className="font-roboto font-bold text-destructive">{lowStockProducts.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="font-cairo text-sm font-semibold">{t('dashboard.orderStatuses')}</span>
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
            <span className="font-cairo text-sm font-semibold">{t('dashboard.topWilayas')}</span>
          </div>
          <div className="space-y-2">
            {topWilayas.map(([name, count]) => (
              <div key={name} className="flex justify-between font-cairo text-sm">
                <span className="text-muted-foreground">{name}</span>
                <span className="font-roboto font-bold">{count}</span>
              </div>
            ))}
            {topWilayas.length === 0 && <p className="font-cairo text-xs text-muted-foreground">{t('common.noData')}</p>}
          </div>
        </div>
      </div>

      {/* Charts Row - Enhanced */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Trend Line Chart */}
        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-cairo font-semibold text-base mb-4">{t('dashboard.revenueChart')}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: 'Cairo' }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ fontFamily: 'Cairo', fontSize: 12, borderRadius: 8 }} formatter={(value: number) => [formatPrice(value), t('dashboard.revenue')]} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revenueGradient)" strokeWidth={2.5} dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders by Hour */}
        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-cairo font-semibold text-base mb-4">{t('dashboard.ordersByHour')}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData.filter((_, i) => i >= 6 && i <= 23)}>
                <XAxis dataKey="hour" tick={{ fontSize: 10, fontFamily: 'Cairo' }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontFamily: 'Cairo', fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="orders" fill="hsl(var(--secondary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Original Orders + Pie Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-cairo font-semibold text-base mb-4">{t('dashboard.last7Days')}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: 'Cairo' }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontFamily: 'Cairo', fontSize: 12, borderRadius: 8 }}
                  formatter={(value: number, name: string) => [name === 'revenue' ? formatPrice(value) : value, name === 'revenue' ? t('dashboard.revenue') : t('dashboard.orders')]}
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
            <h3 className="font-cairo font-semibold text-base">{t('dashboard.bestSellers')}</h3>
          </div>
          <div className="p-4 space-y-3">
            {topProducts.length > 0 ? topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-roboto text-xs text-muted-foreground w-5 text-center">{i + 1}</span>
                  <span className="font-cairo text-sm font-medium">{p.name}</span>
                </div>
                <span className="font-roboto text-sm font-bold text-primary">{p.qty} {t('common.unit')}</span>
              </div>
            )) : (
              <p className="font-cairo text-sm text-muted-foreground text-center py-4">{t('common.noData')}</p>
            )}
          </div>
        </div>

        <div className="bg-card border rounded-xl">
          <div className="p-4 border-b">
            <h3 className="font-cairo font-semibold text-base text-destructive">{t('dashboard.lowStockAlertTitle')}</h3>
          </div>
          <div className="p-4 space-y-3">
            {lowStockProducts.length > 0 ? lowStockProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between">
                <span className="font-cairo text-sm">{p.name}</span>
                <span className="font-roboto text-sm font-bold text-destructive">{p.stock} {t('common.remaining')}</span>
              </div>
            )) : (
              <p className="font-cairo text-sm text-muted-foreground text-center py-4">{t('dashboard.allStockOk')}</p>
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
              <span className="text-destructive">{t('dashboard.riskyWilayas')}</span>
            </h3>
            <p className="font-cairo text-xs text-muted-foreground mt-1">{t('dashboard.riskyWilayasDesc')}</p>
          </div>
          <div className="p-4 space-y-3">
            {riskyWilayas.map(w => (
              <div key={w.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                  <span className="font-cairo text-sm font-medium">{w.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-cairo text-xs text-muted-foreground">{w.cancelled}/{w.total} {t('dashboard.cancelled')}</span>
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
          <h2 className="font-cairo font-bold text-lg">{t('dashboard.latestOrders')}</h2>
        </div>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-right font-cairo font-semibold">{t('dashboard.orderNumber')}</th>
                <th className="p-3 text-right font-cairo font-semibold">{t('common.customer')}</th>
                <th className="p-3 text-right font-cairo font-semibold">{t('dashboard.wilaya')}</th>
                <th className="p-3 text-right font-cairo font-semibold">{t('common.total')}</th>
                <th className="p-3 text-right font-cairo font-semibold">{t('common.status')}</th>
                <th className="p-3 text-right font-cairo font-semibold">{t('common.date')}</th>
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
                    }`}>{o.status}</span>
                  </td>
                  <td className="p-3 font-cairo text-muted-foreground text-xs">{formatDate(o.created_at!)}</td>
                </tr>
              ))}
              {(!orders || orders.length === 0) && (
                <tr><td colSpan={6} className="p-8 text-center font-cairo text-muted-foreground">{t('common.noData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Mobile Cards */}
        <div className="md:hidden p-3 space-y-3">
          {(orders || []).slice(0, 10).map(o => (
            <div key={o.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-roboto font-bold text-primary text-sm">{o.order_number}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-cairo ${
                  o.status === 'جديد' ? 'bg-secondary/10 text-secondary' :
                  o.status === 'تم التسليم' ? 'bg-primary/10 text-primary' :
                  o.status === 'ملغي' ? 'bg-destructive/10 text-destructive' :
                  'bg-muted text-muted-foreground'
                }`}>{o.status}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-cairo text-muted-foreground">
                <span>{o.customer_name}</span>
                <span className="font-roboto font-bold text-foreground">{formatPrice(Number(o.total_amount))}</span>
              </div>
            </div>
          ))}
          {(!orders || orders.length === 0) && (
            <p className="text-center font-cairo text-muted-foreground py-4">{t('common.noData')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
