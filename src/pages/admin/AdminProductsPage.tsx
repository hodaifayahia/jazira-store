import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/format';

const CATEGORIES = ['أدوات منزلية', 'منتجات زينة', 'إكسسوارات'];

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: CATEGORIES[0], stock: '0', is_active: true });
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      let imageUrls: string[] = editing?.images || [];
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const ext = file.name.split('.').pop();
          const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error } = await supabase.storage.from('products').upload(path, file);
          if (error) throw error;
          const { data } = supabase.storage.from('products').getPublicUrl(path);
          imageUrls.push(data.publicUrl);
        }
      }
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        stock: Number(form.stock),
        is_active: form.is_active,
        images: imageUrls,
      };
      if (editing) {
        const { error } = await supabase.from('products').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      setDialogOpen(false);
      setEditing(null);
      setImageFiles([]);
      toast({ title: editing ? 'تم التعديل' : 'تمت الإضافة' });
    },
    onError: () => toast({ title: 'خطأ', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: 'تم الحذف' });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: '', category: CATEGORIES[0], stock: '0', is_active: true });
    setImageFiles([]);
    setDialogOpen(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description || '', price: String(p.price), category: p.category, stock: String(p.stock), is_active: p.is_active });
    setImageFiles([]);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-cairo font-bold text-xl">المنتجات ({products?.length || 0})</h2>
        <Button onClick={openCreate} className="font-cairo gap-1"><Plus className="w-4 h-4" /> إضافة منتج</Button>
      </div>

      <div className="bg-card border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-right font-cairo">المنتج</th>
              <th className="p-3 text-right font-cairo">السعر</th>
              <th className="p-3 text-right font-cairo">الفئة</th>
              <th className="p-3 text-right font-cairo">المخزون</th>
              <th className="p-3 text-right font-cairo">الحالة</th>
              <th className="p-3 text-right font-cairo">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {products?.map(p => (
              <tr key={p.id} className="border-b hover:bg-muted/50">
                <td className="p-3 font-cairo font-medium">{p.name}</td>
                <td className="p-3 font-roboto">{formatPrice(Number(p.price))}</td>
                <td className="p-3 font-cairo text-xs">{p.category}</td>
                <td className="p-3 font-roboto">{p.stock}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-cairo ${p.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {p.is_active ? 'نشط' : 'معطّل'}
                  </span>
                </td>
                <td className="p-3 flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm('هل أنت متأكد من الحذف؟')) deleteMutation.mutate(p.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-cairo">{editing ? 'تعديل المنتج' : 'إضافة منتج جديد'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="font-cairo">اسم المنتج</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="font-cairo mt-1" /></div>
            <div><Label className="font-cairo">الوصف</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="font-cairo mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="font-cairo">السعر (دج)</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="font-roboto mt-1" /></div>
              <div><Label className="font-cairo">المخزون</Label><Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className="font-roboto mt-1" /></div>
            </div>
            <div>
              <Label className="font-cairo">الفئة</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="font-cairo mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c} className="font-cairo">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="font-cairo">صور المنتج</Label><Input type="file" multiple accept="image/*" onChange={e => setImageFiles(Array.from(e.target.files || []))} className="mt-1" /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label className="font-cairo">نشط</Label>
            </div>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full font-cairo font-semibold">
              {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
