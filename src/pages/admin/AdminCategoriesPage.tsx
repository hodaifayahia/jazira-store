import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/useCategories';
import { Plus, Trash2, Home, Sparkles, Watch, ShoppingBag, Gift, Star, Heart, Shirt } from 'lucide-react';
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

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: categoriesData } = useCategories();
  const [categories, setCategories] = useState<{ name: string; icon: string }[] | null>(null);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('Home');

  // Use local state if user has made changes, otherwise use fetched data
  const currentCategories = categories ?? categoriesData ?? [];

  const saveMutation = useMutation({
    mutationFn: async (cats: { name: string; icon: string }[]) => {
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
      toast({ title: 'تم حفظ الفئات' });
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
  };

  const removeCategory = (name: string) => {
    const updated = currentCategories.filter(c => c.name !== name);
    setCategories(updated);
    saveMutation.mutate(updated);
  };

  const SelectedIcon = AVAILABLE_ICONS.find(i => i.value === newIcon)?.Icon || Home;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-cairo font-bold text-2xl text-foreground">إدارة الفئات</h2>
          <p className="font-cairo text-sm text-muted-foreground mt-1">أضف وأدر فئات المنتجات التي تظهر في المتجر</p>
        </div>
        <div className="bg-primary/10 text-primary font-cairo font-bold text-sm px-3 py-1.5 rounded-full">
          {currentCategories.length} فئة
        </div>
      </div>

      {/* Add new category - top for quick access */}
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
          <Button onClick={addCategory} disabled={saveMutation.isPending || !newName.trim()} className="font-cairo gap-1.5 h-11 px-5">
            <Plus className="w-4 h-4" /> إضافة
          </Button>
        </div>
      </div>

      {/* Categories list */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b bg-muted/30">
          <h3 className="font-cairo font-semibold text-sm text-muted-foreground">الفئات الحالية</h3>
        </div>
        {currentCategories.length > 0 ? (
          <div className="divide-y">
            {currentCategories.map((cat, index) => {
              const CatIcon = AVAILABLE_ICONS.find(i => i.value === cat.icon)?.Icon || Home;
              return (
                <div key={cat.name} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className="font-roboto text-xs text-muted-foreground w-5 text-center">{index + 1}</span>
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CatIcon className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <span className="font-cairo font-medium text-foreground">{cat.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeCategory(cat.name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-cairo text-muted-foreground text-sm">لا توجد فئات بعد</p>
            <p className="font-cairo text-muted-foreground/60 text-xs mt-1">أضف فئة جديدة من الأعلى</p>
          </div>
        )}
      </div>
    </div>
  );
}
