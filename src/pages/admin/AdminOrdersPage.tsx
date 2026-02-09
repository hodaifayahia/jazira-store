import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { Search, ExternalLink, Loader2, ShoppingCart } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/format';
import { TableSkeleton } from '@/components/LoadingSkeleton';

const STATUSES = ['جديد', 'قيد المعالجة', 'تم الشحن', 'تم التسليم', 'ملغي'];
const PAGE_SIZE = 10;

function statusBadgeClass(status: string | null) {
  switch (status) {
    case 'جديد': return 'bg-secondary/10 text-secondary-foreground';
    case 'قيد المعالجة': return 'bg-accent text-accent-foreground';
    case 'تم الشحن': return 'bg-primary/10 text-primary';
    case 'تم التسليم': return 'bg-primary/20 text-primary';
    case 'ملغي': return 'bg-destructive/10 text-destructive';
    default: return 'bg-muted text-muted-foreground';
  }
}

export default function AdminOrdersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');
  const [page, setPage] = useState(0);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('*, wilayas(name)').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: orderItems } = useQuery({
    queryKey: ['order-items', selectedOrder?.id],
    queryFn: async () => {
      if (!selectedOrder) return [];
      const { data, error } = await supabase.from('order_items').select('*, products(name)').eq('order_id', selectedOrder.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedOrder,
  });

  // Realtime subscription for new orders
  useEffect(() => {
    const channel = supabase
      .channel('admin-new-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        qc.invalidateQueries({ queryKey: ['admin-orders'] });
        qc.invalidateQueries({ queryKey: ['admin-orders-all'] });
        toast({ title: '🔔 طلب جديد!', description: 'تم استلام طلب جديد' });
        // Play notification sound
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgkKurk2E2NWCSq6uTYTY1YJKrq5NhNjVgkqurk2A=');
          audio.volume = 0.3;
          audio.play().catch(() => {});
        } catch {}
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc, toast]);

  const updateStatus = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', selectedOrder.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['admin-orders-all'] });
      toast({ title: 'تم تحديث الحالة ✅' });
      setSelectedOrder((prev: any) => prev ? { ...prev, status: newStatus } : null);
    },
  });

  const filtered = orders?.filter(o => {
    const matchSearch = !search || o.order_number?.toLowerCase().includes(search.toLowerCase()) || o.customer_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'الكل' || o.status === statusFilter;
    return matchSearch && matchStatus;
  }) || [];

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="بحث برقم الطلب أو اسم الزبون" className="pr-10 font-cairo" />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-full sm:w-40 font-cairo"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="الكل" className="font-cairo">الكل</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s} className="font-cairo">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <TableSkeleton rows={5} cols={8} /> : <div className="bg-card border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-right font-cairo">رقم الطلب</th>
              <th className="p-3 text-right font-cairo">اسم الزبون</th>
              <th className="p-3 text-right font-cairo">الهاتف</th>
              <th className="p-3 text-right font-cairo">الولاية</th>
              <th className="p-3 text-right font-cairo">المبلغ</th>
              <th className="p-3 text-right font-cairo">طريقة الدفع</th>
              <th className="p-3 text-right font-cairo">الحالة</th>
              <th className="p-3 text-right font-cairo">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(o => (
              <tr key={o.id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => { setSelectedOrder(o); setNewStatus(o.status || 'جديد'); }}>
                <td className="p-3 font-roboto font-bold text-primary">{o.order_number}</td>
                <td className="p-3 font-cairo">{o.customer_name}</td>
                <td className="p-3 font-roboto text-xs">{o.customer_phone}</td>
                <td className="p-3 font-cairo text-xs">{(o as any).wilayas?.name}</td>
                <td className="p-3 font-roboto">{formatPrice(Number(o.total_amount))}</td>
                <td className="p-3 font-cairo text-xs">{o.payment_method === 'baridimob' ? 'بريدي موب' : 'فليكسي'}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-cairo ${statusBadgeClass(o.status)}`}>{o.status}</span>
                </td>
                <td className="p-3 font-cairo text-xs text-muted-foreground">{formatDate(o.created_at!)}</td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center font-cairo text-muted-foreground">لا توجد طلبات</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="font-cairo">السابق</Button>
          <span className="font-cairo text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="font-cairo">التالي</Button>
        </div>
      )}

      {/* Order Detail Sheet */}
      <Sheet open={!!selectedOrder} onOpenChange={open => { if (!open) setSelectedOrder(null); }}>
        <SheetContent side="left" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-cairo">تفاصيل الطلب {selectedOrder?.order_number}</SheetTitle>
          </SheetHeader>
          {selectedOrder && (
            <div className="space-y-5 mt-6 text-sm">
              {/* Customer Info */}
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <h3 className="font-cairo font-bold mb-2">معلومات العميل</h3>
                <div className="grid grid-cols-2 gap-2 font-cairo">
                  <div><span className="text-muted-foreground">الاسم:</span> {selectedOrder.customer_name}</div>
                  <div><span className="text-muted-foreground">الهاتف:</span> <span className="font-roboto">{selectedOrder.customer_phone}</span></div>
                  <div><span className="text-muted-foreground">الولاية:</span> {(selectedOrder as any).wilayas?.name}</div>
                  <div><span className="text-muted-foreground">الدفع:</span> {selectedOrder.payment_method === 'baridimob' ? 'بريدي موب' : 'فليكسي'}</div>
                </div>
                {selectedOrder.address && <div className="font-cairo"><span className="text-muted-foreground">العنوان:</span> {selectedOrder.address}</div>}
              </div>

              {/* Order Items */}
              <div className="border rounded-lg p-4">
                <h3 className="font-cairo font-bold mb-3">المنتجات</h3>
                {orderItems?.map((item: any) => (
                  <div key={item.id} className="flex justify-between py-1.5 border-b last:border-0 font-cairo">
                    <span>{item.products?.name} <span className="text-muted-foreground">×{item.quantity}</span></span>
                    <span className="font-roboto">{formatPrice(Number(item.unit_price) * item.quantity)}</span>
                  </div>
                ))}
                <hr className="my-2" />
                <div className="space-y-1">
                  {selectedOrder.subtotal != null && (
                    <div className="flex justify-between font-cairo text-xs text-muted-foreground">
                      <span>المجموع الفرعي</span>
                      <span className="font-roboto">{formatPrice(Number(selectedOrder.subtotal))}</span>
                    </div>
                  )}
                  {Number(selectedOrder.discount_amount) > 0 && (
                    <div className="flex justify-between font-cairo text-xs text-primary">
                      <span>الخصم</span>
                      <span className="font-roboto">-{formatPrice(Number(selectedOrder.discount_amount))}</span>
                    </div>
                  )}
                  {selectedOrder.shipping_cost != null && (
                    <div className="flex justify-between font-cairo text-xs text-muted-foreground">
                      <span>التوصيل</span>
                      <span className="font-roboto">{formatPrice(Number(selectedOrder.shipping_cost))}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-cairo font-bold pt-1">
                    <span>الإجمالي</span>
                    <span className="font-roboto text-primary">{formatPrice(Number(selectedOrder.total_amount))}</span>
                  </div>
                </div>
              </div>

              {/* Receipt */}
              {selectedOrder.payment_receipt_url && (
                <a href={selectedOrder.payment_receipt_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary font-cairo hover:underline bg-primary/5 rounded-lg p-3">
                  <ExternalLink className="w-4 h-4" /> عرض / تحميل إيصال الدفع
                </a>
              )}

              {/* Status Update */}
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-cairo font-bold">تحديث الحالة</h3>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="font-cairo"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="font-cairo">{s}</SelectItem>)}</SelectContent>
                </Select>
                <Button onClick={() => updateStatus.mutate()} disabled={updateStatus.isPending || newStatus === selectedOrder.status} className="w-full font-cairo font-semibold">
                  {updateStatus.isPending ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" /> جاري الحفظ...</> : 'حفظ الحالة'}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
