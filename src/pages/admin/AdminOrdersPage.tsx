import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Search, Eye, ExternalLink, AlertTriangle } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/format';

const STATUSES = ['جديد', 'قيد المعالجة', 'تم الشحن', 'تم التسليم', 'ملغي'];

export default function AdminOrdersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');

  const { data: orders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('*, wilayas(name)').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: orderItems } = useQuery({
    queryKey: ['order-items', selectedOrder?.id],
    queryFn: async () => {
      if (!selectedOrder) return [];
      const { data } = await supabase.from('order_items').select('*, products(name)').eq('order_id', selectedOrder.id);
      return data || [];
    },
    enabled: !!selectedOrder,
  });

  const updateStatus = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', selectedOrder.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({ title: 'تم تحديث الحالة' });
      setSelectedOrder(null);
    },
  });

  // Calculate high-cancellation wilayas
  const riskyWilayas = useMemo(() => {
    if (!orders) return new Map<string, number>();
    const stats: Record<string, { total: number; cancelled: number }> = {};
    orders.forEach(o => {
      const name = (o as any).wilayas?.name;
      if (!name) return;
      if (!stats[name]) stats[name] = { total: 0, cancelled: 0 };
      stats[name].total++;
      if (o.status === 'ملغي') stats[name].cancelled++;
    });
    const result = new Map<string, number>();
    Object.entries(stats).forEach(([name, s]) => {
      if (s.total >= 3 && s.cancelled / s.total > 0.3) {
        result.set(name, Math.round((s.cancelled / s.total) * 100));
      }
    });
    return result;
  }, [orders]);

  const filtered = orders?.filter(o => {
    const matchSearch = !search || o.order_number?.includes(search) || o.customer_name?.includes(search);
    const matchStatus = statusFilter === 'الكل' || o.status === statusFilter;
    return matchSearch && matchStatus;
  }) || [];

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث برقم الطلب أو اسم العميل" className="pr-10 font-cairo" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 font-cairo"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="الكل" className="font-cairo">الكل</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s} className="font-cairo">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-right font-cairo">رقم الطلب</th>
                <th className="p-3 text-right font-cairo">العميل</th>
                <th className="p-3 text-right font-cairo">الهاتف</th>
                <th className="p-3 text-right font-cairo">الولاية</th>
                <th className="p-3 text-right font-cairo">الإجمالي</th>
                <th className="p-3 text-right font-cairo">الحالة</th>
                <th className="p-3 text-right font-cairo">التاريخ</th>
                <th className="p-3 text-right font-cairo">عرض</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const wilayaName = (o as any).wilayas?.name;
                const cancelRate = wilayaName ? riskyWilayas.get(wilayaName) : undefined;
                return (
                  <tr key={o.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-roboto font-bold text-primary">{o.order_number}</td>
                    <td className="p-3 font-cairo">{o.customer_name}</td>
                    <td className="p-3 font-roboto text-xs">{o.customer_phone}</td>
                    <td className="p-3 font-cairo text-xs">
                      <span className="flex items-center gap-1">
                        {wilayaName}
                        {cancelRate !== undefined && (
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                            </TooltipTrigger>
                            <TooltipContent className="font-cairo">
                              نسبة إلغاء مرتفعة ({cancelRate}%)
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </span>
                    </td>
                    <td className="p-3 font-roboto">{formatPrice(Number(o.total_amount))}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-cairo ${
                        o.status === 'جديد' ? 'bg-secondary/10 text-secondary' :
                        o.status === 'تم التسليم' ? 'bg-primary/10 text-primary' :
                        o.status === 'ملغي' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
                      }`}>{o.status}</span>
                    </td>
                    <td className="p-3 font-cairo text-xs text-muted-foreground">{formatDate(o.created_at!)}</td>
                    <td className="p-3">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedOrder(o); setNewStatus(o.status || 'جديد'); }}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Dialog open={!!selectedOrder} onOpenChange={open => !open && setSelectedOrder(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-cairo">تفاصيل الطلب {selectedOrder?.order_number}</DialogTitle></DialogHeader>
            {selectedOrder && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-2 font-cairo">
                  <div><span className="text-muted-foreground">الاسم:</span> {selectedOrder.customer_name}</div>
                  <div><span className="text-muted-foreground">الهاتف:</span> <span className="font-roboto">{selectedOrder.customer_phone}</span></div>
                  <div><span className="text-muted-foreground">الولاية:</span> {(selectedOrder as any).wilayas?.name}</div>
                  <div><span className="text-muted-foreground">الدفع:</span> {selectedOrder.payment_method === 'baridimob' ? 'بريدي موب' : 'فليكسي'}</div>
                </div>
                {selectedOrder.address && <div className="font-cairo"><span className="text-muted-foreground">العنوان:</span> {selectedOrder.address}</div>}
                {selectedOrder.payment_receipt_url && (
                  <a href={selectedOrder.payment_receipt_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary font-cairo hover:underline">
                    <ExternalLink className="w-3 h-3" /> عرض إيصال الدفع
                  </a>
                )}
                <div className="border rounded-lg p-3">
                  <h3 className="font-cairo font-bold mb-2">المنتجات</h3>
                  {orderItems?.map((item: any) => (
                    <div key={item.id} className="flex justify-between py-1 font-cairo">
                      <span>{item.products?.name} ×{item.quantity}</span>
                      <span className="font-roboto">{formatPrice(Number(item.unit_price) * item.quantity)}</span>
                    </div>
                  ))}
                  <hr className="my-2" />
                  <div className="flex justify-between font-cairo font-bold">
                    <span>الإجمالي</span>
                    <span className="font-roboto text-primary">{formatPrice(Number(selectedOrder.total_amount))}</span>
                  </div>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="font-cairo">تحديث الحالة</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="font-cairo mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="font-cairo">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => updateStatus.mutate()} disabled={updateStatus.isPending} className="font-cairo">حفظ</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
