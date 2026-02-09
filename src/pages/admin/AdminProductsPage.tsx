import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Star, X, Upload, ImageIcon, Loader2, Package, Search } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { useCategories } from '@/hooks/useCategories';

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: categoriesData } = useCategories();
  const categoryNames = categoriesData?.map(c => c.name) || [];

  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('الكل');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: 'تم حذف المنتج' });
    },
  });

  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  const openCreate = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const openEdit = (p: any) => {
    setEditingProduct(p);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  if (showForm) {
    return <ProductForm product={editingProduct} categoryNames={categoryNames} onClose={handleFormClose} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-cairo font-bold text-2xl text-foreground">المنتجات</h2>
          <p className="font-cairo text-sm text-muted-foreground mt-1">{products?.length || 0} منتج</p>
        </div>
        <Button onClick={openCreate} className="font-cairo gap-1.5">
          <Plus className="w-4 h-4" /> إضافة منتج
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 font-cairo text-muted-foreground">جاري التحميل...</div>
      ) : products && products.length > 0 ? (
        <div className="bg-card border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-3 text-right font-cairo font-semibold">الصورة</th>
                <th className="p-3 text-right font-cairo font-semibold">المنتج</th>
                <th className="p-3 text-right font-cairo font-semibold">السعر</th>
                <th className="p-3 text-right font-cairo font-semibold">الفئة</th>
                <th className="p-3 text-right font-cairo font-semibold">المخزون</th>
                <th className="p-3 text-right font-cairo font-semibold">الصور</th>
                <th className="p-3 text-right font-cairo font-semibold">الحالة</th>
                <th className="p-3 text-right font-cairo font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map(p => {
                const mainIdx = p.main_image_index ?? 0;
                const mainImage = p.images?.[mainIdx] || p.images?.[0];
                return (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="p-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                        {mainImage ? (
                          <img src={mainImage} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-cairo font-medium text-foreground max-w-[200px] truncate">{p.name}</td>
                    <td className="p-3 font-roboto font-bold text-primary">{formatPrice(Number(p.price))}</td>
                    <td className="p-3 font-cairo text-xs text-muted-foreground">{Array.isArray(p.category) ? p.category.join(', ') : p.category}</td>
                    <td className="p-3 font-roboto">{p.stock}</td>
                    <td className="p-3 font-roboto text-muted-foreground">{p.images?.length || 0}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-cairo ${p.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {p.is_active ? 'نشط' : 'معطّل'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" onClick={() => openEdit(p)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteDialog(p.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 bg-card border rounded-xl">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-cairo text-muted-foreground font-medium">لا توجد منتجات بعد</p>
          <Button onClick={openCreate} variant="outline" className="font-cairo mt-4 gap-1">
            <Plus className="w-4 h-4" /> إضافة أول منتج
          </Button>
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog open={deleteDialog !== null} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-cairo text-center">حذف المنتج</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <p className="font-cairo text-muted-foreground">هل أنت متأكد من حذف هذا المنتج؟</p>
            <div className="flex gap-2 justify-center pt-2">
              <Button variant="outline" onClick={() => setDeleteDialog(null)} className="font-cairo px-6">إلغاء</Button>
              <Button variant="destructive" onClick={() => { if (deleteDialog) { deleteMutation.mutate(deleteDialog); setDeleteDialog(null); } }} className="font-cairo px-6">حذف</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Product Form (full page) ─── */

function ProductForm({ product, categoryNames, onClose }: { product: any; categoryNames: string[]; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [category, setCategory] = useState(product ? (Array.isArray(product.category) ? product.category[0] : product.category) : categoryNames[0] || '');
  const [stock, setStock] = useState(product ? String(product.stock) : '0');
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [mainImageIndex, setMainImageIndex] = useState<number>(product?.main_image_index ?? 0);
  const [uploading, setUploading] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('اسم المنتج مطلوب');
      if (!price || Number(price) <= 0) throw new Error('السعر مطلوب');

      const payload = {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        category: [category],
        stock: Number(stock),
        is_active: isActive,
        images,
        main_image_index: mainImageIndex,
      };
      if (product) {
        const { error } = await supabase.from('products').update(payload).eq('id', product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: product ? 'تم تعديل المنتج ✅' : 'تمت إضافة المنتج ✅' });
      onClose();
    },
    onError: (err: any) => toast({ title: err.message || 'حدث خطأ', variant: 'destructive' }),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const oversized = files.find(f => f.size > 5 * 1024 * 1024);
    if (oversized) {
      toast({ title: 'حجم الصورة كبير جداً (الحد الأقصى 5MB)', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('products').upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage.from('products').getPublicUrl(path);
        newUrls.push(data.publicUrl);
      }
      setImages(prev => [...prev, ...newUrls]);
      toast({ title: `تم رفع ${newUrls.length} صورة ✅` });
    } catch {
      toast({ title: 'فشل رفع الصور', variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    if (mainImageIndex === index) setMainImageIndex(0);
    else if (mainImageIndex > index) setMainImageIndex(prev => prev - 1);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-cairo font-bold text-2xl text-foreground">
            {product ? 'تعديل المنتج' : 'إضافة منتج جديد'}
          </h2>
          <p className="font-cairo text-sm text-muted-foreground mt-1">
            {product ? 'قم بتعديل بيانات المنتج' : 'أدخل بيانات المنتج الجديد'}
          </p>
        </div>
        <Button variant="outline" onClick={onClose} className="font-cairo">
          ← العودة
        </Button>
      </div>

      {/* Images Section */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-cairo font-semibold text-base flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-primary" />
            </div>
            صور المنتج
          </h3>
          <label className="cursor-pointer">
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            <Button variant="outline" size="sm" className="font-cairo gap-1.5 pointer-events-none" disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'جاري الرفع...' : 'رفع صور'}
            </Button>
          </label>
        </div>

        {images.length > 0 ? (
          <>
            <p className="font-cairo text-xs text-muted-foreground">انقر على النجمة لاختيار الصورة الرئيسية التي ستظهر في الصفحة الرئيسية وقائمة المنتجات</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((url, idx) => (
                <div key={idx} className={`relative group rounded-xl overflow-hidden border-2 transition-all ${idx === mainImageIndex ? 'border-primary shadow-md' : 'border-transparent hover:border-muted-foreground/20'}`}>
                  <div className="aspect-square bg-muted">
                    <img src={url} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>

                  {/* Main badge */}
                  {idx === mainImageIndex && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-cairo px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> رئيسية
                    </div>
                  )}

                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {idx !== mainImageIndex && (
                      <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full shadow-lg" onClick={() => setMainImageIndex(idx)} title="تعيين كصورة رئيسية">
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    <Button size="icon" variant="destructive" className="h-9 w-9 rounded-full shadow-lg" onClick={() => removeImage(idx)} title="حذف الصورة">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl py-12 text-center">
            <ImageIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-cairo text-muted-foreground text-sm">لا توجد صور — ارفع صوراً للمنتج</p>
            <p className="font-cairo text-muted-foreground/60 text-xs mt-1">JPG, PNG — الحد الأقصى 5MB لكل صورة</p>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <h3 className="font-cairo font-semibold text-base flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="w-4 h-4 text-primary" />
          </div>
          بيانات المنتج
        </h3>

        <div className="space-y-4">
          <div>
            <Label className="font-cairo">اسم المنتج <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="font-cairo mt-1.5 h-11" placeholder="مثال: ساعة يد كلاسيكية" />
          </div>
          <div>
            <Label className="font-cairo">الوصف</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} className="font-cairo mt-1.5 min-h-[100px]" placeholder="أضف وصفاً تفصيلياً للمنتج..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-cairo">السعر (دج) <span className="text-destructive">*</span></Label>
              <Input type="number" value={price} onChange={e => setPrice(e.target.value)} className="font-roboto mt-1.5 h-11" placeholder="0" />
            </div>
            <div>
              <Label className="font-cairo">المخزون</Label>
              <Input type="number" value={stock} onChange={e => setStock(e.target.value)} className="font-roboto mt-1.5 h-11" placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-cairo">الفئة</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="font-cairo mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categoryNames.map(c => <SelectItem key={c} value={c} className="font-cairo">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end pb-1">
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label className="font-cairo">{isActive ? 'نشط — يظهر في المتجر' : 'معطّل — مخفي'}</Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onClose} className="font-cairo px-6">إلغاء</Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !name.trim() || !price} className="font-cairo px-8 gap-2">
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {saveMutation.isPending ? 'جاري الحفظ...' : product ? 'حفظ التعديلات' : 'إضافة المنتج'}
        </Button>
      </div>
    </div>
  );
}
