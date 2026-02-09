import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, CalendarIcon, Tag } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { TableSkeleton } from '@/components/LoadingSkeleton';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AdminCouponsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState('');
  const [form, setForm] = useState({ code: '', discount_type: 'percentage', discount_value: '', expiry_date: '', is_active: true });

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase.from('coupons').select('*').order('created_at' as any, { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (form.discount_type === 'percentage' && Number(form.discount_value) > 100) {
        throw new Error('percentage_max');
      }
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      setDialogOpen(false);
      setValidationError('');
      toast({ title: 'تم الحفظ' });
    },
    onError: (err) => {
      if (err.message === 'percentage_max') {
        setValidationError('النسبة المئوية يجب أن لا تتجاوز 100');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await supabase.from('coupons').delete().eq('id', id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-coupons'] }); toast({ title: 'تم الحذف' }); },
  });

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const expiryAsDate = form.expiry_date ? new Date(form.expiry_date) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-cairo font-bold text-xl">كوبونات الخصم</h2>
        <Button onClick={() => { setEditing(null); setForm({ code: '', discount_type: 'percentage', discount_value: '', expiry_date: '', is_active: true }); setValidationError(''); setDialogOpen(true); }} className="font-cairo gap-1"><Plus className="w-4 h-4" /> إضافة كوبون</Button>
      </div>
      <div className="bg-card border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-right font-cairo">كود الخصم</th>
              <th className="p-3 text-right font-cairo">نوع الخصم</th>
              <th className="p-3 text-right font-cairo">القيمة</th>
              <th className="p-3 text-right font-cairo">تاريخ الانتهاء</th>
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
                <td className="p-3 flex gap-1 flex-wrap">
                  <span className={`text-xs px-2 py-1 rounded-full font-cairo ${c.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{c.is_active ? 'نشط' : 'معطّل'}</span>
                  {isExpired(c.expiry_date) && <span className="text-xs px-2 py-1 rounded-full font-cairo bg-muted text-muted-foreground">منتهي</span>}
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(c); setForm({ code: c.code, discount_type: c.discount_type, discount_value: String(c.discount_value), expiry_date: c.expiry_date ? c.expiry_date.split('T')[0] : '', is_active: c.is_active ?? true }); setValidationError(''); setDialogOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-cairo">حذف الكوبون</AlertDialogTitle>
            <AlertDialogDescription className="font-cairo">هل أنت متأكد من حذف هذا الكوبون؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-cairo">إلغاء</AlertDialogCancel>
            <AlertDialogAction className="font-cairo" onClick={() => { if (deleteId) deleteMutation.mutate(deleteId); setDeleteId(null); }}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-cairo">{editing ? 'تعديل الكوبون' : 'إضافة كوبون'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="font-cairo">كود الخصم</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="font-roboto mt-1" dir="ltr" /></div>
            
            <div>
              <Label className="font-cairo mb-2 block">نوع الخصم</Label>
              <RadioGroup value={form.discount_type} onValueChange={v => { setForm(f => ({ ...f, discount_type: v })); setValidationError(''); }} className="flex gap-4" dir="rtl">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="percentage" id="pct" />
                  <Label htmlFor="pct" className="font-cairo cursor-pointer">نسبة مئوية (%)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="fixed" id="fixed" />
                  <Label htmlFor="fixed" className="font-cairo cursor-pointer">مبلغ ثابت (دج)</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="font-cairo">القيمة</Label>
              <Input type="number" value={form.discount_value} onChange={e => { setForm(f => ({ ...f, discount_value: e.target.value })); setValidationError(''); }} className="font-roboto mt-1" />
              {validationError && <p className="text-destructive text-xs mt-1 font-cairo">{validationError}</p>}
            </div>

            <div>
              <Label className="font-cairo mb-1 block">تاريخ الانتهاء</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-roboto", !form.expiry_date && "text-muted-foreground")}>
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {form.expiry_date ? format(new Date(form.expiry_date), 'yyyy-MM-dd') : <span className="font-cairo">اختر تاريخ</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expiryAsDate}
                    onSelect={(d) => setForm(f => ({ ...f, expiry_date: d ? format(d, 'yyyy-MM-dd') : '' }))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /><Label className="font-cairo">مفعّل</Label></div>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full font-cairo font-semibold gap-2">
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              حفظ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
