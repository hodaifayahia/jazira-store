import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Upload, X } from 'lucide-react';
import { SettingsSkeleton } from '@/components/LoadingSkeleton';

const DEFAULTS: Record<string, string> = {
  ccp_number: '002670098836',
  ccp_name: '',
  baridimob_enabled: 'true',
  flexy_number: '0657761559',
  flexy_deposit_amount: '500',
  flexy_enabled: 'true',
  store_name: 'DZ Store',
  store_logo_url: '',
  facebook_url: '',
};

const ALL_KEYS = Object.keys(DEFAULTS);

export default function AdminSettingsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      const map: Record<string, string> = { ...DEFAULTS };
      data?.forEach(s => { map[s.key] = s.value || DEFAULTS[s.key] || ''; });
      return map;
    },
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const merged = { ...settings, ...form };

  const updateSetting = useMutation({
    mutationFn: async (entries: { key: string; value: string }[]) => {
      for (const entry of entries) {
        const { error } = await supabase.from('settings').upsert({ key: entry.key, value: entry.value }, { onConflict: 'key' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      toast({ title: 'تم حفظ الإعدادات بنجاح ✅' });
      setForm({});
    },
    onError: () => {
      toast({ title: 'حدث خطأ أثناء حفظ الإعدادات، يرجى المحاولة مرة أخرى', variant: 'destructive' });
    },
  });

  const setField = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleSave = () => {
    // Validation
    const ccpNum = merged.ccp_number?.trim();
    const flexyNum = merged.flexy_number?.trim();
    const flexyAmount = merged.flexy_deposit_amount?.trim();
    const fbUrl = merged.facebook_url?.trim();

    if (!ccpNum) {
      toast({ title: 'رقم CCP مطلوب', variant: 'destructive' });
      return;
    }
    if (!flexyNum) {
      toast({ title: 'رقم فليكسي مطلوب', variant: 'destructive' });
      return;
    }
    if (!flexyAmount || isNaN(Number(flexyAmount)) || Number(flexyAmount) <= 0) {
      toast({ title: 'مبلغ العربون يجب أن يكون رقماً موجباً', variant: 'destructive' });
      return;
    }
    if (fbUrl && !/^https?:\/\/.+/.test(fbUrl)) {
      toast({ title: 'رابط فيسبوك غير صالح', variant: 'destructive' });
      return;
    }

    // Build entries for all keys to ensure they exist
    const entries = ALL_KEYS.map(key => ({ key, value: merged[key] || DEFAULTS[key] || '' }));
    updateSetting.mutate(entries);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('store').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('store').getPublicUrl(path);
      setField('store_logo_url', urlData.publicUrl);
      toast({ title: 'تم رفع الشعار' });
    } catch {
      toast({ title: 'فشل رفع الشعار', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (isLoading) return <SettingsSkeleton />;

  const logoUrl = merged.store_logo_url;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Baridimob */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="font-cairo font-bold text-xl">إعدادات بريدي موب</h2>
        <div>
          <Label className="font-cairo">رقم CCP</Label>
          <Input value={merged.ccp_number || ''} onChange={e => setField('ccp_number', e.target.value)} className="font-roboto mt-1" dir="ltr" placeholder="002670098836" />
        </div>
        <div>
          <Label className="font-cairo">الاسم على الحساب</Label>
          <Input value={merged.ccp_name || ''} onChange={e => setField('ccp_name', e.target.value)} className="font-cairo mt-1" placeholder="اسم صاحب الحساب" />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={merged.baridimob_enabled === 'true'} onCheckedChange={v => setField('baridimob_enabled', String(v))} />
          <Label className="font-cairo">تفعيل بريدي موب</Label>
        </div>
        <p className="text-xs text-muted-foreground font-cairo">يتم عرض هذه البيانات في صفحة الدفع.</p>
      </div>

      {/* Flexy */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="font-cairo font-bold text-xl">إعدادات فليكسي</h2>
        <div>
          <Label className="font-cairo">رقم فليكسي</Label>
          <Input value={merged.flexy_number || ''} onChange={e => setField('flexy_number', e.target.value)} className="font-roboto mt-1" dir="ltr" placeholder="0657761559" />
        </div>
        <div>
          <Label className="font-cairo">مبلغ العربون (دج)</Label>
          <Input type="number" value={merged.flexy_deposit_amount || ''} onChange={e => setField('flexy_deposit_amount', e.target.value)} className="font-roboto mt-1" placeholder="500" min="1" />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={merged.flexy_enabled === 'true'} onCheckedChange={v => setField('flexy_enabled', String(v))} />
          <Label className="font-cairo">تفعيل فليكسي</Label>
        </div>
        <p className="text-xs text-muted-foreground font-cairo">سيتم حساب المبلغ المتبقي تلقائياً في صفحة الدفع.</p>
      </div>

      {/* Store Settings */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="font-cairo font-bold text-xl">إعدادات المتجر</h2>
        <div>
          <Label className="font-cairo">اسم المتجر</Label>
          <Input value={merged.store_name || ''} onChange={e => setField('store_name', e.target.value)} className="font-cairo mt-1" placeholder="DZ Store" />
        </div>

        {/* Logo */}
        <div>
          <Label className="font-cairo mb-2 block">شعار المتجر</Label>
          {logoUrl && (
            <div className="relative inline-block mb-2">
              <img src={logoUrl} alt="شعار المتجر" className="h-20 w-20 object-contain rounded border bg-muted p-1" />
              <button onClick={() => setField('store_logo_url', '')} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <Button type="button" variant="outline" size="sm" className="font-cairo gap-1" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'جاري الرفع...' : 'رفع شعار'}
            </Button>
          </div>
        </div>

        <div>
          <Label className="font-cairo">رابط صفحة فيسبوك</Label>
          <Input value={merged.facebook_url || ''} onChange={e => setField('facebook_url', e.target.value)} className="font-roboto mt-1" dir="ltr" placeholder="https://facebook.com/..." />
        </div>
      </div>

      <Button onClick={handleSave} disabled={updateSetting.isPending} className="font-cairo font-semibold gap-2">
        {updateSetting.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {updateSetting.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
      </Button>
    </div>
  );
}
