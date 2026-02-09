import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/format';

export default function AdminCouponsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ code: '', discount_type: 'percentage', discount_value: '', expiry_date: '', is_active: true });

  const { data: coupons } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data } = await supabase.from('coupons').select('*').order('created_at' as any, { ascending: false });
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: form.code.toUpperCase(),
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        expiry_date: form.expiry_date || null,
        is_active: form.is_active,
      };
      if (editing) {
        await supabase.from('coupons').update(payload).eq('id', editing.id);
      } else {
        await supabase.from('coupons').insert(payload);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-coupons'] }); setDialogOpen(false); toast({ title: 'تم الحفظ' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await supabase.from('coupons').delete().eq('id', id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-coupons'] }); toast({ title: 'تم الحذف' }); },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-cairo font-bold text-xl">كوبونات الخصم</h2>
        <Button onClick={() => { setEditing(null); setForm({ code: '', discount_type: 'percentage', discount_value: '', expiry_date: '', is_active: true }); setDialogOpen(true); }} className="font-cairo gap-1"><Plus className="w-4 h-4" /> إضافة كوبون</Button>
      </div>
      <div className="bg-card border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-right font-cairo">الكود</th>
              <th className="p-3 text-right font-cairo">النوع</th>
              <th className="p-3 text-right font-cairo">القيمة</th>
              <th className="p-3 text-right font-cairo">الصلاحية</th>
              <th className="p-3 text-right font-cairo">الحالة</th>
              <th className="p-3 text-right font-cairo">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {coupons?.map(c => (
              <tr key={c.id} className="border-b hover:bg-muted/50">
                <td className="p-3 font-roboto font-bold">{c.code}</td>
                <td className="p-3 font-cairo">{c.discount_type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}</td>
                <td className="p-3 font-roboto">{c.discount_type === 'percentage' ? `${c.discount_value}%` : `${c.discount_value} دج`}</td>
                <td className="p-3 font-cairo text-xs">{c.expiry_date ? formatDate(c.expiry_date) : '—'}</td>
                <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full font-cairo ${c.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{c.is_active ? 'نشط' : 'معطّل'}</span></td>
                <td className="p-3 flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(c); setForm({ code: c.code, discount_type: c.discount_type, discount_value: String(c.discount_value), expiry_date: c.expiry_date ? c.expiry_date.split('T')[0] : '', is_active: c.is_active ?? true }); setDialogOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm('حذف؟')) deleteMutation.mutate(c.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-cairo">{editing ? 'تعديل الكوبون' : 'إضافة كوبون'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="font-cairo">الكود</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="font-roboto mt-1" dir="ltr" /></div>
            <div>
              <Label className="font-cairo">نوع الخصم</Label>
              <Select value={form.discount_type} onValueChange={v => setForm(f => ({ ...f, discount_type: v }))}>
                <SelectTrigger className="font-cairo mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage" className="font-cairo">نسبة مئوية (%)</SelectItem>
                  <SelectItem value="fixed" className="font-cairo">مبلغ ثابت (دج)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="font-cairo">القيمة</Label><Input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} className="font-roboto mt-1" /></div>
            <div><Label className="font-cairo">تاريخ الانتهاء</Label><Input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} className="font-roboto mt-1" dir="ltr" /></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /><Label className="font-cairo">نشط</Label></div>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full font-cairo font-semibold">حفظ</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
