import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Save, Upload, X, ImageIcon } from 'lucide-react';

export default function AdminSettingsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

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
  const [uploading, setUploading] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const mergedSettings = { ...settings, ...form };

  const updateSetting = useMutation({
    mutationFn: async (entries: { key: string; value: string }[]) => {
      for (const entry of entries) {
        const { data } = await supabase.from('settings').update({ value: entry.value }).eq('key', entry.key).select();
        if (!data || data.length === 0) {
          await supabase.from('settings').insert({ key: entry.key, value: entry.value });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      qc.invalidateQueries({ queryKey: ['store-logo'] });
      toast({ title: 'تم حفظ الإعدادات' });
      setForm({});
    },
  });

  const handleSave = () => {
    const entries = Object.entries(form).map(([key, value]) => ({ key, value }));
    if (entries.length > 0) updateSetting.mutate(entries);
  };

  const setField = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    settingKey: string,
    setLoadingFn: (v: boolean) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'حجم الملف كبير جداً (الحد الأقصى 2MB)', variant: 'destructive' });
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast({ title: 'يرجى اختيار ملف صورة', variant: 'destructive' });
      return;
    }

    setLoadingFn(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${settingKey}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('store').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('store').getPublicUrl(path);
      const url = urlData.publicUrl;

      const { data } = await supabase.from('settings').update({ value: url }).eq('key', settingKey).select();
      if (!data || data.length === 0) {
        await supabase.from('settings').insert({ key: settingKey, value: url });
      }
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      qc.invalidateQueries({ queryKey: ['store-logo'] });
      toast({ title: 'تم رفع الصورة بنجاح ✅' });
    } catch {
      toast({ title: 'فشل رفع الصورة', variant: 'destructive' });
    } finally {
      setLoadingFn(false);
    }
  };

  const removeImage = async (settingKey: string) => {
    const { data } = await supabase.from('settings').update({ value: '' }).eq('key', settingKey).select();
    if (!data || data.length === 0) {
      await supabase.from('settings').insert({ key: settingKey, value: '' });
    }
    qc.invalidateQueries({ queryKey: ['admin-settings'] });
    qc.invalidateQueries({ queryKey: ['store-logo'] });
    toast({ title: 'تم حذف الصورة' });
  };

  if (isLoading) return null;

  const currentLogo = mergedSettings.store_logo;
  const currentHero = mergedSettings.hero_banner;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Store Logo */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="font-cairo font-bold text-xl">شعار المتجر</h2>
        <p className="font-cairo text-sm text-muted-foreground">يظهر في رأس الصفحة، التذييل، والأيقونة المفضلة</p>
        <div className="flex items-center gap-4">
          {currentLogo ? (
            <div className="relative group">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-primary/30 overflow-hidden bg-muted flex items-center justify-center">
                <img src={currentLogo} alt="شعار المتجر" className="w-full h-full object-contain p-1" />
              </div>
              <button onClick={() => removeImage('store_logo')} className="absolute -top-2 -left-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/50">
              <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
            </div>
          )}
          <div className="space-y-2">
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'store_logo', setUploading)} />
            <Button variant="outline" onClick={() => logoInputRef.current?.click()} disabled={uploading} className="font-cairo gap-2">
              <Upload className="w-4 h-4" />
              {uploading ? 'جاري الرفع...' : currentLogo ? 'تغيير الشعار' : 'رفع شعار'}
            </Button>
            <p className="font-cairo text-xs text-muted-foreground">PNG, JPG أو SVG — الحد الأقصى 2MB</p>
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="font-cairo font-bold text-xl">صورة الصفحة الرئيسية</h2>
        <p className="font-cairo text-sm text-muted-foreground">الصورة الخلفية التي تظهر في البانر الرئيسي للصفحة الأولى</p>
        <div className="flex items-center gap-4">
          {currentHero ? (
            <div className="relative group">
              <div className="w-32 h-20 rounded-xl border-2 border-dashed border-primary/30 overflow-hidden bg-muted">
                <img src={currentHero} alt="صورة البانر" className="w-full h-full object-cover" />
              </div>
              <button onClick={() => removeImage('hero_banner')} className="absolute -top-2 -left-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="w-32 h-20 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/50">
              <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
            </div>
          )}
          <div className="space-y-2">
            <input ref={heroInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'hero_banner', setHeroUploading)} />
            <Button variant="outline" onClick={() => heroInputRef.current?.click()} disabled={heroUploading} className="font-cairo gap-2">
              <Upload className="w-4 h-4" />
              {heroUploading ? 'جاري الرفع...' : currentHero ? 'تغيير الصورة' : 'رفع صورة'}
            </Button>
            <p className="font-cairo text-xs text-muted-foreground">يُنصح بحجم 1920×800 بيكسل</p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="font-cairo font-bold text-xl">معلومات التذييل</h2>
        <p className="font-cairo text-sm text-muted-foreground">المعلومات التي تظهر في أسفل كل صفحة</p>
        <div>
          <Label className="font-cairo">وصف المتجر</Label>
          <Textarea value={mergedSettings.footer_description || ''} onChange={e => setField('footer_description', e.target.value)} className="font-cairo mt-1" placeholder="وصف قصير للمتجر..." />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="font-cairo">رقم الهاتف</Label>
            <Input value={mergedSettings.footer_phone || ''} onChange={e => setField('footer_phone', e.target.value)} className="font-roboto mt-1" dir="ltr" placeholder="0555 000 000" />
          </div>
          <div>
            <Label className="font-cairo">البريد الإلكتروني</Label>
            <Input value={mergedSettings.footer_email || ''} onChange={e => setField('footer_email', e.target.value)} className="font-roboto mt-1" dir="ltr" placeholder="info@store.com" />
          </div>
        </div>
        <div>
          <Label className="font-cairo">العنوان</Label>
          <Input value={mergedSettings.footer_address || ''} onChange={e => setField('footer_address', e.target.value)} className="font-cairo mt-1" placeholder="الجزائر العاصمة، الجزائر" />
        </div>
      </div>

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
