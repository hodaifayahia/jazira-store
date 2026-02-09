import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search, X, Loader2, ImageIcon, Package } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { TableSkeleton } from '@/components/LoadingSkeleton';

const CATEGORIES = ['أدوات منزلية', 'منتجات زينة', 'إكسسوارات'];
const PAGE_SIZE = 10;

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: CATEGORIES[0], stock: '0', is_active: true });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = products?.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) || [];
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const saveMutation = useMutation({
    mutationFn: async () => {
      let imageUrls = [...existingImages];
      for (const file of imageFiles) {
        const ext = file.name.split('.').pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('products').upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage.from('products').getPublicUrl(path);
        imageUrls.push(data.publicUrl);
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
      closeSheet();
      toast({ title: editing ? 'تم تحديث المنتج ✅' : 'تمت إضافة المنتج ✅' });
    },
    onError: () => toast({ title: 'خطأ', description: 'حدث خطأ أثناء الحفظ', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: 'تم حذف المنتج ✅' });
      setDeleteTarget(null);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('products').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const closeSheet = () => {
    setSheetOpen(false);
    setEditing(null);
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: '', category: CATEGORIES[0], stock: '0', is_active: true });
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
    setSheetOpen(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description || '', price: String(p.price), category: p.category, stock: String(p.stock ?? 0), is_active: p.is_active !== false });
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages(p.images || []);
    setSheetOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(prev => [...prev, ...files]);
    const previews = files.map(f => URL.createObjectURL(f));
    setImagePreviews(prev => [...prev, ...previews]);
  };

  const removeNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="font-cairo font-bold text-xl">المنتجات ({filtered.length})</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="بحث عن منتج..." className="font-cairo pr-9" />
          </div>
          <Button onClick={openCreate} className="font-cairo gap-1 shrink-0"><Plus className="w-4 h-4" /> إضافة منتج جديد</Button>
        </div>
      </div>

      {isLoading ? <TableSkeleton rows={5} cols={7} /> : <div className="bg-card border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-right font-cairo">صورة</th>
              <th className="p-3 text-right font-cairo">اسم المنتج</th>
              <th className="p-3 text-right font-cairo">السعر</th>
              <th className="p-3 text-right font-cairo">التصنيف</th>
              <th className="p-3 text-right font-cairo">الكمية</th>
              <th className="p-3 text-right font-cairo">الحالة</th>
              <th className="p-3 text-right font-cairo">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(p => (
              <tr key={p.id} className="border-b hover:bg-muted/50">
                <td className="p-3">
                  {p.images && p.images.length > 0 ? (
                    <img src={p.images[0]} alt={p.name} className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center"><ImageIcon className="w-4 h-4 text-muted-foreground" /></div>
                  )}
                </td>
                <td className="p-3 font-cairo font-medium">{p.name}</td>
                <td className="p-3 font-roboto">{formatPrice(Number(p.price))}</td>
                <td className="p-3 font-cairo text-xs">{p.category}</td>
                <td className="p-3 font-roboto">{p.stock}</td>
                <td className="p-3">
                  <Switch
                    checked={p.is_active !== false}
                    onCheckedChange={v => toggleActive.mutate({ id: p.id, is_active: v })}
                  />
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center font-cairo text-muted-foreground">لا توجد منتجات</td></tr>
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

      {/* Sheet for Create/Edit */}
      <Sheet open={sheetOpen} onOpenChange={v => { if (!v) closeSheet(); else setSheetOpen(true); }}>
        <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-cairo">{editing ? 'تعديل المنتج' : 'إضافة منتج جديد'}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div>
              <Label className="font-cairo">اسم المنتج *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="font-cairo mt-1" />
            </div>
            <div>
              <Label className="font-cairo">الوصف *</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="font-cairo mt-1" rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-cairo">السعر (دج) *</Label>
                <Input type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="font-roboto mt-1" />
              </div>
              <div>
                <Label className="font-cairo">الكمية المتوفرة</Label>
                <Input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className="font-roboto mt-1" />
              </div>
            </div>
            <div>
              <Label className="font-cairo">التصنيف</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="font-cairo mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c} className="font-cairo">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-cairo">رفع الصور</Label>
              <Input type="file" multiple accept="image/*" onChange={handleFileChange} className="mt-1" />
              {/* Existing images */}
              {existingImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {existingImages.map((url, i) => (
                    <div key={url} className="relative group">
                      <img src={url} alt="" className="w-16 h-16 rounded object-cover border" />
                      <button onClick={() => removeExistingImage(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* New image previews */}
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {imagePreviews.map((url, i) => (
                    <div key={url} className="relative group">
                      <img src={url} alt="" className="w-16 h-16 rounded object-cover border border-primary/30" />
                      <button onClick={() => removeNewImage(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label className="font-cairo">{form.is_active ? 'مفعّل' : 'معطّل'}</Label>
            </div>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name || !form.price} className="w-full font-cairo font-semibold">
              {saveMutation.isPending ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" /> جاري الحفظ...</> : editing ? 'تحديث' : 'حفظ'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-cairo">حذف المنتج</AlertDialogTitle>
            <AlertDialogDescription className="font-cairo">هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
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
