import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Trash2, Image as ImageIcon, Type, CheckCircle, Home, ShoppingBag } from 'lucide-react';

export default function AdminContentPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('*');
      const map: Record<string, string> = {};
      data?.forEach(s => { map[s.key] = s.value || ''; });
      return map;
    },
  });

  const merged = { ...settings, ...form };
  const setField = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const entries = Object.entries(form).map(([key, value]) => ({ key, value }));
      for (const entry of entries) {
        const { data } = await supabase.from('settings').update({ value: entry.value }).eq('key', entry.key).select();
        if (!data || data.length === 0) {
          await supabase.from('settings').insert({ key: entry.key, value: entry.value });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      toast({ title: 'تم حفظ المحتوى ✅' });
      setForm({});
    },
  });

  const handleImageUpload = async (file: File, settingKey: string) => {
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'حجم الملف كبير (الحد الأقصى 2MB)', variant: 'destructive' });
      return;
    }
    setUploading(settingKey);
    try {
      const ext = file.name.split('.').pop();
      const path = `content-${settingKey}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('store').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('store').getPublicUrl(path);
      setField(settingKey, urlData.publicUrl);
      toast({ title: 'تم رفع الصورة ✅' });
    } catch {
      toast({ title: 'فشل رفع الصورة', variant: 'destructive' });
    } finally {
      setUploading(null);
    }
  };

  const hasChanges = Object.keys(form).length > 0;

  if (isLoading) return null;

  const ImageUploader = ({ settingKey, label }: { settingKey: string; label: string }) => (
    <div className="space-y-2">
      <Label className="font-cairo text-sm">{label}</Label>
      {merged[settingKey] ? (
        <div className="relative group">
          <img src={merged[settingKey]} alt={label} className="w-full max-h-40 object-cover rounded-lg border" />
          <Button
            variant="destructive" size="icon"
            className="absolute top-2 left-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setField(settingKey, '')}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/40 transition-colors">
          {uploading === settingKey ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="w-5 h-5 text-muted-foreground mb-1" />
              <span className="font-cairo text-xs text-muted-foreground">رفع صورة</span>
            </>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], settingKey)} />
        </label>
      )}
    </div>
  );

  const TextField = ({ settingKey, label, placeholder, multiline = false }: { settingKey: string; label: string; placeholder?: string; multiline?: boolean }) => (
    <div className="space-y-1.5">
      <Label className="font-cairo text-sm">{label}</Label>
      {multiline ? (
        <Textarea value={merged[settingKey] || ''} onChange={e => setField(settingKey, e.target.value)} placeholder={placeholder} className="font-cairo min-h-[80px]" />
      ) : (
        <Input value={merged[settingKey] || ''} onChange={e => setField(settingKey, e.target.value)} placeholder={placeholder} className="font-cairo" />
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-cairo font-bold text-2xl">إدارة المحتوى</h2>
          <p className="font-cairo text-sm text-muted-foreground mt-1">تحكم في جميع النصوص والصور المعروضة في الموقع</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={!hasChanges || saveMutation.isPending} className="font-cairo gap-2">
          {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          حفظ التغييرات
        </Button>
      </div>

      <Tabs defaultValue="homepage" className="space-y-4">
        <TabsList className="font-cairo">
          <TabsTrigger value="homepage" className="font-cairo gap-1.5"><Home className="w-3.5 h-3.5" /> الصفحة الرئيسية</TabsTrigger>
          <TabsTrigger value="thankyou" className="font-cairo gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> صفحة الشكر</TabsTrigger>
          <TabsTrigger value="about" className="font-cairo gap-1.5"><ShoppingBag className="w-3.5 h-3.5" /> حول المتجر</TabsTrigger>
        </TabsList>

        {/* ── Homepage ── */}
        <TabsContent value="homepage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-cairo text-base flex items-center gap-2"><ImageIcon className="w-4 h-4 text-primary" /> بانر الصفحة الرئيسية</CardTitle>
              <CardDescription className="font-cairo text-xs">الصورة والنصوص التي تظهر في أعلى الصفحة الرئيسية (عند عدم استخدام السلايدر)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUploader settingKey="content_hero_image" label="صورة البانر الرئيسية" />
              <TextField settingKey="content_hero_badge" label="شارة البانر" placeholder="🌿 100% طبيعي — Natural & Pure" />
              <TextField settingKey="content_hero_title" label="عنوان البانر الرئيسي" placeholder="أجود التمور والعسل الطبيعي" />
              <TextField settingKey="content_hero_subtitle" label="العنوان الفرعي" placeholder="The finest dates & natural honey" />
              <TextField settingKey="content_hero_cta" label="نص زر الشراء" placeholder="تسوّق الآن" />
              <TextField settingKey="content_hero_cta2" label="نص الزر الثانوي" placeholder="اكتشف المنتجات" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-cairo text-base flex items-center gap-2"><Type className="w-4 h-4 text-primary" /> شريط الثقة</CardTitle>
              <CardDescription className="font-cairo text-xs">النصوص التي تظهر أسفل البانر مباشرة</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField settingKey="content_trust_1_title" label="عنصر 1 - العنوان" placeholder="عسل طبيعي 100%" />
              <TextField settingKey="content_trust_1_desc" label="عنصر 1 - الوصف" placeholder="بدون إضافات" />
              <TextField settingKey="content_trust_2_title" label="عنصر 2 - العنوان" placeholder="توصيل سريع" />
              <TextField settingKey="content_trust_2_desc" label="عنصر 2 - الوصف" placeholder="لجميع الولايات" />
              <TextField settingKey="content_trust_3_title" label="عنصر 3 - العنوان" placeholder="جودة معتمدة" />
              <TextField settingKey="content_trust_3_desc" label="عنصر 3 - الوصف" placeholder="منتجات مختارة" />
              <TextField settingKey="content_trust_4_title" label="عنصر 4 - العنوان" placeholder="بدون مواد حافظة" />
              <TextField settingKey="content_trust_4_desc" label="عنصر 4 - الوصف" placeholder="100% طبيعي" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-cairo text-base flex items-center gap-2"><Type className="w-4 h-4 text-primary" /> قسم قصتنا</CardTitle>
              <CardDescription className="font-cairo text-xs">النصوص والصور في قسم "من قلب الطبيعة إلى مائدتكم"</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUploader settingKey="content_story_image" label="صورة القسم" />
              <TextField settingKey="content_story_badge" label="شارة القسم" placeholder="قصتنا" />
              <TextField settingKey="content_story_title" label="العنوان" placeholder="من قلب الطبيعة إلى مائدتكم" />
              <TextField settingKey="content_story_quote" label="الاقتباس" placeholder="نختار لكم أجود المنتجات الطبيعية من أفضل المزارع والمناحل" />
              <TextField settingKey="content_story_text" label="النص" placeholder="نؤمن بأن الطبيعة تقدم أفضل ما يمكن لصحتكم..." multiline />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-cairo text-base">عناوين الأقسام</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField settingKey="content_categories_title" label="عنوان قسم الفئات" placeholder="تصفح حسب الفئة" />
              <TextField settingKey="content_bestsellers_title" label="عنوان قسم الأكثر مبيعاً" placeholder="الأكثر مبيعاً" />
              <TextField settingKey="content_bestsellers_subtitle" label="وصف الأكثر مبيعاً" placeholder="أفضل منتجاتنا المختارة بعناية" />
              <TextField settingKey="content_reviews_title" label="عنوان آراء العملاء" placeholder="آراء عملائنا" />
              <TextField settingKey="content_reviews_subtitle" label="وصف آراء العملاء" placeholder="ماذا يقول عملاؤنا عن منتجاتنا" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Thank You Page ── */}
        <TabsContent value="thankyou" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-cairo text-base flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> صفحة تأكيد الطلب</CardTitle>
              <CardDescription className="font-cairo text-xs">النصوص التي تظهر بعد إتمام الطلب بنجاح</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextField settingKey="content_thankyou_title" label="العنوان الرئيسي" placeholder="تم استلام طلبك بنجاح! ✅" />
              <TextField settingKey="content_thankyou_subtitle" label="النص الفرعي" placeholder="شكراً لك، سنتواصل معك قريباً لتأكيد الطلب." />
              <TextField settingKey="content_thankyou_track_btn" label="نص زر التتبع" placeholder="تتبع الطلب" />
              <TextField settingKey="content_thankyou_home_btn" label="نص زر العودة" placeholder="العودة إلى المتجر" />
              <ImageUploader settingKey="content_thankyou_image" label="صورة صفحة الشكر (اختياري)" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── About Page ── */}
        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-cairo text-base flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-primary" /> صفحة حول المتجر</CardTitle>
              <CardDescription className="font-cairo text-xs">محتوى صفحة "حول المتجر"</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextField settingKey="content_about_title" label="العنوان" placeholder="من نحن" />
              <TextField settingKey="content_about_text" label="النص" placeholder="نبذة عن المتجر وقصته..." multiline />
              <ImageUploader settingKey="content_about_image" label="صورة صفحة حول المتجر" />
              <TextField settingKey="content_about_mission" label="رسالتنا" placeholder="رسالة المتجر..." multiline />
              <TextField settingKey="content_about_vision" label="رؤيتنا" placeholder="رؤية المتجر..." multiline />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sticky save button */}
      {hasChanges && (
        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="font-cairo gap-2 shadow-lg">
            {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            حفظ التغييرات
          </Button>
        </div>
      )}
    </div>
  );
}