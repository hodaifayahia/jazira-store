import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, Lock, Upload, Eye, Building2, Home } from 'lucide-react';

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

function FormPreview({ config }: { config: CheckoutFormConfig }) {
  const label = (field: string) => {
    const req = config[field]?.required;
    return `${FIELD_LABELS[field]}${req ? ' *' : ''}`;
  };

  return (
    <div className="bg-card border rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Eye className="w-5 h-5 text-primary" />
        <h2 className="font-cairo font-bold text-xl">معاينة النموذج</h2>
      </div>
      <p className="font-cairo text-xs text-muted-foreground">هذا ما سيراه العميل عند إتمام الطلب</p>

      <div className="space-y-4 pt-2">
        {config.name?.visible && (
          <div className="space-y-1.5">
            <Label className="font-cairo text-sm">{label('name')}</Label>
            <Input disabled placeholder="محمد أحمد" className="font-cairo" />
          </div>
        )}

        {config.phone?.visible && (
          <div className="space-y-1.5">
            <Label className="font-cairo text-sm">{label('phone')}</Label>
            <Input disabled placeholder="0555 123 456" className="font-cairo" dir="ltr" />
          </div>
        )}

        {config.wilaya?.visible && (
          <div className="space-y-1.5">
            <Label className="font-cairo text-sm">{label('wilaya')}</Label>
            <div className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground opacity-50 font-cairo">
              اختر الولاية...
            </div>
          </div>
        )}

        {config.baladiya?.visible && (
          <div className="space-y-1.5">
            <Label className="font-cairo text-sm">{label('baladiya')}</Label>
            <div className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground opacity-50 font-cairo">
              اختر البلدية...
            </div>
          </div>
        )}

        {config.delivery_type?.visible && (
          <div className="space-y-1.5">
            <Label className="font-cairo text-sm">{label('delivery_type')}</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 rounded-lg border-2 border-primary bg-primary/5 p-3 opacity-70">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="font-cairo text-sm">مكتب</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border p-3 opacity-50">
                <Home className="w-4 h-4 text-muted-foreground" />
                <span className="font-cairo text-sm">منزل</span>
              </div>
            </div>
          </div>
        )}

        {config.address?.visible && (
          <div className="space-y-1.5">
            <Label className="font-cairo text-sm">{label('address')}</Label>
            <Textarea disabled placeholder="العنوان بالتفصيل..." className="font-cairo min-h-[60px]" />
          </div>
        )}

        {config.coupon?.visible && (
          <div className="space-y-1.5">
            <Label className="font-cairo text-sm">{label('coupon')}</Label>
            <div className="flex gap-2">
              <Input disabled placeholder="أدخل كود الخصم" className="font-cairo" />
              <Button disabled variant="outline" size="sm" className="font-cairo shrink-0">تطبيق</Button>
            </div>
          </div>
        )}

        {config.payment_receipt?.visible && (
          <div className="space-y-1.5">
            <Label className="font-cairo text-sm">{label('payment_receipt')}</Label>
            <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 opacity-50">
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="font-cairo text-sm text-muted-foreground">ارفق إيصال الدفع</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
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
    if (prop === 'visible' && !value) {
      updated[field].required = false;
    }
    onUpdate(JSON.stringify(updated));
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Right: Controls */}
      <div className="bg-card border rounded-lg p-6 space-y-4 order-1 md:order-1">
        <h2 className="font-cairo font-bold text-xl">إعدادات حقول الطلب</h2>
        <p className="font-cairo text-sm text-muted-foreground">
          تحكم في الحقول التي تظهر في صفحة إتمام الطلب وأيها إلزامي
        </p>

        <div className="space-y-1">
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

      {/* Left: Live Preview */}
      <div className="order-2 md:order-2">
        <FormPreview config={config} />
      </div>
    </div>
  );
}
