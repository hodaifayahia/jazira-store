import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, Palette, ImageIcon, Upload, X, Search } from 'lucide-react';
import { formatPrice } from '@/lib/format';

export default function AdminVariationsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formProductId, setFormProductId] = useState('');
  const [formType, setFormType] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formPriceAdj, setFormPriceAdj] = useState('0');
  const [formStock, setFormStock] = useState('0');
  const [formActive, setFormActive] = useState(true);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: products } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, name').order('name');
      return data || [];
    },
  });

  const { data: variations, isLoading } = useQuery({
    queryKey: ['admin-all-variations'],
    queryFn: async () => {
      const { data } = await supabase.from('product_variations').select('*').order('variation_type');
      return data || [];
    },
  });

  // Get unique variation types for suggestions
  const existingTypes = useMemo(() => {
    if (!variations) return [];
    return [...new Set(variations.map(v => v.variation_type))];
  }, [variations]);

  // Filter variations
  const filtered = useMemo(() => {
    return (variations || []).filter(v => {
      const matchProduct = selectedProductId === 'all' || v.product_id === selectedProductId;
      const matchSearch = !searchQuery || v.variation_value.toLowerCase().includes(searchQuery.toLowerCase()) || v.variation_type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchProduct && matchSearch;
    });
  }, [variations, selectedProductId, searchQuery]);

  // Group by product
  const groupedByProduct = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach(v => {
      if (!groups[v.product_id]) groups[v.product_id] = [];
      groups[v.product_id].push(v);
    });
    return groups;
  }, [filtered]);

  const getProductName = (id: string) => products?.find(p => p.id === id)?.name || 'منتج غير معروف';

  const openCreate = () => {
    setEditing(null);
    setFormProductId(selectedProductId !== 'all' ? selectedProductId : (products?.[0]?.id || ''));
    setFormType(existingTypes[0] || '');
    setFormValue('');
    setFormPriceAdj('0');
    setFormStock('0');
    setFormActive(true);
    setFormImageUrl('');
    setShowForm(true);
  };

  const openEdit = (v: any) => {
    setEditing(v);
    setFormProductId(v.product_id);
    setFormType(v.variation_type);
    setFormValue(v.variation_value);
    setFormPriceAdj(String(v.price_adjustment || 0));
    setFormStock(String(v.stock || 0));
    setFormActive(v.is_active ?? true);
    setFormImageUrl(v.image_url || '');
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast({ title: 'حجم الصورة كبير (الحد 5MB)', variant: 'destructive' }); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `variations/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('products').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('products').getPublicUrl(path);
      setFormImageUrl(data.publicUrl);
      toast({ title: 'تم رفع الصورة ✅' });
    } catch {
      toast({ title: 'فشل رفع الصورة', variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formProductId || !formType.trim() || !formValue.trim()) throw new Error('جميع الحقول مطلوبة');
      const payload = {
        product_id: formProductId,
        variation_type: formType.trim(),
        variation_value: formValue.trim(),
        price_adjustment: Number(formPriceAdj) || 0,
        stock: Number(formStock) || 0,
        is_active: formActive,
        image_url: formImageUrl || null,
      };
      if (editing) {
        const { error } = await supabase.from('product_variations').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('product_variations').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-all-variations'] });
      setShowForm(false);
      toast({ title: editing ? 'تم تعديل المتغير ✅' : 'تمت إضافة المتغير ✅' });
    },
    onError: (err: any) => toast({ title: err.message || 'حدث خطأ', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_variations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-all-variations'] });
      setDeleteDialog(null);
      toast({ title: 'تم حذف المتغير' });
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="font-cairo font-bold text-2xl text-foreground">المتغيرات</h2>
          <p className="font-cairo text-sm text-muted-foreground mt-1">{variations?.length || 0} متغير — ألوان، مقاسات، أنواع...</p>
        </div>
        <Button onClick={openCreate} className="font-cairo gap-1.5" size="sm">
          <Plus className="w-4 h-4" /> إضافة متغير
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="ابحث بالنوع أو القيمة..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-10 font-cairo h-10" />
        </div>
        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
          <SelectTrigger className="w-full sm:w-56 font-cairo h-10"><SelectValue placeholder="المنتج" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-cairo">كل المنتجات</SelectItem>
            {products?.map(p => <SelectItem key={p.id} value={p.id} className="font-cairo">{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 font-cairo text-muted-foreground">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card border rounded-xl">
          <Palette className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-cairo text-muted-foreground">لا توجد متغيرات</p>
          <Button onClick={openCreate} variant="outline" className="font-cairo mt-4 gap-1">
            <Plus className="w-4 h-4" /> إضافة أول متغير
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByProduct).map(([productId, vars]) => (
            <div key={productId} className="bg-card border rounded-xl overflow-hidden">
              <div className="bg-muted/50 px-4 py-3 border-b">
                <h3 className="font-cairo font-semibold text-sm">{getProductName(productId)}</h3>
              </div>
              <div className="divide-y">
                {vars.map(v => (
                  <div key={v.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group">
                    {/* Image thumbnail */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                      {v.image_url ? (
                        <img src={v.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Palette className="w-4 h-4 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-cairo text-xs bg-secondary/10 text-secondary-foreground px-2 py-0.5 rounded-full">{v.variation_type}</span>
                        <span className="font-cairo font-medium text-sm">{v.variation_value}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground font-cairo">
                        {Number(v.price_adjustment) !== 0 && <span>فرق السعر: {formatPrice(Number(v.price_adjustment))}</span>}
                        <span>المخزون: {v.stock}</span>
                        <span className={v.is_active ? 'text-primary' : 'text-destructive'}>{v.is_active ? 'نشط' : 'معطّل'}</span>
                      </div>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" onClick={() => openEdit(v)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteDialog(v.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-cairo">{editing ? 'تعديل المتغير' : 'إضافة متغير جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="font-cairo text-sm">المنتج <span className="text-destructive">*</span></Label>
              <Select value={formProductId} onValueChange={setFormProductId}>
                <SelectTrigger className="font-cairo mt-1.5"><SelectValue placeholder="اختر المنتج" /></SelectTrigger>
                <SelectContent>
                  {products?.map(p => <SelectItem key={p.id} value={p.id} className="font-cairo">{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-cairo text-sm">النوع <span className="text-destructive">*</span></Label>
                <Input
                  value={formType}
                  onChange={e => setFormType(e.target.value)}
                  placeholder="مثل: اللون، المقاس"
                  className="font-cairo mt-1.5"
                  list="variation-types"
                />
                <datalist id="variation-types">
                  {existingTypes.map(t => <option key={t} value={t} />)}
                </datalist>
              </div>
              <div>
                <Label className="font-cairo text-sm">القيمة <span className="text-destructive">*</span></Label>
                <Input value={formValue} onChange={e => setFormValue(e.target.value)} placeholder="مثل: أحمر، XL" className="font-cairo mt-1.5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-cairo text-sm">فرق السعر (دج)</Label>
                <Input type="number" value={formPriceAdj} onChange={e => setFormPriceAdj(e.target.value)} className="font-roboto mt-1.5" />
              </div>
              <div>
                <Label className="font-cairo text-sm">المخزون</Label>
                <Input type="number" value={formStock} onChange={e => setFormStock(e.target.value)} className="font-roboto mt-1.5" />
              </div>
            </div>

            {/* Image upload */}
            <div>
              <Label className="font-cairo text-sm">صورة المتغير (اختياري)</Label>
              <div className="mt-1.5 flex items-center gap-3">
                {formImageUrl ? (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                    <img src={formImageUrl} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => setFormImageUrl('')} className="absolute top-0.5 right-0.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-muted-foreground/30" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  <Button variant="outline" size="sm" className="font-cairo gap-1.5 pointer-events-none" disabled={uploading}>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? 'جاري الرفع...' : 'رفع صورة'}
                  </Button>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={formActive} onCheckedChange={setFormActive} />
              <Label className="font-cairo text-sm">{formActive ? 'نشط' : 'معطّل'}</Label>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="font-cairo">إلغاء</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !formProductId || !formType.trim() || !formValue.trim()} className="font-cairo gap-1.5">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editing ? 'حفظ' : 'إضافة'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog !== null} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-cairo text-center">حذف المتغير</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <p className="font-cairo text-muted-foreground">هل أنت متأكد من حذف هذا المتغير؟</p>
            <div className="flex gap-2 justify-center pt-2">
              <Button variant="outline" onClick={() => setDeleteDialog(null)} className="font-cairo px-6">إلغاء</Button>
              <Button variant="destructive" onClick={() => deleteDialog && deleteMutation.mutate(deleteDialog)} disabled={deleteMutation.isPending} className="font-cairo px-6">
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حذف'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
