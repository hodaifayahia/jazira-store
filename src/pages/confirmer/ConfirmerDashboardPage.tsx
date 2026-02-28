import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, ShoppingCart, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  'جديد': { label: 'status.new', color: 'bg-blue-100 text-blue-800' },
  'قيد المعالجة': { label: 'status.processing', color: 'bg-yellow-100 text-yellow-800' },
  'تم الشحن': { label: 'status.shipped', color: 'bg-purple-100 text-purple-800' },
  'تم التسليم': { label: 'status.delivered', color: 'bg-green-100 text-green-800' },
  'ملغي': { label: 'status.cancelled', color: 'bg-red-100 text-red-800' },
};

const CONFIRMER_STATUSES = ['جديد', 'قيد المعالجة', 'ملغي'];

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number | null;
  status: string | null;
  created_at: string | null;
  wilaya_id: string | null;
  address: string | null;
  delivery_type: string | null;
  shipping_cost: number | null;
  subtotal: number | null;
  discount_amount: number | null;
  payment_method: string | null;
}

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  products: { name: string; images: string[] | null } | null;
}

export default function ConfirmerDashboardPage() {
  const { t, dir } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    setOrders((data as Order[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('confirmer-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const todayOrders = orders.filter(o => o.created_at?.slice(0, 10) === today);
    return {
      total: orders.length,
      newToday: todayOrders.filter(o => o.status === 'جديد').length,
      confirmedToday: todayOrders.filter(o => o.status === 'قيد المعالجة').length,
      cancelledToday: todayOrders.filter(o => o.status === 'ملغي').length,
    };
  }, [orders, today]);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.includes(q)
        );
      }
      return true;
    });
  }, [orders, statusFilter, search]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) {
      toast.error(t('common.errorOccurred'));
    } else {
      toast.success(t('status.updated'));
      fetchOrders();
    }
  };

  const openOrderDetail = async (order: Order) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    const { data } = await supabase
      .from('order_items')
      .select('*, products(name, images)')
      .eq('order_id', order.id);
    setOrderItems((data as any[]) || []);
    setLoadingItems(false);
  };

  return (
    <div dir={dir}>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-cairo text-2xl font-bold">{stats.total}</p>
              <p className="font-cairo text-xs text-muted-foreground">{t('confirmer.totalOrders')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-cairo text-2xl font-bold">{stats.newToday}</p>
              <p className="font-cairo text-xs text-muted-foreground">{t('confirmer.newToday')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-cairo text-2xl font-bold">{stats.confirmedToday}</p>
              <p className="font-cairo text-xs text-muted-foreground">{t('confirmer.confirmedToday')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-cairo text-2xl font-bold">{stats.cancelledToday}</p>
              <p className="font-cairo text-xs text-muted-foreground">{t('confirmer.cancelledToday')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none ${dir === 'rtl' ? 'right-3' : 'left-3'}`} />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('confirmer.searchPlaceholder')}
              className={`font-cairo ${dir === 'rtl' ? 'pr-9' : 'pl-9'}`}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 font-cairo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-cairo">{t('common.all')}</SelectItem>
              {Object.entries(STATUS_MAP).map(([key, val]) => (
                <SelectItem key={key} value={key} className="font-cairo">{t(val.label)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center font-cairo text-muted-foreground">{t('common.loading')}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center font-cairo text-muted-foreground">{t('common.noData')}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-cairo">{t('orders.orderNumber')}</TableHead>
                    <TableHead className="font-cairo">{t('orders.customer')}</TableHead>
                    <TableHead className="font-cairo">{t('orders.phone')}</TableHead>
                    <TableHead className="font-cairo">{t('orders.total')}</TableHead>
                    <TableHead className="font-cairo">{t('orders.status')}</TableHead>
                    <TableHead className="font-cairo">{t('orders.date')}</TableHead>
                    <TableHead className="font-cairo">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(order => {
                    const statusInfo = STATUS_MAP[order.status || ''] || { label: order.status || '', color: 'bg-muted' };
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-cairo font-medium">{order.order_number}</TableCell>
                        <TableCell className="font-cairo">{order.customer_name}</TableCell>
                        <TableCell className="font-cairo" dir="ltr">{order.customer_phone}</TableCell>
                        <TableCell className="font-cairo">{order.total_amount?.toLocaleString()} د.ج</TableCell>
                        <TableCell>
                          <Badge className={`font-cairo ${statusInfo.color}`}>{t(statusInfo.label)}</Badge>
                        </TableCell>
                        <TableCell className="font-cairo text-sm text-muted-foreground">
                          {order.created_at ? format(new Date(order.created_at), 'dd/MM HH:mm') : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openOrderDetail(order)} title={t('common.view')}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {order.status === 'جديد' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleStatusChange(order.id, 'قيد المعالجة')}
                                  title={t('common.confirm')}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleStatusChange(order.id, 'ملغي')}
                                  title={t('status.cancelled')}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg" dir={dir}>
          <DialogHeader>
            <DialogTitle className="font-cairo">{t('orders.orderDetails')} - {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm font-cairo">
                <div>
                  <span className="text-muted-foreground">{t('orders.customer')}:</span>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('orders.phone')}:</span>
                  <p className="font-medium" dir="ltr">{selectedOrder.customer_phone}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('orders.address')}:</span>
                  <p className="font-medium">{selectedOrder.address || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('orders.deliveryType')}:</span>
                  <p className="font-medium">{selectedOrder.delivery_type || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('orders.paymentMethod')}:</span>
                  <p className="font-medium">{selectedOrder.payment_method || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('orders.status')}:</span>
                  <Badge className={`font-cairo ${STATUS_MAP[selectedOrder.status || '']?.color || 'bg-muted'}`}>
                    {t(STATUS_MAP[selectedOrder.status || '']?.label || selectedOrder.status || '')}
                  </Badge>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-cairo font-semibold mb-2">{t('orders.items')}</h4>
                {loadingItems ? (
                  <p className="font-cairo text-sm text-muted-foreground">{t('common.loading')}</p>
                ) : (
                  <div className="space-y-2">
                    {orderItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <span className="font-cairo text-sm">{item.products?.name || t('common.product')}</span>
                        <span className="font-cairo text-sm">{item.quantity} × {item.unit_price.toLocaleString()} د.ج</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="border-t pt-3 space-y-1 text-sm font-cairo">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('orders.subtotal')}</span>
                  <span>{selectedOrder.subtotal?.toLocaleString() || 0} د.ج</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('orders.shipping')}</span>
                  <span>{selectedOrder.shipping_cost?.toLocaleString() || 0} د.ج</span>
                </div>
                {(selectedOrder.discount_amount ?? 0) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{t('orders.discount')}</span>
                    <span>-{selectedOrder.discount_amount?.toLocaleString()} د.ج</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base border-t pt-2">
                  <span>{t('orders.total')}</span>
                  <span>{selectedOrder.total_amount?.toLocaleString()} د.ج</span>
                </div>
              </div>

              {/* Quick Actions */}
              {selectedOrder.status === 'جديد' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 font-cairo"
                    onClick={() => { handleStatusChange(selectedOrder.id, 'قيد المعالجة'); setSelectedOrder(null); }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t('common.confirm')}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 font-cairo"
                    onClick={() => { handleStatusChange(selectedOrder.id, 'ملغي'); setSelectedOrder(null); }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {t('status.cancelled')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
