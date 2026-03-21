import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/format';
import { BarChart3, CalendarDays, CalendarRange, Calendar, Trophy, MapPin, Package, ShoppingCart } from 'lucide-react';

type CostMap = Map<string, number>;

const getCostKey = (productId: string, variantId: string | null) => `${productId}::${variantId || '__base__'}`;

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: string;
  icon: any;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-cairo text-xs text-muted-foreground">{title}</p>
            <p className="font-roboto font-bold text-2xl mt-1 truncate">{value}</p>
            {subtitle ? <p className="font-cairo text-xs text-muted-foreground mt-1">{subtitle}</p> : null}
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminStatisticsPage() {
  const now = new Date();
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const { data: deliveredOrders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['admin-statistics-delivered-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, created_at, total_amount, shipping_cost, status, wilaya_id, wilayas(name)')
        .eq('status', 'تم التسليم');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: cancelledOrders = [] } = useQuery({
    queryKey: ['admin-statistics-cancelled-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, created_at, wilaya_id, wilayas(name)')
        .eq('status', 'ملغي');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allOrders = [] } = useQuery({
    queryKey: ['admin-statistics-all-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, created_at, status');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ['admin-statistics-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
  });

  const deliveredOrderIds = useMemo(() => deliveredOrders.map((o: any) => o.id), [deliveredOrders]);

  const { data: orderItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ['admin-statistics-order-items', deliveredOrderIds],
    enabled: deliveredOrderIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('order_id, product_id, variant_id, quantity, unit_price, products(name)')
        .in('order_id', deliveredOrderIds);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: costs = [], isLoading: loadingCosts } = useQuery({
    queryKey: ['admin-statistics-product-costs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_costs')
        .select('product_id, variant_id, total_cost_per_unit');
      if (error) throw error;
      return data || [];
    },
  });

  const costMap = useMemo<CostMap>(() => {
    const map = new Map<string, number>();
    (costs || []).forEach((c: any) => {
      map.set(getCostKey(c.product_id, c.variant_id), Number(c.total_cost_per_unit || 0));
    });
    return map;
  }, [costs]);

  const orderProfitMap = useMemo(() => {
    const byOrder = new Map<string, number>();
    (orderItems || []).forEach((item: any) => {
      const key = getCostKey(item.product_id, item.variant_id);
      const baseKey = getCostKey(item.product_id, null);
      const unitCost = costMap.get(key) ?? costMap.get(baseKey) ?? 0;
      const itemProfit = (Number(item.unit_price || 0) - unitCost) * Number(item.quantity || 0);
      byOrder.set(item.order_id, (byOrder.get(item.order_id) || 0) + itemProfit);
    });
    return byOrder;
  }, [orderItems, costMap]);

  const getRangeStart = (range: 'today' | 'month' | 'twoMonths' | 'year') => {
    if (range === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (range === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
    if (range === 'twoMonths') return new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return new Date(now.getFullYear(), 0, 1);
  };

  const profitForRange = (start: Date, end?: Date) => {
    return (deliveredOrders || []).reduce((sum, o: any) => {
      const createdAt = new Date(o.created_at);
      if (createdAt < start) return sum;
      if (end && createdAt > end) return sum;
      const orderProfit = (orderProfitMap.get(o.id) || 0) - Number(o.shipping_cost || 0);
      return sum + orderProfit;
    }, 0);
  };

  const countOrdersForRange = (start: Date, end?: Date) => {
    return (allOrders || []).filter((o: any) => {
      const createdAt = new Date(o.created_at);
      if (createdAt < start) return false;
      if (end && createdAt > end) return false;
      return true;
    }).length;
  };

  const metrics = useMemo(() => {
    const todayStart = getRangeStart('today');
    const monthStart = getRangeStart('month');
    const twoMonthsStart = getRangeStart('twoMonths');
    const yearStart = getRangeStart('year');

    const productProfit: Record<string, { name: string; profit: number; qty: number }> = {};
    const wilayaProfit: Record<string, { name: string; profit: number; orders: number }> = {};

    (orderItems || []).forEach((item: any) => {
      const pid = item.product_id;
      if (!productProfit[pid]) {
        productProfit[pid] = { name: (item as any).products?.name || 'منتج', profit: 0, qty: 0 };
      }
      const key = getCostKey(item.product_id, item.variant_id);
      const baseKey = getCostKey(item.product_id, null);
      const unitCost = costMap.get(key) ?? costMap.get(baseKey) ?? 0;
      const q = Number(item.quantity || 0);
      const p = (Number(item.unit_price || 0) - unitCost) * q;
      productProfit[pid].profit += p;
      productProfit[pid].qty += q;
    });

    (deliveredOrders || []).forEach((o: any) => {
      const orderProfit = (orderProfitMap.get(o.id) || 0) - Number(o.shipping_cost || 0);

      const wName = (o as any).wilayas?.name || 'غير محدد';
      if (!wilayaProfit[wName]) wilayaProfit[wName] = { name: wName, profit: 0, orders: 0 };
      wilayaProfit[wName].profit += orderProfit;
      wilayaProfit[wName].orders += 1;
    });

    const sortedProducts = Object.values(productProfit).sort((a, b) => b.profit - a.profit);
    const sortedWilayas = Object.values(wilayaProfit).sort((a, b) => b.profit - a.profit);
    const topProduct = sortedProducts[0] || null;
    const topWilaya = sortedWilayas[0] || null;
    const worstWilaya = sortedWilayas.length > 0 ? sortedWilayas[sortedWilayas.length - 1] : null;

    const totalByWilaya: Record<string, number> = {};
    const cancelledByWilaya: Record<string, number> = {};
    (deliveredOrders || []).forEach((o: any) => {
      const name = (o as any).wilayas?.name || 'غير محدد';
      totalByWilaya[name] = (totalByWilaya[name] || 0) + 1;
    });
    (cancelledOrders || []).forEach((o: any) => {
      const name = (o as any).wilayas?.name || 'غير محدد';
      totalByWilaya[name] = (totalByWilaya[name] || 0) + 1;
      cancelledByWilaya[name] = (cancelledByWilaya[name] || 0) + 1;
    });

    const returnWilaya = Object.entries(totalByWilaya)
      .filter(([, total]) => total >= 3)
      .map(([name, total]) => ({
        name,
        rate: Math.round(((cancelledByWilaya[name] || 0) / total) * 100),
        total,
        cancelled: cancelledByWilaya[name] || 0,
      }))
      .sort((a, b) => b.rate - a.rate)[0] || null;

    return {
      todayProfit: profitForRange(todayStart),
      monthProfit: profitForRange(monthStart),
      twoMonthsProfit: profitForRange(twoMonthsStart),
      yearProfit: profitForRange(yearStart),
      customProfit: customFrom && customTo
        ? profitForRange(new Date(customFrom), new Date(`${customTo}T23:59:59`))
        : 0,
      ordersToday: countOrdersForRange(todayStart),
      ordersMonth: countOrdersForRange(monthStart),
      ordersTwoMonths: countOrdersForRange(twoMonthsStart),
      ordersYear: countOrdersForRange(yearStart),
      totalProducts: products.length,
      totalOrders: allOrders.length,
      topProduct,
      topWilaya,
      worstWilaya,
      returnWilaya,
    };
  }, [
    now,
    deliveredOrders,
    orderItems,
    costMap,
    orderProfitMap,
    cancelledOrders,
    customFrom,
    customTo,
    allOrders,
    products.length,
  ]);

  const isLoading = loadingOrders || loadingItems || loadingCosts;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-primary" />
        <h1 className="font-cairo font-bold text-2xl">إحصائيات الأرباح</h1>
        <Badge variant="outline" className="font-cairo">تم التسليم فقط</Badge>
      </div>

      {isLoading ? (
        <div className="font-cairo text-muted-foreground">جاري تحميل الإحصائيات...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="إجمالي المنتجات" value={String(metrics.totalProducts)} icon={Package} />
            <StatCard title="إجمالي الطلبات" value={String(metrics.totalOrders)} icon={ShoppingCart} />
            <StatCard title="طلبات اليوم" value={String(metrics.ordersToday)} icon={CalendarDays} />
            <StatCard title="طلبات الشهر" value={String(metrics.ordersMonth)} icon={CalendarRange} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard title="ربح اليوم" value={formatPrice(metrics.todayProfit)} icon={CalendarDays} />
            <StatCard title="ربح الشهر" value={formatPrice(metrics.monthProfit)} icon={CalendarRange} />
            <StatCard title="ربح آخر شهرين" value={formatPrice(metrics.twoMonthsProfit)} icon={CalendarRange} subtitle={`الطلبات: ${metrics.ordersTwoMonths}`} />
            <StatCard title="ربح السنة" value={formatPrice(metrics.yearProfit)} icon={Calendar} />
            <StatCard title="ربح مخصص" value={formatPrice(metrics.customProfit)} icon={Calendar} subtitle={customFrom && customTo ? `${customFrom} → ${customTo}` : 'اختر تاريخ البداية والنهاية'} />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-cairo text-base">تاريخ مخصص</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="font-cairo text-xs text-muted-foreground mb-1">من</p>
                  <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="font-roboto" />
                </div>
                <div>
                  <p className="font-cairo text-xs text-muted-foreground mb-1">إلى</p>
                  <Input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="font-roboto" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard title="طلبات السنة" value={String(metrics.ordersYear)} icon={Calendar} />
            <StatCard title="أفضل ولاية (ربح)" value={metrics.topWilaya ? metrics.topWilaya.name : '—'} icon={MapPin} subtitle={metrics.topWilaya ? formatPrice(metrics.topWilaya.profit) : 'لا توجد بيانات'} />
            <StatCard title="أسوأ ولاية (ربح)" value={metrics.worstWilaya ? metrics.worstWilaya.name : '—'} icon={MapPin} subtitle={metrics.worstWilaya ? formatPrice(metrics.worstWilaya.profit) : 'لا توجد بيانات'} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-cairo text-base flex items-center gap-2"><Trophy className="w-4 h-4 text-primary" />أفضل منتج</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.topProduct ? (
                  <div className="space-y-1">
                    <p className="font-cairo font-semibold">{metrics.topProduct.name}</p>
                    <p className="font-roboto text-sm text-muted-foreground">الربح: {formatPrice(metrics.topProduct.profit)}</p>
                    <p className="font-roboto text-sm text-muted-foreground">الكمية: {metrics.topProduct.qty}</p>
                  </div>
                ) : <p className="font-cairo text-sm text-muted-foreground">لا توجد بيانات</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-cairo text-base flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />أفضل ولاية ربحًا</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.topWilaya ? (
                  <div className="space-y-1">
                    <p className="font-cairo font-semibold">{metrics.topWilaya.name}</p>
                    <p className="font-roboto text-sm text-muted-foreground">الربح: {formatPrice(metrics.topWilaya.profit)}</p>
                    <p className="font-roboto text-sm text-muted-foreground">عدد الطلبات: {metrics.topWilaya.orders}</p>
                  </div>
                ) : <p className="font-cairo text-sm text-muted-foreground">لا توجد بيانات</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-cairo text-base flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />أسوأ ولاية ربحًا</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.worstWilaya ? (
                  <div className="space-y-1">
                    <p className="font-cairo font-semibold">{metrics.worstWilaya.name}</p>
                    <p className="font-roboto text-sm text-muted-foreground">الربح: {formatPrice(metrics.worstWilaya.profit)}</p>
                    <p className="font-roboto text-sm text-muted-foreground">عدد الطلبات: {metrics.worstWilaya.orders}</p>
                  </div>
                ) : <p className="font-cairo text-sm text-muted-foreground">لا توجد بيانات كافية</p>}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}