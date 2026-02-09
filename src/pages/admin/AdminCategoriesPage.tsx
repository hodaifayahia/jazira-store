import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCategories, Category } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, Layers, Save, X } from 'lucide-react';
import { icons } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

const ICON_OPTIONS = [
  'Home', 'Sparkles', 'Watch', 'ShoppingBag', 'Shirt', 'Laptop', 'Utensils',
  'Gift', 'Heart', 'Star', 'Grid3X3', 'Package', 'Headphones', 'Camera',
  'BookOpen', 'Palette', 'Gem', 'Flower2', 'Baby', 'Car', 'Dumbbell',
  'Gamepad2', 'Smartphone', 'Sofa', 'Lamp', 'CookingPot',
];

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: categories, isLoading } = useCategories();

  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState<Category>({ name: '', icon: 'Home' });
  const [isAdding, setIsAdding] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const saveMutation = useMutation({
    mutationFn: async (newCategories: Category[]) => {
      const value = JSON.stringify(newCategories);
      // Upsert: check if key exists
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('key', 'categories')
        .maybeSingle();
      if (existing) {
        const { error } = await supabase.from('settings').update({ value }).eq('key', 'categories');
        if (error) throw error;
      } else {
        const { error } = await supabase.from('settings').insert({ key: 'categories', value });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories-settings'] });
      toast({ title: 'تم حفظ التصنيفات ✅' });
    },
    onError: () => toast({ title: 'خطأ', description: 'حدث خطأ أثناء الحفظ', variant: 'destructive' }),
  });

  const handleAdd = () => {
    if (!form.name.trim()) return;
    const updated = [...(categories || []), { name: form.name.trim(), icon: form.icon }];
    saveMutation.mutate(updated);
    setForm({ name: '', icon: 'Home' });
    setIsAdding(false);
  };

  const handleEdit = () => {
    if (editIndex === null || !categories || !form.name.trim()) return;
    const updated = categories.map((c, i) => i === editIndex ? { name: form.name.trim(), icon: form.icon } : c);
    saveMutation.mutate(updated);
    setEditIndex(null);
    setForm({ name: '', icon: 'Home' });
  };

  const handleDelete = () => {
    if (deleteIndex === null || !categories) return;
    const updated = categories.filter((_, i) => i !== deleteIndex);
    saveMutation.mutate(updated);
    setDeleteIndex(null);
  };

  const startEdit = (index: number) => {
    if (!categories) return;
    setEditIndex(index);
    setForm(categories[index]);
    setIsAdding(false);
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditIndex(null);
    setForm({ name: '', icon: 'Home' });
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditIndex(null);
    setForm({ name: '', icon: 'Home' });
  };

  const renderIcon = (iconName: string, size = 'w-5 h-5') => {
    const IconComponent = (icons as any)[iconName];
    return IconComponent ? <IconComponent className={size} /> : <Layers className={size} />;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-cairo font-bold text-xl">التصنيفات ({categories?.length ?? 0})</h2>
        <Button onClick={startAdd} className="font-cairo gap-1" disabled={isAdding}>
          <Plus className="w-4 h-4" /> إضافة تصنيف
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : (
        <div className="bg-card border rounded-lg divide-y">
          {categories && categories.length > 0 ? categories.map((cat, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {renderIcon(cat.icon)}
              </div>
              {editIndex === i ? (
                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="font-cairo flex-1" placeholder="اسم التصنيف" />
                  <Select value={form.icon} onValueChange={v => setForm(f => ({ ...f, icon: v }))}>
                    <SelectTrigger className="w-full sm:w-40">
                      <div className="flex items-center gap-2">{renderIcon(form.icon, 'w-4 h-4')} <span className="text-xs">{form.icon}</span></div>
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {ICON_OPTIONS.map(ico => (
                        <SelectItem key={ico} value={ico}>
                          <div className="flex items-center gap-2">{renderIcon(ico, 'w-4 h-4')} <span className="text-xs">{ico}</span></div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1">
                    <Button size="sm" onClick={handleEdit} disabled={saveMutation.isPending} className="font-cairo gap-1">
                      {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} حفظ
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelForm}><X className="w-3 h-3" /></Button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="font-cairo font-semibold text-foreground flex-1">{cat.name}</span>
                  <span className="text-xs text-muted-foreground font-mono hidden sm:block">{cat.icon}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(i)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteIndex(i)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </>
              )}
            </div>
          )) : (
            <div className="p-8 text-center font-cairo text-muted-foreground">
              <Layers className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
              لا توجد تصنيفات بعد
            </div>
          )}

          {/* Add form */}
          {isAdding && (
            <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-muted/30">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {renderIcon(form.icon)}
              </div>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="font-cairo flex-1" placeholder="اسم التصنيف الجديد" />
              <Select value={form.icon} onValueChange={v => setForm(f => ({ ...f, icon: v }))}>
                <SelectTrigger className="w-full sm:w-40">
                  <div className="flex items-center gap-2">{renderIcon(form.icon, 'w-4 h-4')} <span className="text-xs">{form.icon}</span></div>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {ICON_OPTIONS.map(ico => (
                    <SelectItem key={ico} value={ico}>
                      <div className="flex items-center gap-2">{renderIcon(ico, 'w-4 h-4')} <span className="text-xs">{ico}</span></div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-1">
                <Button size="sm" onClick={handleAdd} disabled={saveMutation.isPending || !form.name.trim()} className="font-cairo gap-1">
                  {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} إضافة
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelForm}><X className="w-3 h-3" /></Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteIndex !== null} onOpenChange={v => { if (!v) setDeleteIndex(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-cairo">حذف التصنيف</AlertDialogTitle>
            <AlertDialogDescription className="font-cairo">
              هل أنت متأكد من حذف هذا التصنيف؟ المنتجات المرتبطة بهذا التصنيف لن تتأثر.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-cairo">إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground font-cairo" onClick={handleDelete}>
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
