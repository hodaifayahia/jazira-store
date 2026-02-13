import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, RotateCcw, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminReturnsSettingsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: returnSettings, isLoading: loadingSettings } = useQuery({
    queryKey: ['return-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('return_settings').select('*').limit(1).single();
      return data;
    },
  });

  const { data: reasons } = useQuery({
    queryKey: ['return-reasons-admin'],
    queryFn: async () => {
      const { data } = await supabase.from('return_reasons').select('*').order('position');
      return data || [];
    },
  });

  const [settingsForm, setSettingsForm] = useState<Record<string, any>>({});
  const [newReason, setNewReason] = useState({ label_ar: '', fault_type: 'customer_fault', requires_photos: true });
  const [editingReason, setEditingReason] = useState<any>(null);

  const merged = { ...returnSettings, ...settingsForm };
  const setField = (key: string, value: any) => setSettingsForm(f => ({ ...f, [key]: value }));

  const saveSettings = useMutation({
    mutationFn: async () => {
      if (!returnSettings?.id) return;
      const { error } = await supabase.from('return_settings').update({
        ...settingsForm,
        updated_at: new Date().toISOString(),
      }).eq('id', returnSettings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['return-settings'] });
      toast({ title: 'تم حفظ إعدادات الاسترجاع ✅' });
      setSettingsForm({});
    },
  });

  const addReason = useMutation({
    mutationFn: async () => {
      if (!newReason.label_ar.trim()) return;
      const maxPos = reasons?.length ? Math.max(...reasons.map(r => r.position)) + 1 : 0;
      const { error } = await supabase.from('return_reasons').insert({ ...newReason, position: maxPos });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['return-reasons-admin'] });
      setNewReason({ label_ar: '', fault_type: 'customer_fault', requires_photos: true });
      toast({ title: 'تمت إضافة السبب ✅' });
    },
  });

  const updateReason = useMutation({
    mutationFn: async (reason: any) => {
      const { error } = await supabase.from('return_reasons').update({
        label_ar: reason.label_ar, fault_type: reason.fault_type,
        requires_photos: reason.requires_photos, is_active: reason.is_active,
      }).eq('id', reason.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['return-reasons-admin'] });
      setEditingReason(null);
      toast({ title: 'تم تحديث السبب ✅' });
    },
  });

  const deleteReason = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('return_reasons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['return-reasons-admin'] });
      toast({ title: 'تم حذف السبب' });
    },
  });

  if (loadingSettings) return <div className="font-cairo text-muted-foreground p-4">جاري التحميل...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-primary" />
          <h2 className="font-cairo font-bold text-xl">إعدادات الاسترجاع</h2>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={merged.is_returns_enabled ?? true} onCheckedChange={v => setField('is_returns_enabled', v)} />
          <Label className="font-cairo font-semibold">تفعيل نظام الاسترجاع</Label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="font-cairo">مهلة الاسترجاع (أيام)</Label>
            <Input type="number" min={0} max={365} value={merged.return_window_days ?? 7} onChange={e => setField('return_window_days', parseInt(e.target.value) || 0)} className="font-roboto mt-1 w-32" />
          </div>
          <div>
            <Label className="font-cairo">الحد الأقصى للصور</Label>
            <Input type="number" min={1} max={20} value={merged.max_photos_per_return ?? 5} onChange={e => setField('max_photos_per_return', parseInt(e.target.value) || 1)} className="font-roboto mt-1 w-32" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Switch checked={merged.allow_refund ?? true} onCheckedChange={v => setField('allow_refund', v)} />
            <Label className="font-cairo">السماح بالاسترجاع النقدي</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={merged.allow_exchange ?? true} onCheckedChange={v => setField('allow_exchange', v)} />
            <Label className="font-cairo">السماح بالاستبدال</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={merged.allow_store_credit ?? true} onCheckedChange={v => setField('allow_store_credit', v)} />
            <Label className="font-cairo">السماح برصيد المتجر</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={merged.auto_approve_returns ?? false} onCheckedChange={v => setField('auto_approve_returns', v)} />
            <Label className="font-cairo">موافقة تلقائية على الطلبات</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={merged.require_return_photos ?? true} onCheckedChange={v => setField('require_return_photos', v)} />
            <Label className="font-cairo">إلزام العميل بإرفاق صور</Label>
          </div>
        </div>
        <div>
          <Label className="font-cairo">نص سياسة الاسترجاع</Label>
          <Textarea value={merged.return_policy_text || ''} onChange={e => setField('return_policy_text', e.target.value)} className="font-cairo mt-1" placeholder="سياسة الاسترجاع الخاصة بمتجرك..." rows={4} />
        </div>
        <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending || Object.keys(settingsForm).length === 0} className="font-cairo gap-2">
          <Save className="w-4 h-4" />
          {saveSettings.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </Button>
      </div>

      {/* Return Reasons Manager */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="font-cairo font-bold text-xl">أسباب الاسترجاع</h2>
        <div className="space-y-2">
          {reasons?.map(reason => (
            <div key={reason.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              {editingReason?.id === reason.id ? (
                <div className="flex-1 space-y-2">
                  <Input value={editingReason.label_ar} onChange={e => setEditingReason({ ...editingReason, label_ar: e.target.value })} className="font-cairo" />
                  <div className="flex gap-2">
                    <Select value={editingReason.fault_type} onValueChange={v => setEditingReason({ ...editingReason, fault_type: v })}>
                      <SelectTrigger className="font-cairo w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="merchant_fault" className="font-cairo">خطأ التاجر</SelectItem>
                        <SelectItem value="customer_fault" className="font-cairo">خطأ العميل</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => updateReason.mutate(editingReason)} className="font-cairo">حفظ</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingReason(null)} className="font-cairo">إلغاء</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="font-cairo font-semibold text-sm">{reason.label_ar}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={reason.fault_type === 'merchant_fault' ? 'destructive' : 'secondary'} className="font-cairo text-xs">
                        {reason.fault_type === 'merchant_fault' ? 'خطأ التاجر' : 'خطأ العميل'}
                      </Badge>
                      {!reason.is_active && <Badge variant="outline" className="font-cairo text-xs">معطّل</Badge>}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setEditingReason({ ...reason })} className="font-cairo text-xs">تعديل</Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteReason.mutate(reason.id)} className="text-destructive hover:text-destructive font-cairo text-xs">حذف</Button>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="border-t pt-4 space-y-3">
          <h3 className="font-cairo font-semibold text-sm">إضافة سبب جديد</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input value={newReason.label_ar} onChange={e => setNewReason({ ...newReason, label_ar: e.target.value })} className="font-cairo flex-1" placeholder="اسم السبب بالعربية..." />
            <Select value={newReason.fault_type} onValueChange={v => setNewReason({ ...newReason, fault_type: v })}>
              <SelectTrigger className="font-cairo w-full sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="merchant_fault" className="font-cairo">خطأ التاجر</SelectItem>
                <SelectItem value="customer_fault" className="font-cairo">خطأ العميل</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => addReason.mutate()} disabled={!newReason.label_ar.trim()} className="font-cairo gap-1">
              <Plus className="w-4 h-4" /> إضافة
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
