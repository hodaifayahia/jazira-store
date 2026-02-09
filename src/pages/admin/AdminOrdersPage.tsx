import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Search, Eye, ExternalLink, AlertTriangle, MoreHorizontal, PackageCheck, Truck, Clock, Ban, PackageOpen, CheckCircle, Filter, ChevronDown, ChevronUp, Loader2, CheckSquare, Zap } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/format';

const STATUSES = ['جديد', 'قيد المعالجة', 'تم الشحن', 'تم التسليم', 'ملغي'];

const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
  'جديد': { icon: Clock, color: 'text-secondary', bg: 'bg-secondary/10' },
  'قيد المعالجة': { icon: PackageOpen, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  'تم الشحن': { icon: Truck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  'تم التسليم': { icon: PackageCheck, color: 'text-primary', bg: 'bg-primary/10' },
  'ملغي': { icon: Ban, color: 'text-destructive', bg: 'bg-destructive/10' },
};

export default function AdminOrdersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');

  // Advanced filters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [wilayaFilter, setWilayaFilter] = useState('الكل');
  const [paymentFilter, setPaymentFilter] = useState('الكل');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minTotal, setMinTotal] = useState('');
  const [maxTotal, setMaxTotal] = useState('');

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatusDialog, setBulkStatusDialog] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');

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

  const { data: wilayas } = useQuery({
    queryKey: ['wilayas-list'],
    queryFn: async () => {
      const { data } = await supabase.from('wilayas').select('name').order('name');
      return data?.map(w => w.name) || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({ title: 'تم تحديث الحالة ✅' });
    },
  });

  const bulkUpdateStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase.from('orders').update({ status }).in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      setSelectedIds(new Set());
      setBulkStatusDialog(false);
      toast({ title: `تم تحديث حالة ${selectedIds.size} طلب ✅` });
    },
  });

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

  const filtered = useMemo(() => {
    return (orders || []).filter(o => {
      const matchSearch = !search || o.order_number?.includes(search) || o.customer_name?.includes(search) || o.customer_phone?.includes(search);
      const matchStatus = statusFilter === 'الكل' || o.status === statusFilter;
      const wilayaName = (o as any).wilayas?.name;
      const matchWilaya = wilayaFilter === 'الكل' || wilayaName === wilayaFilter;
      const matchPayment = paymentFilter === 'الكل' || o.payment_method === paymentFilter;
      const matchDateFrom = !dateFrom || (o.created_at && o.created_at >= dateFrom);
      const matchDateTo = !dateTo || (o.created_at && o.created_at <= dateTo + 'T23:59:59');
      const matchMinTotal = !minTotal || Number(o.total_amount) >= Number(minTotal);
      const matchMaxTotal = !maxTotal || Number(o.total_amount) <= Number(maxTotal);
      return matchSearch && matchStatus && matchWilaya && matchPayment && matchDateFrom && matchDateTo && matchMinTotal && matchMaxTotal;
    });
  }, [orders, search, statusFilter, wilayaFilter, paymentFilter, dateFrom, dateTo, minTotal, maxTotal]);

  const handleQuickStatus = (orderId: string, status: string) => {
    updateStatus.mutate({ id: orderId, status });
  };

  // Selection helpers
  const allSelected = filtered.length > 0 && filtered.every(o => selectedIds.has(o.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(o => o.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const clearAdvanced = () => {
    setWilayaFilter('الكل');
    setPaymentFilter('الكل');
    setDateFrom('');
    setDateTo('');
    setMinTotal('');
    setMaxTotal('');
  };

  const hasAdvancedFilters = wilayaFilter !== 'الكل' || paymentFilter !== 'الكل' || dateFrom || dateTo || minTotal || maxTotal;

  // Quick bulk status for filtered orders
  const handleBulkQuickStatus = (status: string) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    bulkUpdateStatus.mutate({ ids, status });
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Search & basic filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث برقم الطلب أو اسم العميل أو الهاتف" className="pr-10 font-cairo" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 font-cairo"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="الكل" className="font-cairo">الكل</SelectItem>
              {STATUSES.map(s => {
                const cfg = STATUS_CONFIG[s];
                const Icon = cfg.icon;
                return (
                  <SelectItem key={s} value={s} className="font-cairo">
                    <span className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                      {s}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button
            variant={showAdvanced ? 'default' : 'outline'}
            className="font-cairo gap-1.5"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Filter className="w-4 h-4" />
            فلتر متقدم
            {hasAdvancedFilters && <span className="w-2 h-2 rounded-full bg-destructive" />}
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="bg-card border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-cairo font-semibold text-sm flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" /> فلتر متقدم
              </h3>
              {hasAdvancedFilters && (
                <Button variant="ghost" size="sm" className="font-cairo text-xs" onClick={clearAdvanced}>
                  مسح الفلاتر
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <Label className="font-cairo text-xs">الولاية</Label>
                <Select value={wilayaFilter} onValueChange={setWilayaFilter}>
                  <SelectTrigger className="font-cairo mt-1 h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="الكل" className="font-cairo">الكل</SelectItem>
                    {wilayas?.map(w => <SelectItem key={w} value={w} className="font-cairo">{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-cairo text-xs">طريقة الدفع</Label>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="font-cairo mt-1 h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="الكل" className="font-cairo">الكل</SelectItem>
                    <SelectItem value="cod" className="font-cairo">الدفع عند التسليم</SelectItem>
                    <SelectItem value="baridimob" className="font-cairo">بريدي موب</SelectItem>
                    <SelectItem value="flexy" className="font-cairo">فليكسي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-cairo text-xs">من تاريخ</Label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="mt-1 h-9 text-xs" />
              </div>
              <div>
                <Label className="font-cairo text-xs">إلى تاريخ</Label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="mt-1 h-9 text-xs" />
              </div>
              <div>
                <Label className="font-cairo text-xs">أقل مبلغ</Label>
                <Input type="number" value={minTotal} onChange={e => setMinTotal(e.target.value)} placeholder="0" className="mt-1 h-9 text-xs font-roboto" />
              </div>
              <div>
                <Label className="font-cairo text-xs">أعلى مبلغ</Label>
                <Input type="number" value={maxTotal} onChange={e => setMaxTotal(e.target.value)} placeholder="∞" className="mt-1 h-9 text-xs font-roboto" />
              </div>
            </div>
            <p className="font-cairo text-xs text-muted-foreground">{filtered.length} طلب مطابق</p>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {someSelected && (
          <div className="flex flex-wrap items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg p-3">
            <CheckSquare className="w-5 h-5 text-primary" />
            <span className="font-cairo text-sm font-medium text-primary">{selectedIds.size} طلب محدد</span>
            <div className="flex flex-wrap gap-2 mr-auto">
              {STATUSES.map(s => {
                const cfg = STATUS_CONFIG[s];
                const Icon = cfg.icon;
                return (
                  <Button
                    key={s}
                    size="sm"
                    variant="outline"
                    className={`font-cairo gap-1.5 text-xs ${cfg.color}`}
                    onClick={() => handleBulkQuickStatus(s)}
                    disabled={bulkUpdateStatus.isPending}
                  >
                    <Icon className="w-3.5 h-3.5" /> {s}
                  </Button>
                );
              })}
            </div>
            <Button size="sm" variant="ghost" className="font-cairo text-xs" onClick={() => setSelectedIds(new Set())}>
              إلغاء التحديد
            </Button>
          </div>
        )}

        <div className="bg-card border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-right">
                  <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                </th>
                <th className="p-3 text-right font-cairo">رقم الطلب</th>
                <th className="p-3 text-right font-cairo">العميل</th>
                <th className="p-3 text-right font-cairo">الهاتف</th>
                <th className="p-3 text-right font-cairo">الولاية</th>
                <th className="p-3 text-right font-cairo">الإجمالي</th>
                <th className="p-3 text-right font-cairo">الحالة</th>
                <th className="p-3 text-right font-cairo">التاريخ</th>
                <th className="p-3 text-right font-cairo">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const wilayaName = (o as any).wilayas?.name;
                const cancelRate = wilayaName ? riskyWilayas.get(wilayaName) : undefined;
                const statusCfg = STATUS_CONFIG[o.status || 'جديد'] || STATUS_CONFIG['جديد'];
                const StatusIcon = statusCfg.icon;
                return (
                  <tr key={o.id} className={`border-b hover:bg-muted/50 ${selectedIds.has(o.id) ? 'bg-primary/5' : ''}`}>
                    <td className="p-3">
                      <Checkbox checked={selectedIds.has(o.id)} onCheckedChange={() => toggleSelect(o.id)} />
                    </td>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-cairo cursor-pointer hover:opacity-80 transition-opacity ${statusCfg.bg} ${statusCfg.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {o.status}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-popover border z-50 min-w-[160px]">
                          {STATUSES.map(s => {
                            const cfg = STATUS_CONFIG[s];
                            const Icon = cfg.icon;
                            const isActive = o.status === s;
                            return (
                              <DropdownMenuItem
                                key={s}
                                onClick={() => !isActive && handleQuickStatus(o.id, s)}
                                className={`font-cairo gap-2 cursor-pointer ${isActive ? 'bg-muted font-bold' : ''}`}
                              >
                                <Icon className={`w-4 h-4 ${cfg.color}`} />
                                {s}
                                {isActive && <CheckCircle className="w-3.5 h-3.5 text-primary mr-auto" />}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                    <td className="p-3 font-cairo text-xs text-muted-foreground">{formatDate(o.created_at!)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedOrder(o); setNewStatus(o.status || 'جديد'); }}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="font-cairo">عرض التفاصيل</TooltipContent>
                        </Tooltip>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border z-50 min-w-[160px]">
                            <DropdownMenuItem onClick={() => handleQuickStatus(o.id, 'قيد المعالجة')} className="font-cairo gap-2 cursor-pointer">
                              <PackageOpen className="w-4 h-4 text-orange-500" />
                              قيد المعالجة
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleQuickStatus(o.id, 'تم الشحن')} className="font-cairo gap-2 cursor-pointer">
                              <Truck className="w-4 h-4 text-blue-500" />
                              تم الشحن
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleQuickStatus(o.id, 'تم التسليم')} className="font-cairo gap-2 cursor-pointer">
                              <PackageCheck className="w-4 h-4 text-primary" />
                              تم التسليم
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleQuickStatus(o.id, 'ملغي')} className="font-cairo gap-2 cursor-pointer text-destructive">
                              <Ban className="w-4 h-4" />
                              إلغاء الطلب
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
                  <div><span className="text-muted-foreground">الدفع:</span> {selectedOrder.payment_method === 'baridimob' ? 'بريدي موب' : selectedOrder.payment_method === 'flexy' ? 'فليكسي' : selectedOrder.payment_method === 'cod' ? 'الدفع عند التسليم' : selectedOrder.payment_method}</div>
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
                      <SelectContent>
                        {STATUSES.map(s => {
                          const cfg = STATUS_CONFIG[s];
                          const Icon = cfg.icon;
                          return (
                            <SelectItem key={s} value={s} className="font-cairo">
                              <span className="flex items-center gap-2">
                                <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                                {s}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => { updateStatus.mutate({ id: selectedOrder.id, status: newStatus }); setSelectedOrder(null); }} disabled={updateStatus.isPending} className="font-cairo">حفظ</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
