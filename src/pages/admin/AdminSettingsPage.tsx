import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save, Plus, Trash2, Home, Sparkles, Watch, ShoppingBag, Gift, Star, Heart, Shirt } from 'lucide-react';
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

export default function AdminSettingsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('*');
      const map: Record<string, string> = {};
      data?.forEach(s => { map[s.key] = s.value || ''; });
      return map;
    },
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const mergedSettings = { ...settings, ...form };

  const updateSetting = useMutation({
    mutationFn: async (entries: { key: string; value: string }[]) => {
      for (const entry of entries) {
        await supabase.from('settings').update({ value: entry.value }).eq('key', entry.key);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      toast({ title: 'تم حفظ الإعدادات' });
      setForm({});
    },
  });

  const handleSave = () => {
    const entries = Object.entries(form).map(([key, value]) => ({ key, value }));
    if (entries.length > 0) updateSetting.mutate(entries);
  };

  const setField = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  if (isLoading) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Payment Settings */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="font-cairo font-bold text-xl">إعدادات الدفع</h2>
        
        <div className="space-y-4 border-b pb-4">
          <h3 className="font-cairo font-semibold">بريدي موب</h3>
          <div className="flex items-center gap-2">
            <Switch checked={mergedSettings.baridimob_enabled === 'true'} onCheckedChange={v => setField('baridimob_enabled', String(v))} />
            <Label className="font-cairo">مفعّل</Label>
          </div>
          <div><Label className="font-cairo">رقم الحساب CCP</Label><Input value={mergedSettings.ccp_number || ''} onChange={e => setField('ccp_number', e.target.value)} className="font-roboto mt-1" dir="ltr" /></div>
          <div><Label className="font-cairo">اسم صاحب الحساب</Label><Input value={mergedSettings.ccp_name || ''} onChange={e => setField('ccp_name', e.target.value)} className="font-cairo mt-1" /></div>
        </div>

        <div className="space-y-4">
          <h3 className="font-cairo font-semibold">فليكسي</h3>
          <div className="flex items-center gap-2">
            <Switch checked={mergedSettings.flexy_enabled === 'true'} onCheckedChange={v => setField('flexy_enabled', String(v))} />
            <Label className="font-cairo">مفعّل</Label>
          </div>
          <div><Label className="font-cairo">رقم الهاتف</Label><Input value={mergedSettings.flexy_number || ''} onChange={e => setField('flexy_number', e.target.value)} className="font-roboto mt-1" dir="ltr" /></div>
          <div><Label className="font-cairo">مبلغ التعبئة (دج)</Label><Input type="number" value={mergedSettings.flexy_deposit_amount || ''} onChange={e => setField('flexy_deposit_amount', e.target.value)} className="font-roboto mt-1" /></div>
        </div>
      </div>

      {/* Categories Management */}
      <CategoriesSection settings={settings || {}} />

      {/* Store Settings */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="font-cairo font-bold text-xl">إعدادات المتجر</h2>
        <div><Label className="font-cairo">اسم المتجر</Label><Input value={mergedSettings.store_name || ''} onChange={e => setField('store_name', e.target.value)} className="font-cairo mt-1" /></div>
        <div><Label className="font-cairo">رابط صفحة فيسبوك</Label><Input value={mergedSettings.facebook_url || ''} onChange={e => setField('facebook_url', e.target.value)} className="font-roboto mt-1" dir="ltr" /></div>
      </div>

      <Button onClick={handleSave} disabled={updateSetting.isPending || Object.keys(form).length === 0} className="font-cairo font-semibold gap-2">
        <Save className="w-4 h-4" />
        {updateSetting.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
      </Button>
    </div>
  );
}

function CategoriesSection({ settings }: { settings: Record<string, string> }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const existing: { name: string; icon: string }[] = settings.categories ? JSON.parse(settings.categories) : [];
  const [categories, setCategories] = useState(existing);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('Home');

  const saveMutation = useMutation({
    mutationFn: async (cats: { name: string; icon: string }[]) => {
      const value = JSON.stringify(cats);
      // upsert: update if exists, insert if not
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
    if (categories.some(c => c.name === trimmed)) {
      toast({ title: 'هذه الفئة موجودة بالفعل', variant: 'destructive' });
      return;
    }
    const updated = [...categories, { name: trimmed, icon: newIcon }];
    setCategories(updated);
    saveMutation.mutate(updated);
    setNewName('');
  };

  const removeCategory = (name: string) => {
    const updated = categories.filter(c => c.name !== name);
    setCategories(updated);
    saveMutation.mutate(updated);
  };

  const SelectedIcon = AVAILABLE_ICONS.find(i => i.value === newIcon)?.Icon || Home;

  return (
    <div className="bg-card border rounded-lg p-6 space-y-4">
      <h2 className="font-cairo font-bold text-xl">إدارة الفئات</h2>
      
      {/* Existing categories */}
      <div className="space-y-2">
        {categories.map(cat => {
          const CatIcon = AVAILABLE_ICONS.find(i => i.value === cat.icon)?.Icon || Home;
          return (
            <div key={cat.name} className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2">
              <div className="flex items-center gap-3">
                <CatIcon className="w-5 h-5 text-muted-foreground" />
                <span className="font-cairo font-medium">{cat.name}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeCategory(cat.name)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
        {categories.length === 0 && (
          <p className="font-cairo text-muted-foreground text-sm">لا توجد فئات. أضف فئة جديدة.</p>
        )}
      </div>

      {/* Add new category */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Label className="font-cairo">اسم الفئة</Label>
          <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="مثال: ملابس" className="font-cairo mt-1" onKeyDown={e => e.key === 'Enter' && addCategory()} />
        </div>
        <div className="w-32">
          <Label className="font-cairo">الأيقونة</Label>
          <Select value={newIcon} onValueChange={setNewIcon}>
            <SelectTrigger className="mt-1">
              <div className="flex items-center gap-2">
                <SelectedIcon className="w-4 h-4" />
                <SelectValue />
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
        <Button onClick={addCategory} disabled={saveMutation.isPending} className="font-cairo gap-1">
          <Plus className="w-4 h-4" /> إضافة
        </Button>
      </div>
    </div>
  );
}
