import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Check, LayoutGrid, Minimize2, Zap, Droplets } from 'lucide-react';

const TEMPLATES = [
  {
    id: 'classic',
    name: 'كلاسيكي',
    icon: LayoutGrid,
    desc: 'التصميم الحالي — سلايدر رئيسي، شريط ثقة، عرض الفئات والمنتجات في أقسام متعددة.',
    features: ['سلايدر صور', 'شريط ثقة', 'فئات', 'أقسام منتجات متعددة'],
  },
  {
    id: 'minimal',
    name: 'بسيط',
    icon: Minimize2,
    desc: 'تصميم نظيف بدون سلايدر — شريط بحث كبير مع عرض مباشر للمنتجات.',
    features: ['بحث بارز', 'عرض مباشر', 'تصميم نظيف', 'بدون سلايدر'],
  },
  {
    id: 'bold',
    name: 'جريء',
    icon: Zap,
    desc: 'تصميم عصري — صورة رئيسية كبيرة، بطاقات فئات كبيرة، منتج مميز.',
    features: ['صورة كاملة', 'فئات كبيرة', 'منتج مميز', 'تأثيرات بصرية'],
  },
  {
    id: 'liquid',
    name: 'سائل',
    icon: Droplets,
    desc: 'تصميم متقدم — خلفية سائلة متحركة، بطاقات زجاجية ثلاثية الأبعاد، تأثيرات بصرية غامرة.',
    features: ['خلفية سائلة', 'زجاجية', 'تأثير 3D', 'تدرجات متحركة'],
  },
];

interface Props {
  currentValue: string | undefined;
  onUpdate: (value: string) => void;
  onSave: () => void;
  saving: boolean;
  hasChanges: boolean;
}

export default function AppearanceTab({ currentValue, onUpdate, onSave, saving, hasChanges }: Props) {
  const selected = currentValue || 'classic';

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="font-cairo font-bold text-xl">مظهر المتجر</h2>
        <p className="font-cairo text-sm text-muted-foreground">
          اختر قالب الصفحة الرئيسية الذي يناسب متجرك
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TEMPLATES.map(tpl => {
            const isSelected = selected === tpl.id;
            return (
              <button
                key={tpl.id}
                onClick={() => onUpdate(tpl.id)}
                className={`relative text-right p-5 rounded-2xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                    : 'border-border hover:border-primary/30 hover:shadow-md'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                )}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${isSelected ? 'bg-primary/15' : 'bg-muted'}`}>
                  <tpl.icon className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <h3 className="font-cairo font-bold text-base mb-1">{tpl.name}</h3>
                <p className="font-cairo text-xs text-muted-foreground leading-relaxed mb-3">{tpl.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {tpl.features.map(f => (
                    <Badge key={f} variant="secondary" className="font-cairo text-[10px] px-1.5 py-0">
                      {f}
                    </Badge>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <Button onClick={onSave} disabled={saving || !hasChanges} className="font-cairo gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'جاري الحفظ...' : 'حفظ القالب'}
        </Button>
      </div>
    </div>
  );
}
