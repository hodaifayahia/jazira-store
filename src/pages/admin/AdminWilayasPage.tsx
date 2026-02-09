import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, BarChart3 } from 'lucide-react';
import { formatPrice } from '@/lib/format';

export default function AdminWilayasPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', shipping_price: '', is_active: true });

  // Stats dialog
  const [statsWilaya, setStatsWilaya] = useState<any>(null);
  const [statsOpen, setStatsOpen] = useState(false);

  const { data: wilayas } = useQuery({
    queryKey: ['admin-wilayas'],
    queryFn: async () => {
      const { data } = await supabase.from('wilayas').select('*').order('name');
      return data || [];
    },
  });

  const { data: statsOrders, isLoading: statsLoading } = useQuery({
    queryKey: ['wilaya-stats', statsWilaya?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, status, total_amount')
        .eq('wilaya_id', statsWilaya.id);
      return data || [];
    },
    enabled: !!statsWilaya?.id,
  });

  const statsData = statsOrders ? (() => {
    const totalOrders = statsOrders.length;
    const totalRevenue = statsOrders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
    const byStatus: Record<string, number> = {};
    statsOrders.forEach(o => {
      const st = o.status || 'غير محدد';
      byStatus[st] = (byStatus[st] || 0) + 1;
    });
    return { totalOrders, totalRevenue, byStatus };
  })() : null;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name, shipping_price: Number(form.shipping_price), is_active: form.is_active };
      if (editing) {
        await supabase.from('wilayas').update(payload).eq('id', editing.id);
      } else {
        await supabase.from('wilayas').insert(payload);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-wilayas'] }); setDialogOpen(false); toast({ title: 'تم الحفظ' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await supabase.from('wilayas').delete().eq('id', id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-wilayas'] }); toast({ title: 'تم الحذف' }); },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-cairo font-bold text-xl">الولايات ({wilayas?.length || 0})</h2>
        <Button onClick={() => { setEditing(null); setForm({ name: '', shipping_price: '', is_active: true }); setDialogOpen(true); }} className="font-cairo gap-1"><Plus className="w-4 h-4" /> إضافة ولاية</Button>
      </div>
      <div className="bg-card border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-right font-cairo">الولاية</th>
              <th className="p-3 text-right font-cairo">سعر التوصيل</th>
              <th className="p-3 text-right font-cairo">الحالة</th>
              <th className="p-3 text-right font-cairo">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {wilayas?.map(w => (
              <tr key={w.id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => { setStatsWilaya(w); setStatsOpen(true); }}>
                <td className="p-3 font-cairo">{w.name}</td>
                <td className="p-3 font-roboto">{formatPrice(Number(w.shipping_price))}</td>
                <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full font-cairo ${w.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{w.is_active ? 'نشط' : 'معطّل'}</span></td>
                <td className="p-3">
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setStatsWilaya(w); setStatsOpen(true); }}><BarChart3 className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(w); setForm({ name: w.name, shipping_price: String(w.shipping_price), is_active: w.is_active ?? true }); setDialogOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm('حذف؟')) deleteMutation.mutate(w.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit/Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-cairo">{editing ? 'تعديل الولاية' : 'إضافة ولاية'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="font-cairo">اسم الولاية</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="font-cairo mt-1" /></div>
            <div><Label className="font-cairo">سعر التوصيل (دج)</Label><Input type="number" value={form.shipping_price} onChange={e => setForm(f => ({ ...f, shipping_price: e.target.value }))} className="font-roboto mt-1" /></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /><Label className="font-cairo">نشط</Label></div>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full font-cairo font-semibold">حفظ</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-cairo flex items-center gap-2"><BarChart3 className="w-5 h-5" /> إحصائيات — {statsWilaya?.name}</DialogTitle></DialogHeader>
          {statsLoading ? (
            <p className="font-cairo text-muted-foreground text-center py-8">جاري التحميل...</p>
          ) : statsData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-2xl font-roboto font-bold">{statsData.totalOrders}</p>
                  <p className="text-xs font-cairo text-muted-foreground mt-1">إجمالي الطلبات</p>
                </div>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-2xl font-roboto font-bold">{formatPrice(statsData.totalRevenue)}</p>
                  <p className="text-xs font-cairo text-muted-foreground mt-1">إجمالي الإيرادات</p>
                </div>
              </div>
              {Object.keys(statsData.byStatus).length > 0 ? (
                <div>
                  <p className="font-cairo font-semibold text-sm mb-2">حسب الحالة</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(statsData.byStatus).map(([status, count]) => (
                      <Badge key={status} variant="secondary" className="font-cairo gap-1">
                        {status} <span className="font-roboto font-bold">{count}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="font-cairo text-muted-foreground text-center text-sm">لا توجد طلبات لهذه الولاية</p>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
