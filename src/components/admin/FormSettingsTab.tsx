import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Lock } from 'lucide-react';

export type FieldConfig = { visible: boolean; required: boolean; locked?: boolean };
export type CheckoutFormConfig = Record<string, FieldConfig>;

const DEFAULT_CONFIG: CheckoutFormConfig = {
  name: { visible: true, required: true },
  phone: { visible: true, required: true, locked: true },
  wilaya: { visible: true, required: true },
  baladiya: { visible: true, required: false },
  delivery_type: { visible: true, required: true },
  address: { visible: true, required: false },
  coupon: { visible: true, required: false },
  payment_receipt: { visible: true, required: false },
};

const FIELD_LABELS: Record<string, string> = {
  name: 'الاسم الكامل',
  phone: 'رقم الهاتف',
  wilaya: 'الولاية',
  baladiya: 'البلدية',
  delivery_type: 'نوع التوصيل',
  address: 'العنوان التفصيلي',
  coupon: 'كود الخصم',
  payment_receipt: 'إيصال الدفع',
};

export function parseFormConfig(raw: string | undefined): CheckoutFormConfig {
  try {
    const parsed = JSON.parse(raw || '{}');
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
}

interface Props {
  currentValue: string | undefined;
  onUpdate: (value: string) => void;
  onSave: () => void;
  saving: boolean;
  hasChanges: boolean;
}

export default function FormSettingsTab({ currentValue, onUpdate, onSave, saving, hasChanges }: Props) {
  const config = parseFormConfig(currentValue);

  const toggleField = (field: string, prop: 'visible' | 'required', value: boolean) => {
    const updated = { ...config };
    updated[field] = { ...updated[field], [prop]: value };
    // If hiding a field, unset required
    if (prop === 'visible' && !value) {
      updated[field].required = false;
    }
    onUpdate(JSON.stringify(updated));
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="font-cairo font-bold text-xl">إعدادات حقول الطلب</h2>
        <p className="font-cairo text-sm text-muted-foreground">
          تحكم في الحقول التي تظهر في صفحة إتمام الطلب وأيها إلزامي
        </p>

        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-[1fr_80px_80px] gap-2 px-3 py-2 text-xs font-cairo font-semibold text-muted-foreground">
            <span>الحقل</span>
            <span className="text-center">مرئي</span>
            <span className="text-center">إلزامي</span>
          </div>

          {Object.entries(config).map(([field, cfg]) => {
            const isLocked = field === 'phone';
            return (
              <div key={field} className={`grid grid-cols-[1fr_80px_80px] gap-2 items-center px-3 py-3 rounded-lg border ${isLocked ? 'bg-muted/50' : 'bg-card hover:bg-muted/20'}`}>
                <div className="flex items-center gap-2">
                  <span className="font-cairo font-semibold text-sm">{FIELD_LABELS[field]}</span>
                  {isLocked && (
                    <Badge variant="outline" className="font-cairo text-[10px] gap-0.5 px-1.5">
                      <Lock className="w-2.5 h-2.5" /> مقفل
                    </Badge>
                  )}
                </div>
                <div className="flex justify-center">
                  <Switch
                    checked={cfg.visible}
                    onCheckedChange={v => toggleField(field, 'visible', v)}
                    disabled={isLocked}
                  />
                </div>
                <div className="flex justify-center">
                  <Switch
                    checked={cfg.required}
                    onCheckedChange={v => toggleField(field, 'required', v)}
                    disabled={isLocked || !cfg.visible}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <Button onClick={onSave} disabled={saving || !hasChanges} className="font-cairo gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </Button>
      </div>
    </div>
  );
}
