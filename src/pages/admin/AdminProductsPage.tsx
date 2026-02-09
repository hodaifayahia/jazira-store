import { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Star, X, Upload, ImageIcon, Loader2, Package, Search, Copy, Download, FileUp, ChevronLeft, ChevronRight, DollarSign, Tag, CheckSquare } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { useCategories } from '@/hooks/useCategories';

const ITEMS_PER_PAGE = 10;

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: categoriesData } = useCategories();
  const categoryNames = categoriesData?.map(c => c.name) || [];
  const importRef = useRef<HTMLInputElement>(null);

  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('الكل');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPriceDialog, setBulkPriceDialog] = useState(false);
  const [bulkCategoryDialog, setBulkCategoryDialog] = useState(false);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkCategory, setBulkCategory] = useState('');

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

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('products').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: 'تم تحديث الحالة' });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (p: any) => {
      const { id, created_at, ...rest } = p;
      const { error } = await supabase.from('products').insert({ ...rest, name: `${rest.name} (نسخة)` });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: 'تم نسخ المنتج ✅' });
    },
  });

  // Bulk mutations
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('products').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      setSelectedIds(new Set());
      setBulkDeleteDialog(false);
      toast({ title: `تم حذف ${selectedIds.size} منتج ✅` });
    },
  });

  const bulkUpdatePriceMutation = useMutation({
    mutationFn: async ({ ids, price }: { ids: string[]; price: number }) => {
      const { error } = await supabase.from('products').update({ price }).in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      setSelectedIds(new Set());
      setBulkPriceDialog(false);
      setBulkPrice('');
      toast({ title: `تم تحديث السعر لـ ${selectedIds.size} منتج ✅` });
    },
  });

  const bulkUpdateCategoryMutation = useMutation({
    mutationFn: async ({ ids, category }: { ids: string[]; category: string }) => {
      const { error } = await supabase.from('products').update({ category: [category] }).in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      setSelectedIds(new Set());
      setBulkCategoryDialog(false);
      setBulkCategory('');
      toast({ title: `تم تحديث الفئة لـ ${selectedIds.size} منتج ✅` });
    },
  });

  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  const openCreate = () => { setEditingProduct(null); setShowForm(true); };
  const openEdit = (p: any) => { setEditingProduct(p); setShowForm(true); };
  const handleFormClose = () => { setShowForm(false); setEditingProduct(null); };

  // Filtered products
  const filteredProducts = useMemo(() => {
    return (products || []).filter(p => {
      const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = filterCategory === 'الكل' || (Array.isArray(p.category) ? p.category.includes(filterCategory) : p.category === filterCategory);
      const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? p.is_active : !p.is_active);
      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, searchQuery, filterCategory, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page when filters change
  const handleFilterChange = (setter: (v: string) => void) => (v: string) => { setter(v); setCurrentPage(1); };

  // Selection helpers
  const allPageSelected = paginatedProducts.length > 0 && paginatedProducts.every(p => selectedIds.has(p.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allPageSelected) {
      const next = new Set(selectedIds);
      paginatedProducts.forEach(p => next.delete(p.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      paginatedProducts.forEach(p => next.add(p.id));
      setSelectedIds(next);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  // --- Export CSV ---
  const exportCSV = () => {
    if (!products || products.length === 0) return;
    const headers = ['name', 'description', 'price', 'category', 'stock', 'is_active'];
    const rows = products.map(p => [
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.description || '').replace(/"/g, '""')}"`,
      p.price,
      `"${Array.isArray(p.category) ? p.category.join(';') : p.category}"`,
      p.stock ?? 0,
      p.is_active ? 'true' : 'false',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `products-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: `تم تصدير ${products.length} منتج ✅` });
  };

  // --- Import CSV ---
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) { toast({ title: 'الملف فارغ', variant: 'destructive' }); return; }
    const rows = lines.slice(1);
    let imported = 0, errors = 0;
    for (const row of rows) {
      try {
        const cols = row.match(/(".*?"|[^,]+)/g)?.map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"')) || [];
        if (cols.length < 3) { errors++; continue; }
        const { error } = await supabase.from('products').insert({
          name: cols[0],
          description: cols[1] || '',
          price: Number(cols[2]) || 0,
          category: cols[3] ? cols[3].split(';') : [],
          stock: Number(cols[4]) || 0,
          is_active: cols[5] !== 'false',
        });
        if (error) { errors++; } else { imported++; }
      } catch { errors++; }
    }
    qc.invalidateQueries({ queryKey: ['admin-products'] });
    toast({ title: `تم استيراد ${imported} منتج${errors > 0 ? ` (${errors} أخطاء)` : ''} ✅` });
    e.target.value = '';
  };

  if (showForm) {
    return <ProductForm product={editingProduct} categoryNames={categoryNames} onClose={handleFormClose} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="font-cairo font-bold text-2xl text-foreground">المنتجات</h2>
          <p className="font-cairo text-sm text-muted-foreground mt-1">{products?.length || 0} منتج</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCSV} className="font-cairo gap-1.5" size="sm">
            <Download className="w-4 h-4" /> تصدير
          </Button>
          <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
          <Button variant="outline" onClick={() => importRef.current?.click()} className="font-cairo gap-1.5" size="sm">
            <FileUp className="w-4 h-4" /> استيراد
          </Button>
          <Button onClick={openCreate} className="font-cairo gap-1.5" size="sm">
            <Plus className="w-4 h-4" /> إضافة منتج
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="ابحث باسم المنتج..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="pr-10 font-cairo h-10" />
        </div>
        <Select value={filterCategory} onValueChange={handleFilterChange(setFilterCategory)}>
          <SelectTrigger className="w-full sm:w-44 font-cairo h-10"><SelectValue placeholder="الفئة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="الكل" className="font-cairo">كل الفئات</SelectItem>
            {categoryNames.map(c => <SelectItem key={c} value={c} className="font-cairo">{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={handleFilterChange(setFilterStatus)}>
          <SelectTrigger className="w-full sm:w-36 font-cairo h-10"><SelectValue placeholder="الحالة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-cairo">كل الحالات</SelectItem>
            <SelectItem value="active" className="font-cairo">نشط</SelectItem>
            <SelectItem value="inactive" className="font-cairo">معطّل</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions Bar */}
      {someSelected && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg p-3">
          <CheckSquare className="w-5 h-5 text-primary" />
          <span className="font-cairo text-sm font-medium text-primary">{selectedIds.size} منتج محدد</span>
          <div className="flex gap-2 mr-auto">
            <Button size="sm" variant="outline" className="font-cairo gap-1.5" onClick={() => { setBulkPrice(''); setBulkPriceDialog(true); }}>
              <DollarSign className="w-3.5 h-3.5" /> تغيير السعر
            </Button>
            <Button size="sm" variant="outline" className="font-cairo gap-1.5" onClick={() => { setBulkCategory(categoryNames[0] || ''); setBulkCategoryDialog(true); }}>
              <Tag className="w-3.5 h-3.5" /> تغيير الفئة
            </Button>
            <Button size="sm" variant="destructive" className="font-cairo gap-1.5" onClick={() => setBulkDeleteDialog(true)}>
              <Trash2 className="w-3.5 h-3.5" /> حذف
            </Button>
          </div>
          <Button size="sm" variant="ghost" className="font-cairo text-xs" onClick={() => setSelectedIds(new Set())}>
            إلغاء التحديد
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 font-cairo text-muted-foreground">جاري التحميل...</div>
      ) : filteredProducts.length > 0 ? (
        <>
          <div className="bg-card border rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="p-3 text-right">
                    <Checkbox checked={allPageSelected} onCheckedChange={toggleSelectAll} />
                  </th>
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
                {paginatedProducts.map(p => {
                  const mainIdx = p.main_image_index ?? 0;
                  const mainImage = p.images?.[mainIdx] || p.images?.[0];
                  return (
                    <tr key={p.id} className={`hover:bg-muted/30 transition-colors group ${selectedIds.has(p.id) ? 'bg-primary/5' : ''}`}>
                      <td className="p-3">
                        <Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
                      </td>
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
                        <button
                          onClick={() => toggleStatusMutation.mutate({ id: p.id, is_active: !p.is_active })}
                          disabled={toggleStatusMutation.isPending}
                          className={`text-xs px-2.5 py-1 rounded-full font-cairo cursor-pointer transition-all hover:scale-105 active:scale-95 ${p.is_active ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-muted text-muted-foreground hover:bg-muted-foreground/10'}`}
                        >
                          {p.is_active ? 'نشط' : 'معطّل'}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" onClick={() => openEdit(p)} title="تعديل">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary/10 hover:text-secondary" onClick={() => duplicateMutation.mutate(p)} title="نسخ">
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteDialog(p.id)} title="حذف">
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2">
              <span className="font-cairo text-sm text-muted-foreground">
                صفحة {currentPage} من {totalPages} ({filteredProducts.length} منتج)
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                  .map((page, idx, arr) => (
                    <span key={page}>
                      {idx > 0 && arr[idx - 1] !== page - 1 && <span className="px-1 text-muted-foreground">...</span>}
                      <Button
                        variant={page === currentPage ? 'default' : 'outline'}
                        size="icon"
                        className="h-8 w-8 font-roboto text-xs"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    </span>
                  ))}
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
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

      {/* Delete single confirmation */}
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

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-cairo text-center">حذف {selectedIds.size} منتج</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <p className="font-cairo text-muted-foreground">هل أنت متأكد من حذف {selectedIds.size} منتج محدد؟</p>
            <div className="flex gap-2 justify-center pt-2">
              <Button variant="outline" onClick={() => setBulkDeleteDialog(false)} className="font-cairo px-6">إلغاء</Button>
              <Button variant="destructive" onClick={() => bulkDeleteMutation.mutate(Array.from(selectedIds))} disabled={bulkDeleteMutation.isPending} className="font-cairo px-6">
                {bulkDeleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حذف الكل'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Price Dialog */}
      <Dialog open={bulkPriceDialog} onOpenChange={setBulkPriceDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-cairo text-center">تغيير سعر {selectedIds.size} منتج</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="font-cairo">السعر الجديد (دج)</Label>
              <Input type="number" value={bulkPrice} onChange={e => setBulkPrice(e.target.value)} className="font-roboto mt-1.5" placeholder="0" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setBulkPriceDialog(false)} className="font-cairo">إلغاء</Button>
              <Button onClick={() => bulkUpdatePriceMutation.mutate({ ids: Array.from(selectedIds), price: Number(bulkPrice) })} disabled={!bulkPrice || Number(bulkPrice) <= 0 || bulkUpdatePriceMutation.isPending} className="font-cairo gap-1.5">
                {bulkUpdatePriceMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                تطبيق
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Category Dialog */}
      <Dialog open={bulkCategoryDialog} onOpenChange={setBulkCategoryDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-cairo text-center">تغيير فئة {selectedIds.size} منتج</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="font-cairo">الفئة الجديدة</Label>
              <Select value={bulkCategory} onValueChange={setBulkCategory}>
                <SelectTrigger className="font-cairo mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categoryNames.map(c => <SelectItem key={c} value={c} className="font-cairo">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setBulkCategoryDialog(false)} className="font-cairo">إلغاء</Button>
              <Button onClick={() => bulkUpdateCategoryMutation.mutate({ ids: Array.from(selectedIds), category: bulkCategory })} disabled={!bulkCategory || bulkUpdateCategoryMutation.isPending} className="font-cairo gap-1.5">
                {bulkUpdateCategoryMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                تطبيق
              </Button>
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

  // Variations count for display
  const { data: variationsCount } = useQuery({
    queryKey: ['admin-variations-count', product?.id],
    queryFn: async () => {
      if (!product?.id) return 0;
      const { count } = await supabase.from('product_variations').select('*', { count: 'exact', head: true }).eq('product_id', product.id);
      return count || 0;
    },
    enabled: !!product?.id,
  });

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

      let productId = product?.id;

      if (product) {
        const { error } = await supabase.from('products').update(payload).eq('id', product.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('products').insert(payload).select().single();
        if (error) throw error;
        productId = data.id;
      }

      // Save variations
      if (productId) {
        // Delete existing variations not in our list
        const existingIds = variations.filter(v => v.id).map(v => v.id!);
        if (product?.id) {
          await supabase.from('product_variations').delete().eq('product_id', productId).not('id', 'in', `(${existingIds.join(',')})`);
        }

        for (const v of variations) {
          if (!v.variation_type.trim() || !v.variation_value.trim()) continue;
          const varPayload = {
            product_id: productId,
            variation_type: v.variation_type.trim(),
            variation_value: v.variation_value.trim(),
            price_adjustment: Number(v.price_adjustment) || 0,
            stock: Number(v.stock) || 0,
            is_active: v.is_active,
          };
          if (v.id) {
            await supabase.from('product_variations').update(varPayload).eq('id', v.id);
          } else {
            await supabase.from('product_variations').insert(varPayload);
          }
        }
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
    if (oversized) { toast({ title: 'حجم الصورة كبير جداً (الحد الأقصى 5MB)', variant: 'destructive' }); return; }
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
            <p className="font-cairo text-xs text-muted-foreground">انقر على النجمة لاختيار الصورة الرئيسية</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((url, idx) => (
                <div key={idx} className={`relative group rounded-xl overflow-hidden border-2 transition-all ${idx === mainImageIndex ? 'border-primary shadow-md' : 'border-transparent hover:border-muted-foreground/20'}`}>
                  <div className="aspect-square bg-muted">
                    <img src={url} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                  {idx === mainImageIndex && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-cairo px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> رئيسية
                    </div>
                  )}
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

      {/* ─── Variations Section ─── */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-cairo font-semibold text-base flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Tag className="w-4 h-4 text-secondary" />
            </div>
            المتغيرات (ألوان، مقاسات...)
          </h3>
          <Button variant="outline" size="sm" onClick={addVariation} className="font-cairo gap-1.5">
            <Plus className="w-4 h-4" /> إضافة متغير
          </Button>
        </div>

        {variations.length === 0 ? (
          <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl py-8 text-center">
            <Tag className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="font-cairo text-muted-foreground text-sm">لا توجد متغيرات — أضف ألوان أو مقاسات أو أنواع</p>
          </div>
        ) : (
          <div className="space-y-3">
            {variations.map((v, idx) => (
              <div key={idx} className="border rounded-xl p-4 space-y-3 bg-muted/20">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="font-cairo text-xs">النوع (مثل: اللون، المقاس)</Label>
                    <Input
                      value={v.variation_type}
                      onChange={e => updateVariation(idx, 'variation_type', e.target.value)}
                      placeholder="اللون"
                      className="font-cairo mt-1 h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="font-cairo text-xs">القيمة (مثل: أحمر، XL)</Label>
                    <Input
                      value={v.variation_value}
                      onChange={e => updateVariation(idx, 'variation_value', e.target.value)}
                      placeholder="أحمر"
                      className="font-cairo mt-1 h-9 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="font-cairo text-xs">فرق السعر (دج)</Label>
                    <Input
                      type="number"
                      value={v.price_adjustment}
                      onChange={e => updateVariation(idx, 'price_adjustment', e.target.value)}
                      placeholder="0"
                      className="font-roboto mt-1 h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="font-cairo text-xs">المخزون</Label>
                    <Input
                      type="number"
                      value={v.stock}
                      onChange={e => updateVariation(idx, 'stock', e.target.value)}
                      placeholder="0"
                      className="font-roboto mt-1 h-9 text-sm"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeVariation(idx)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
