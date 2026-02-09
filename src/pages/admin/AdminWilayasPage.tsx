import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, MapPin } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { TableSkeleton } from '@/components/LoadingSkeleton';

const DEFAULT_WILAYAS = [
  { name: 'الجزائر', shipping_price: 400, is_active: true },
  { name: 'وهران', shipping_price: 500, is_active: true },
  { name: 'قسنطينة', shipping_price: 600, is_active: true },
  { name: 'سطيف', shipping_price: 550, is_active: true },
  { name: 'عنابة', shipping_price: 650, is_active: true },
  { name: 'غرداية', shipping_price: 500, is_active: true },
];

export default function AdminWilayasPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', shipping_price: '', is_active: true });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: wilayas, isLoading } = useQuery({
    queryKey: ['admin-wilayas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('wilayas').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // Seed defaults if table is empty
  useEffect(() => {
    if (wilayas && wilayas.length === 0) {
      supabase.from('wilayas').insert(DEFAULT_WILAYAS).then(() => {
        qc.invalidateQueries({ queryKey: ['admin-wilayas'] });
      });
    }
  }, [wilayas, qc]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name, shipping_price: Number(form.shipping_price), is_active: form.is_active };
      if (editing) {
        const { error } = await supabase.from('wilayas').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('wilayas').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-wilayas'] });
      setDialogOpen(false);
      setEditing(null);
      toast({ title: editing ? 'تم تحديث الولاية ✅' : 'تمت إضافة الولاية ✅' });
    },
    onError: () => toast({ title: 'خطأ', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('wilayas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-wilayas'] });
      toast({ title: 'تم حذف الولاية ✅' });
      setDeleteTarget(null);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('wilayas').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-wilayas'] }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', shipping_price: '', is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (w: any) => {
    setEditing(w);
    setForm({ name: w.name, shipping_price: String(w.shipping_price), is_active: w.is_active !== false });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-cairo font-bold text-xl">الولايات ({wilayas?.length || 0})</h2>
        <Button onClick={openCreate} className="font-cairo gap-1"><Plus className="w-4 h-4" /> إضافة ولاية</Button>
      </div>

      {isLoading ? <TableSkeleton rows={5} cols={4} /> : <div className="bg-card border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-right font-cairo">اسم الولاية</th>
              <th className="p-3 text-right font-cairo">سعر التوصيل (دج)</th>
              <th className="p-3 text-right font-cairo">الحالة</th>
              <th className="p-3 text-right font-cairo">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {wilayas?.map(w => (
              <tr key={w.id} className="border-b hover:bg-muted/50">
                <td className="p-3 font-cairo font-medium">{w.name}</td>
                <td className="p-3 font-roboto">{formatPrice(Number(w.shipping_price))}</td>
                <td className="p-3">
                  <Switch
                    checked={w.is_active !== false}
                    onCheckedChange={v => toggleActive.mutate({ id: w.id, is_active: v })}
                  />
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(w)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(w.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {(!wilayas || wilayas.length === 0) && (
              <tr><td colSpan={4} className="p-8 text-center font-cairo text-muted-foreground">لا توجد ولايات</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={v => { if (!v) { setDialogOpen(false); setEditing(null); } else setDialogOpen(true); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-cairo">{editing ? 'تعديل الولاية' : 'إضافة ولاية'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="font-cairo">اسم الولاية</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="font-cairo mt-1" />
            </div>
            <div>
              <Label className="font-cairo">سعر التوصيل (دج)</Label>
              <Input type="number" min="0" value={form.shipping_price} onChange={e => setForm(f => ({ ...f, shipping_price: e.target.value }))} className="font-roboto mt-1" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label className="font-cairo">{form.is_active ? 'نشط' : 'معطّل'}</Label>
            </div>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name || !form.shipping_price} className="w-full font-cairo font-semibold">
              {saveMutation.isPending ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" /> جاري الحفظ...</> : 'حفظ'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-cairo">حذف الولاية</AlertDialogTitle>
            <AlertDialogDescription className="font-cairo">هل أنت متأكد من حذف هذه الولاية؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-cairo">إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground font-cairo" onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}>
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
