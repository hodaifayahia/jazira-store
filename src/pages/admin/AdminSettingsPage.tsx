import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Upload, X } from 'lucide-react';

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
        await supabase.from('settings').upsert({ key: entry.key, value: entry.value }, { onConflict: 'key' });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      toast({ title: 'تم حفظ الإعدادات بنجاح ✅' });
      setForm({});
    },
  });

  const handleSave = () => {
    const entries = Object.entries(form).map(([key, value]) => ({ key, value }));
    if (entries.length > 0) updateSetting.mutate(entries);
  };

  const setField = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

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

  if (isLoading) return null;

  const logoUrl = mergedSettings.store_logo_url;

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

      {/* Store Settings */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="font-cairo font-bold text-xl">إعدادات المتجر</h2>
        <div><Label className="font-cairo">اسم المتجر</Label><Input value={mergedSettings.store_name || ''} onChange={e => setField('store_name', e.target.value)} className="font-cairo mt-1" /></div>
        
        {/* Logo upload */}
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

        <div><Label className="font-cairo">رابط صفحة فيسبوك</Label><Input value={mergedSettings.facebook_url || ''} onChange={e => setField('facebook_url', e.target.value)} className="font-roboto mt-1" dir="ltr" /></div>
      </div>

      <Button onClick={handleSave} disabled={updateSetting.isPending || Object.keys(form).length === 0} className="font-cairo font-semibold gap-2">
        {updateSetting.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {updateSetting.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
      </Button>
    </div>
  );
}
