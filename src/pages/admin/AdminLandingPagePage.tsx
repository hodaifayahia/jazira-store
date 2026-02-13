import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Rocket, Sparkles, RefreshCw, Copy, ExternalLink, Check, Star, Pencil, ShoppingCart } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  old_price: number | null;
  description: string | null;
  short_description: string | null;
  category: string[];
  images: string[] | null;
  main_image_index: number | null;
}

interface LandingContent {
  headline: string;
  subheadline: string;
  description: string;
  benefits: { icon: string; title: string; text: string }[];
  cta_primary: string;
  cta_secondary: string;
  testimonials: { name: string; text: string; rating: number }[];
  urgency_text: string;
}

const LANGUAGES = [
  { value: 'ar', label: 'العربية', flag: '🇩🇿' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'tr', label: 'Türkçe', flag: '🇹🇷' },
];

export default function AdminLandingPagePage() {
  const { t, language, dir } = useTranslation();
  const isRtl = dir === 'rtl';

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedLang, setSelectedLang] = useState<string>(language);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [content, setContent] = useState<LandingContent | null>(null);
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data } = await supabase.from('products').select('id, name, price, old_price, description, short_description, category, images, main_image_index').eq('is_active', true).order('name');
      setProducts(data || []);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  useEffect(() => {
    if (selectedProduct) {
      setSelectedImageIndex(selectedProduct.main_image_index || 0);
    }
  }, [selectedProductId]);

  const handleGenerate = async () => {
    if (!selectedProduct) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-landing', {
        body: {
          productName: selectedProduct.name,
          price: selectedProduct.price,
          oldPrice: selectedProduct.old_price,
          description: selectedProduct.description,
          shortDescription: selectedProduct.short_description,
          category: selectedProduct.category?.join(', '),
          language: selectedLang,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setContent(data);
      toast.success(t('landing.generated'));
    } catch (e: any) {
      toast.error(e.message || t('common.errorOccurred'));
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyHtml = () => {
    if (!previewRef.current) return;
    const html = previewRef.current.innerHTML;
    const fullHtml = `<!DOCTYPE html>
<html lang="${selectedLang}" dir="${selectedLang === 'ar' ? 'rtl' : 'ltr'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${content?.headline || selectedProduct?.name || ''}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;color:#1a1a1a;background:#fff}
.lp-hero{position:relative;min-height:80vh;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#000}
.lp-hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.6}
.lp-hero-content{position:relative;z-index:1;text-align:center;color:#fff;padding:2rem;max-width:700px}
.lp-hero h1{font-size:clamp(2rem,5vw,3.5rem);font-weight:800;margin-bottom:1rem;line-height:1.2}
.lp-hero p{font-size:1.25rem;opacity:0.9;margin-bottom:2rem}
.lp-btn{display:inline-block;padding:1rem 2.5rem;border-radius:0.5rem;font-weight:700;font-size:1.1rem;text-decoration:none;transition:transform 0.2s}
.lp-btn-primary{background:#f97316;color:#fff}.lp-btn-primary:hover{transform:scale(1.05)}
.lp-btn-secondary{border:2px solid #fff;color:#fff;margin-left:1rem}
.lp-benefits{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:2rem;padding:4rem 2rem;max-width:1200px;margin:0 auto}
.lp-benefit{text-align:center;padding:2rem}
.lp-benefit .icon{font-size:2.5rem;margin-bottom:1rem}
.lp-benefit h3{font-size:1.25rem;font-weight:700;margin-bottom:0.5rem}
.lp-details{display:flex;flex-wrap:wrap;gap:3rem;padding:4rem 2rem;max-width:1200px;margin:0 auto;align-items:center}
.lp-details img{flex:1;min-width:300px;max-width:500px;border-radius:1rem;object-fit:cover}
.lp-details-text{flex:1;min-width:300px}
.lp-details-text h2{font-size:2rem;font-weight:800;margin-bottom:1rem}
.lp-details-text p{line-height:1.8;margin-bottom:1rem;color:#444}
.lp-reviews{background:#f9fafb;padding:4rem 2rem}
.lp-reviews-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:2rem;max-width:1200px;margin:0 auto}
.lp-review{background:#fff;border-radius:1rem;padding:2rem;box-shadow:0 1px 3px rgba(0,0,0,0.1)}
.lp-review .stars{color:#f59e0b;margin-bottom:0.5rem}
.lp-review p{color:#555;font-style:italic;margin-bottom:1rem}
.lp-review .name{font-weight:700;color:#333}
.lp-urgency{background:linear-gradient(135deg,#f97316,#ef4444);color:#fff;text-align:center;padding:2rem;font-size:1.25rem;font-weight:700}
.lp-cta-final{text-align:center;padding:4rem 2rem;background:#111;color:#fff}
.lp-cta-final h2{font-size:2rem;font-weight:800;margin-bottom:0.5rem}
.lp-cta-final .price{font-size:2.5rem;font-weight:800;color:#f97316;margin-bottom:2rem}
.lp-cta-final .old-price{text-decoration:line-through;opacity:0.6;font-size:1.5rem;margin-right:1rem}
</style>
</head>
<body>${previewRef.current.innerHTML}</body>
</html>`;
    navigator.clipboard.writeText(fullHtml);
    setCopied(true);
    toast.success(t('landing.copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePreviewTab = () => {
    if (!previewRef.current) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(previewRef.current.innerHTML);
    win.document.close();
  };

  const productImage = selectedProduct?.images?.[selectedImageIndex];

  // Editable content helpers
  const updateField = (field: keyof LandingContent, value: string) => {
    if (!content) return;
    setContent({ ...content, [field]: value });
  };

  const EditableText = ({ tag: Tag = 'span' as any, value, onChange, className = '', style = {} }: any) => (
    <Tag
      contentEditable
      suppressContentEditableWarning
      onBlur={(e: any) => onChange(e.currentTarget.textContent || '')}
      className={`outline-none hover:ring-2 hover:ring-primary/30 rounded px-1 cursor-text ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: value }}
    />
  );

  return (
    <div className="space-y-6" dir={dir}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Rocket className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-cairo">{t('landing.title')}</h1>
          <p className="text-sm text-muted-foreground font-cairo">{t('landing.subtitle')}</p>
        </div>
      </div>

      {/* Step 1: Product + Image + Language */}
      <div className="bg-card rounded-xl border p-6 space-y-4">
        <h2 className="font-cairo font-bold text-lg flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</span>
          {t('landing.selectProduct')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-cairo text-muted-foreground mb-1 block">{t('common.product')}</label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger className="font-cairo">
                <SelectValue placeholder={t('landing.choosePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id} className="font-cairo">
                    {p.name} — {p.price} DA
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-cairo text-muted-foreground mb-1 block">{t('landing.language')}</label>
            <Select value={selectedLang} onValueChange={setSelectedLang}>
              <SelectTrigger className="font-cairo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(l => (
                  <SelectItem key={l.value} value={l.value} className="font-cairo">
                    {l.flag} {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Image grid */}
        {selectedProduct?.images && selectedProduct.images.length > 0 && (
          <div>
            <label className="text-sm font-cairo text-muted-foreground mb-2 block">{t('landing.selectImage')}</label>
            <div className="flex gap-2 flex-wrap">
              {selectedProduct.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImageIndex(i)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    i === selectedImageIndex ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={!selectedProductId || generating}
          className="gap-2 font-cairo"
          size="lg"
        >
          {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? t('landing.generating') : t('landing.generate')}
        </Button>
      </div>

      {/* Generating skeleton */}
      {generating && !content && (
        <div className="bg-card rounded-xl border p-6 space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      )}

      {/* Live Preview */}
      {content && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-cairo font-bold text-lg flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</span>
              {t('landing.preview')}
              <span className="text-xs text-muted-foreground font-normal flex items-center gap-1">
                <Pencil className="w-3 h-3" /> {t('landing.editHint')}
              </span>
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating} className="gap-1.5 font-cairo">
                <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                {t('landing.regenerate')}
              </Button>
              <Button variant="outline" size="sm" onClick={handlePreviewTab} className="gap-1.5 font-cairo">
                <ExternalLink className="w-3.5 h-3.5" />
                {t('landing.previewTab')}
              </Button>
              <Button size="sm" onClick={handleCopyHtml} className="gap-1.5 font-cairo">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('landing.copiedBtn') : t('landing.exportHtml')}
              </Button>
            </div>
          </div>

          {/* The actual landing page preview */}
          <div ref={previewRef} className="bg-white rounded-xl border overflow-hidden shadow-lg" dir={selectedLang === 'ar' ? 'rtl' : 'ltr'}>
            {/* Hero */}
            <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-black">
              {productImage && (
                <img src={productImage} alt={selectedProduct?.name} className="absolute inset-0 w-full h-full object-cover opacity-60" />
              )}
              <div className="relative z-10 text-center text-white p-8 max-w-2xl">
                <EditableText tag="h1" value={content.headline} onChange={(v: string) => updateField('headline', v)} className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight" />
                <EditableText tag="p" value={content.subheadline} onChange={(v: string) => updateField('subheadline', v)} className="text-lg md:text-xl opacity-90 mb-8 block" />
                <div className="flex gap-3 justify-center flex-wrap">
                  <a href="#order" className="inline-block px-8 py-3 bg-orange-500 text-white font-bold rounded-lg hover:scale-105 transition-transform text-lg">
                    <EditableText value={content.cta_primary} onChange={(v: string) => updateField('cta_primary', v)} />
                  </a>
                  <a href="#details" className="inline-block px-8 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition text-lg">
                    <EditableText value={content.cta_secondary} onChange={(v: string) => updateField('cta_secondary', v)} />
                  </a>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 md:p-12 max-w-6xl mx-auto">
              {content.benefits.map((b, i) => (
                <div key={i} className="text-center p-6">
                  <div className="text-4xl mb-3">{b.icon}</div>
                  <EditableText
                    tag="h3"
                    value={b.title}
                    onChange={(v: string) => {
                      const newBenefits = [...content.benefits];
                      newBenefits[i] = { ...newBenefits[i], title: v };
                      setContent({ ...content, benefits: newBenefits });
                    }}
                    className="text-lg font-bold mb-2 text-gray-900 block"
                  />
                  <EditableText
                    tag="p"
                    value={b.text}
                    onChange={(v: string) => {
                      const newBenefits = [...content.benefits];
                      newBenefits[i] = { ...newBenefits[i], text: v };
                      setContent({ ...content, benefits: newBenefits });
                    }}
                    className="text-gray-600 block"
                  />
                </div>
              ))}
            </div>

            {/* Product Details */}
            <div id="details" className="flex flex-col md:flex-row gap-8 p-8 md:p-12 max-w-6xl mx-auto items-center">
              {productImage && (
                <img src={productImage} alt="" className="flex-1 min-w-[280px] max-w-[480px] rounded-2xl object-cover" />
              )}
              <div className="flex-1 min-w-[280px]">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-4">{selectedProduct?.name}</h2>
                <EditableText
                  tag="div"
                  value={content.description.replace(/\n/g, '<br/>')}
                  onChange={(v: string) => updateField('description', v)}
                  className="text-gray-600 leading-relaxed whitespace-pre-line block"
                />
                <div className="mt-6 flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-orange-500">{selectedProduct?.price} DA</span>
                  {selectedProduct?.old_price && (
                    <span className="text-xl text-gray-400 line-through">{selectedProduct.old_price} DA</span>
                  )}
                </div>
              </div>
            </div>

            {/* Testimonials */}
            <div className="bg-gray-50 py-12 px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {content.testimonials.map((rev, i) => (
                  <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex gap-0.5 mb-2">
                      {Array.from({ length: rev.rating }).map((_, s) => (
                        <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <EditableText
                      tag="p"
                      value={rev.text}
                      onChange={(v: string) => {
                        const newTestimonials = [...content.testimonials];
                        newTestimonials[i] = { ...newTestimonials[i], text: v };
                        setContent({ ...content, testimonials: newTestimonials });
                      }}
                      className="text-gray-600 italic mb-3 block"
                    />
                    <EditableText
                      tag="span"
                      value={rev.name}
                      onChange={(v: string) => {
                        const newTestimonials = [...content.testimonials];
                        newTestimonials[i] = { ...newTestimonials[i], name: v };
                        setContent({ ...content, testimonials: newTestimonials });
                      }}
                      className="font-bold text-gray-800"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Urgency */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-center py-5 px-4 text-lg font-bold">
              <EditableText value={content.urgency_text} onChange={(v: string) => updateField('urgency_text', v)} />
            </div>

            {/* Final CTA */}
            <div id="order" className="text-center py-16 px-8 bg-gray-900 text-white">
              <h2 className="text-3xl font-extrabold mb-2">{selectedProduct?.name}</h2>
              <div className="mb-6">
                {selectedProduct?.old_price && (
                  <span className="text-xl text-gray-400 line-through mr-3">{selectedProduct.old_price} DA</span>
                )}
                <span className="text-4xl font-extrabold text-orange-500">{selectedProduct?.price} DA</span>
              </div>
              <a
                href={`/product/${selectedProduct?.id}`}
                className="inline-flex items-center gap-2 px-10 py-4 bg-orange-500 text-white font-bold rounded-xl text-xl hover:scale-105 transition-transform"
              >
                <ShoppingCart className="w-5 h-5" />
                <EditableText value={content.cta_primary} onChange={(v: string) => updateField('cta_primary', v)} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
