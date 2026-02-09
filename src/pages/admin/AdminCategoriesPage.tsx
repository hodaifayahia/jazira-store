import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/useCategories';
import { Plus, Trash2, Pencil, Home, Sparkles, Watch, ShoppingBag, Gift, Star, Heart, Shirt, Layers, Check, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const AVAILABLE_ICONS: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: 'Home', label: 'منزل', Icon: Home },
  { value: 'Sparkles', label: 'زينة', Icon: Sparkles },
  { value: 'Watch', label: 'ساعة', Icon: Watch },
  { value: 'ShoppingBag', label: 'حقيبة', Icon: ShoppingBag },
  { value: 'Gift', label: 'هدية', Icon: Gift },
  { value: 'Star', label: 'نجمة', Icon: Star },
  { value: 'Heart', label: 'قلب', Icon: Heart },
  { value: 'Shirt', label: 'ملابس', Icon: Shirt },
];

type Category = { name: string; icon: string };

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: categoriesData } = useCategories();
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('Home');
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('Home');
  const [deleteDialog, setDeleteDialog] = useState<number | null>(null);

  const currentCategories = categories ?? categoriesData ?? [];

  // Sync from server when data arrives
  useEffect(() => {
    if (categoriesData && !categories) {
      // don't override local changes
    }
  }, [categoriesData]);

  const saveMutation = useMutation({
    mutationFn: async (cats: Category[]) => {
      const value = JSON.stringify(cats);
      const { data } = await supabase.from('settings').select('id').eq('key', 'categories').maybeSingle();
      if (data) {
        await supabase.from('settings').update({ value }).eq('key', 'categories');
      } else {
        await supabase.from('settings').insert({ key: 'categories', value });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'تم الحفظ بنجاح ✅' });
    },
    onError: () => {
      toast({ title: 'حدث خطأ أثناء الحفظ', variant: 'destructive' });
    },
  });

  const addCategory = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (currentCategories.some(c => c.name === trimmed)) {
      toast({ title: 'هذه الفئة موجودة بالفعل', variant: 'destructive' });
      return;
    }
    const updated = [...currentCategories, { name: trimmed, icon: newIcon }];
    setCategories(updated);
    saveMutation.mutate(updated);
    setNewName('');
    setNewIcon('Home');
  };

  const removeCategory = (index: number) => {
    const updated = currentCategories.filter((_, i) => i !== index);
    setCategories(updated);
    saveMutation.mutate(updated);
    setDeleteDialog(null);
  };

  const startEdit = (index: number) => {
    setEditIndex(index);
    setEditName(currentCategories[index].name);
    setEditIcon(currentCategories[index].icon);
  };

  const cancelEdit = () => {
    setEditIndex(null);
    setEditName('');
    setEditIcon('Home');
  };

  const saveEdit = () => {
    if (editIndex === null) return;
    const trimmed = editName.trim();
    if (!trimmed) return;
    // Check duplicate (excluding current)
    if (currentCategories.some((c, i) => c.name === trimmed && i !== editIndex)) {
      toast({ title: 'هذه الفئة موجودة بالفعل', variant: 'destructive' });
      return;
    }
    const updated = currentCategories.map((c, i) =>
      i === editIndex ? { name: trimmed, icon: editIcon } : c
    );
    setCategories(updated);
    saveMutation.mutate(updated);
    cancelEdit();
  };

  const SelectedIcon = AVAILABLE_ICONS.find(i => i.value === newIcon)?.Icon || Home;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-cairo font-bold text-2xl text-foreground">إدارة الفئات</h2>
            <p className="font-cairo text-sm text-muted-foreground">أضف، عدّل، أو احذف فئات المنتجات</p>
          </div>
        </div>
        <div className="bg-primary/10 text-primary font-cairo font-bold text-sm px-4 py-2 rounded-full">
          {currentCategories.length} فئة
        </div>
      </div>

      {/* Add new category */}
      <div className="bg-card border rounded-xl p-5 shadow-sm">
        <h3 className="font-cairo font-semibold text-base mb-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Plus className="w-4 h-4 text-primary" />
          </div>
          إضافة فئة جديدة
        </h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Label className="font-cairo text-xs text-muted-foreground">اسم الفئة</Label>
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="مثال: ملابس، أحذية، إلكترونيات..."
              className="font-cairo mt-1.5 h-11"
              onKeyDown={e => e.key === 'Enter' && addCategory()}
            />
          </div>
          <div className="w-40">
            <Label className="font-cairo text-xs text-muted-foreground">الأيقونة</Label>
            <Select value={newIcon} onValueChange={setNewIcon}>
              <SelectTrigger className="mt-1.5 h-11">
                <div className="flex items-center gap-2">
                  <SelectedIcon className="w-4 h-4 text-primary" />
                  <span className="font-cairo text-sm">{AVAILABLE_ICONS.find(i => i.value === newIcon)?.label}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_ICONS.map(ic => (
                  <SelectItem key={ic.value} value={ic.value}>
                    <div className="flex items-center gap-2">
                      <ic.Icon className="w-4 h-4" />
                      <span className="font-cairo">{ic.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addCategory} disabled={saveMutation.isPending || !newName.trim()} className="font-cairo gap-1.5 h-11 px-6">
            <Plus className="w-4 h-4" /> إضافة
          </Button>
        </div>
      </div>

      {/* Categories list */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b bg-muted/30 flex items-center justify-between">
          <h3 className="font-cairo font-semibold text-sm text-muted-foreground">الفئات الحالية</h3>
        </div>
        {currentCategories.length > 0 ? (
          <div className="divide-y">
            {currentCategories.map((cat, index) => {
              const CatIcon = AVAILABLE_ICONS.find(i => i.value === cat.icon)?.Icon || Home;
              const isEditing = editIndex === index;

              if (isEditing) {
                const EditIcon = AVAILABLE_ICONS.find(i => i.value === editIcon)?.Icon || Home;
                return (
                  <div key={index} className="flex items-center gap-3 px-5 py-3 bg-primary/5 border-r-2 border-primary">
                    <span className="font-roboto text-xs text-muted-foreground w-5 text-center">{index + 1}</span>
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <EditIcon className="w-4 h-4 text-primary" />
                    </div>
                    <Input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="font-cairo h-9 flex-1"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                    <Select value={editIcon} onValueChange={setEditIcon}>
                      <SelectTrigger className="w-32 h-9">
                        <div className="flex items-center gap-2">
                          <EditIcon className="w-3.5 h-3.5 text-primary" />
                          <span className="font-cairo text-xs">{AVAILABLE_ICONS.find(i => i.value === editIcon)?.label}</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_ICONS.map(ic => (
                          <SelectItem key={ic.value} value={ic.value}>
                            <div className="flex items-center gap-2">
                              <ic.Icon className="w-4 h-4" />
                              <span className="font-cairo">{ic.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={saveEdit}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted" onClick={cancelEdit}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={index} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className="font-roboto text-xs text-muted-foreground w-5 text-center">{index + 1}</span>
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CatIcon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-cairo font-medium text-foreground">{cat.name}</span>
                    <span className="font-cairo text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {AVAILABLE_ICONS.find(i => i.value === cat.icon)?.label || cat.icon}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={() => startEdit(index)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteDialog(index)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-14">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Layers className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-cairo text-muted-foreground font-medium">لا توجد فئات بعد</p>
            <p className="font-cairo text-muted-foreground/60 text-xs mt-1">أضف فئة جديدة من الأعلى للبدء</p>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialog !== null} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-cairo text-center">حذف الفئة</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <p className="font-cairo text-muted-foreground">
              هل أنت متأكد من حذف فئة{' '}
              <span className="font-bold text-foreground">
                "{deleteDialog !== null ? currentCategories[deleteDialog]?.name : ''}"
              </span>
              ؟
            </p>
            <p className="font-cairo text-xs text-muted-foreground/70">لا يمكن التراجع عن هذا الإجراء</p>
            <div className="flex gap-2 justify-center pt-2">
              <Button variant="outline" onClick={() => setDeleteDialog(null)} className="font-cairo px-6">
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteDialog !== null && removeCategory(deleteDialog)}
                disabled={saveMutation.isPending}
                className="font-cairo px-6"
              >
                حذف
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
