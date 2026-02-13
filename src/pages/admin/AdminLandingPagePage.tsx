import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Rocket, Sparkles, RefreshCw, Copy, ExternalLink, Check, Star,
  Pencil, ShoppingCart, ImagePlus, Wand2, ArrowDown, Package, Shield,
  Truck, RotateCcw, Phone, User, MapPin, CheckCircle, Loader2
} from 'lucide-react';

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
  stock: number | null;
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
  const [generating, setGenerating] = useState(false);
  const [content, setContent] = useState<LandingContent | null>(null);
  const [copied, setCopied] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [step, setStep] = useState(1);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, price, old_price, description, short_description, category, images, main_image_index, stock')
        .eq('is_active', true)
        .order('name');
      setProducts(data || []);
    };
    fetchProducts();
  }, []);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  useEffect(() => {
    if (selectedProduct) {
      setSelectedImageIndex(selectedProduct.main_image_index || 0);
      setImagePrompt('');
      setGeneratedImages([]);
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
      setStep(3);
      toast.success(t('landing.generated'));
    } catch (e: any) {
      toast.error(e.message || t('common.errorOccurred'));
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!selectedProduct) return;
    setGeneratingImage(true);
    try {
      const prompt = imagePrompt.trim() || `High quality professional product photo of ${selectedProduct.name}, studio lighting, clean background, commercial photography, 4K ultra HD`;
      const { data, error } = await supabase.functions.invoke('generate-landing-image', {
        body: { prompt, productName: selectedProduct.name },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        setGeneratedImages(prev => [...prev, data.url]);
        toast.success(t('landing.imageGenerated'));
      }
    } catch (e: any) {
      toast.error(e.message || t('common.errorOccurred'));
    } finally {
      setGeneratingImage(false);
    }
  };

  const allImages = [
    ...(selectedProduct?.images || []),
    ...generatedImages,
  ];

  const handleCopyHtml = () => {
    if (!previewRef.current) return;
    const clone = previewRef.current.cloneNode(true) as HTMLElement;
    // Remove contenteditable
    clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    const innerHtml = clone.innerHTML;
    const fullHtml = `<!DOCTYPE html>
<html lang="${selectedLang}" dir="${selectedLang === 'ar' ? 'rtl' : 'ltr'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${content?.headline || selectedProduct?.name || ''}</title>
<meta name="description" content="${content?.subheadline || ''}">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;color:#1a1a1a;background:#fff}
img{max-width:100%}
.lp-hero{position:relative;min-height:90vh;display:flex;align-items:center;justify-content:center;overflow:hidden;background:linear-gradient(135deg,#0f172a,#1e293b)}
.lp-hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.5}
.lp-hero::after{content:'';position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.3),rgba(0,0,0,0.7))}
.lp-hero-content{position:relative;z-index:1;text-align:center;color:#fff;padding:2rem;max-width:800px}
.lp-hero h1{font-size:clamp(2rem,6vw,4rem);font-weight:900;margin-bottom:1.5rem;line-height:1.1;text-shadow:0 2px 20px rgba(0,0,0,0.3)}
.lp-hero p{font-size:1.3rem;opacity:0.9;margin-bottom:2.5rem;line-height:1.6}
.lp-btn{display:inline-block;padding:1rem 2.5rem;border-radius:0.75rem;font-weight:700;font-size:1.1rem;text-decoration:none;transition:all 0.3s;cursor:pointer}
.lp-btn-primary{background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;box-shadow:0 4px 20px rgba(249,115,22,0.4)}
.lp-btn-primary:hover{transform:translateY(-2px);box-shadow:0 6px 30px rgba(249,115,22,0.5)}
.lp-btn-secondary{border:2px solid rgba(255,255,255,0.6);color:#fff;backdrop-filter:blur(4px)}
.lp-trust{display:flex;flex-wrap:wrap;justify-content:center;gap:2rem;padding:3rem 2rem;background:#f8fafc;border-bottom:1px solid #e2e8f0}
.lp-trust-item{display:flex;align-items:center;gap:0.75rem;font-size:0.95rem;color:#475569;font-weight:600}
.lp-trust-icon{width:2.5rem;height:2.5rem;border-radius:0.75rem;display:flex;align-items:center;justify-content:center;font-size:1.2rem}
.lp-benefits{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:2rem;padding:5rem 2rem;max-width:1200px;margin:0 auto}
.lp-benefit{text-align:center;padding:2.5rem 2rem;border-radius:1rem;background:#fff;border:1px solid #f1f5f9;transition:all 0.3s}
.lp-benefit:hover{transform:translateY(-4px);box-shadow:0 10px 40px rgba(0,0,0,0.08)}
.lp-benefit .icon{font-size:3rem;margin-bottom:1rem}
.lp-benefit h3{font-size:1.2rem;font-weight:700;margin-bottom:0.75rem;color:#0f172a}
.lp-benefit p{color:#64748b;line-height:1.6}
.lp-details{display:flex;flex-wrap:wrap;gap:4rem;padding:5rem 2rem;max-width:1200px;margin:0 auto;align-items:center}
.lp-details img{flex:1;min-width:300px;max-width:520px;border-radius:1.5rem;box-shadow:0 20px 60px rgba(0,0,0,0.12)}
.lp-details-text{flex:1;min-width:300px}
.lp-details-text h2{font-size:2.5rem;font-weight:900;margin-bottom:1.5rem;color:#0f172a;line-height:1.2}
.lp-details-text p{line-height:1.9;margin-bottom:1rem;color:#475569;font-size:1.05rem}
.lp-price-tag{display:inline-flex;align-items:baseline;gap:0.75rem;margin-top:1.5rem;padding:1rem 1.5rem;background:linear-gradient(135deg,#fff7ed,#fef3c7);border-radius:1rem;border:1px solid #fed7aa}
.lp-reviews{padding:5rem 2rem;background:#f8fafc}
.lp-reviews h2{text-align:center;font-size:2rem;font-weight:800;margin-bottom:3rem;color:#0f172a}
.lp-reviews-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem;max-width:1200px;margin:0 auto}
.lp-review{background:#fff;border-radius:1rem;padding:2rem;box-shadow:0 1px 3px rgba(0,0,0,0.06);border:1px solid #f1f5f9}
.lp-review .stars{color:#f59e0b;margin-bottom:0.75rem;font-size:1.1rem}
.lp-review p{color:#475569;font-style:italic;margin-bottom:1rem;line-height:1.7}
.lp-review .name{font-weight:700;color:#0f172a}
.lp-urgency{background:linear-gradient(135deg,#dc2626,#ea580c);color:#fff;text-align:center;padding:1.5rem;font-size:1.2rem;font-weight:700;letter-spacing:0.02em}
.lp-form-section{padding:4rem 2rem;background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff}
.lp-form-wrapper{max-width:600px;margin:0 auto}
.lp-form-wrapper h2{text-align:center;font-size:2rem;font-weight:800;margin-bottom:0.5rem}
.lp-form-wrapper .subtitle{text-align:center;color:#94a3b8;margin-bottom:2rem}
.lp-form-group{margin-bottom:1.25rem}
.lp-form-group label{display:block;font-size:0.9rem;font-weight:600;margin-bottom:0.4rem;color:#cbd5e1}
.lp-form-group input,.lp-form-group select,.lp-form-group textarea{width:100%;padding:0.85rem 1rem;border-radius:0.75rem;border:1px solid #334155;background:#1e293b;color:#fff;font-size:1rem;outline:none;transition:border 0.2s}
.lp-form-group input:focus,.lp-form-group select:focus,.lp-form-group textarea:focus{border-color:#f97316}
.lp-form-group select option{background:#1e293b;color:#fff}
.lp-form-submit{width:100%;padding:1rem;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;border:none;border-radius:0.75rem;font-size:1.15rem;font-weight:700;cursor:pointer;transition:all 0.3s;margin-top:0.5rem}
.lp-form-submit:hover{transform:translateY(-2px);box-shadow:0 4px 20px rgba(249,115,22,0.4)}
.lp-form-price{text-align:center;margin-bottom:2rem;padding:1.5rem;background:rgba(249,115,22,0.1);border-radius:1rem;border:1px solid rgba(249,115,22,0.2)}
</style>
</head>
<body>${innerHtml}</body>
</html>`;
    navigator.clipboard.writeText(fullHtml);
    setCopied(true);
    toast.success(t('landing.copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePreviewTab = () => {
    if (!previewRef.current) return;
    const clone = previewRef.current.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html lang="${selectedLang}" dir="${selectedLang === 'ar' ? 'rtl' : 'ltr'}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${content?.headline || ''}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif}</style></head><body>${clone.innerHTML}</body></html>`);
    win.document.close();
  };

  const productImage = allImages[selectedImageIndex] || selectedProduct?.images?.[0];

  const updateField = (field: keyof LandingContent, value: string) => {
    if (!content) return;
    setContent({ ...content, [field]: value });
  };

  const EditableText = ({ tag: Tag = 'span' as any, value, onChange, className = '', style = {} }: any) => (
    <Tag
      contentEditable
      suppressContentEditableWarning
      onBlur={(e: any) => onChange(e.currentTarget.textContent || '')}
      className={`outline-none hover:ring-2 hover:ring-orange-400/40 focus:ring-2 focus:ring-orange-400/60 rounded px-0.5 cursor-text transition-all ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: value }}
    />
  );

  const formLabels: Record<string, Record<string, string>> = {
    ar: { orderNow: 'اطلب الآن', name: 'الاسم الكامل', phone: 'رقم الهاتف', wilaya: 'الولاية', address: 'العنوان', submit: 'تأكيد الطلب', subtitle: 'املأ النموذج وسنتواصل معك', namePh: 'أدخل اسمك', phonePh: 'أدخل رقم هاتفك', wilayaPh: 'اختر الولاية', addressPh: 'عنوان التوصيل' },
    en: { orderNow: 'Order Now', name: 'Full Name', phone: 'Phone Number', wilaya: 'Wilaya', address: 'Address', submit: 'Confirm Order', subtitle: 'Fill the form and we\'ll contact you', namePh: 'Enter your name', phonePh: 'Enter your phone', wilayaPh: 'Select wilaya', addressPh: 'Delivery address' },
    fr: { orderNow: 'Commander Maintenant', name: 'Nom complet', phone: 'Téléphone', wilaya: 'Wilaya', address: 'Adresse', submit: 'Confirmer la commande', subtitle: 'Remplissez le formulaire et nous vous contacterons', namePh: 'Entrez votre nom', phonePh: 'Entrez votre téléphone', wilayaPh: 'Sélectionner wilaya', addressPh: 'Adresse de livraison' },
    es: { orderNow: 'Pedir Ahora', name: 'Nombre completo', phone: 'Teléfono', wilaya: 'Provincia', address: 'Dirección', submit: 'Confirmar Pedido', subtitle: 'Rellene el formulario y nos pondremos en contacto', namePh: 'Tu nombre', phonePh: 'Tu teléfono', wilayaPh: 'Seleccionar provincia', addressPh: 'Dirección de entrega' },
    de: { orderNow: 'Jetzt Bestellen', name: 'Vollständiger Name', phone: 'Telefonnummer', wilaya: 'Region', address: 'Adresse', submit: 'Bestellung Bestätigen', subtitle: 'Füllen Sie das Formular aus und wir kontaktieren Sie', namePh: 'Ihr Name', phonePh: 'Ihre Telefonnummer', wilayaPh: 'Region wählen', addressPh: 'Lieferadresse' },
    tr: { orderNow: 'Şimdi Sipariş Ver', name: 'Ad Soyad', phone: 'Telefon Numarası', wilaya: 'Şehir', address: 'Adres', submit: 'Siparişi Onayla', subtitle: 'Formu doldurun, sizinle iletişime geçelim', namePh: 'Adınız', phonePh: 'Telefon numaranız', wilayaPh: 'Şehir seçin', addressPh: 'Teslimat adresi' },
  };
  const fl = formLabels[selectedLang] || formLabels.en;

  return (
    <div className="space-y-6" dir={dir}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Rocket className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-cairo">{t('landing.title')}</h1>
            <p className="text-sm text-muted-foreground font-cairo">{t('landing.subtitle')}</p>
          </div>
        </div>
        {/* Step indicators */}
        <div className="hidden md:flex items-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <button
                onClick={() => { if (s === 1 || (s === 2 && selectedProductId) || (s === 3 && content)) setStep(s); }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step === s ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : step > s ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </button>
              {s < 3 && <div className={`w-8 h-0.5 rounded ${step > s ? 'bg-primary/40' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Select Product & Language */}
      {step === 1 && (
        <div className="bg-card rounded-2xl border shadow-sm p-6 space-y-5">
          <h2 className="font-cairo font-bold text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {t('landing.selectProduct')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-cairo font-medium text-muted-foreground">{t('common.product')}</label>
              <Select value={selectedProductId} onValueChange={(v) => { setSelectedProductId(v); setContent(null); }}>
                <SelectTrigger className="font-cairo h-11">
                  <SelectValue placeholder={t('landing.choosePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id} className="font-cairo">
                      <span className="flex items-center gap-2">
                        {p.images?.[0] && <img src={p.images[0]} alt="" className="w-6 h-6 rounded object-cover" />}
                        {p.name} — {p.price} DA
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-cairo font-medium text-muted-foreground">{t('landing.language')}</label>
              <Select value={selectedLang} onValueChange={setSelectedLang}>
                <SelectTrigger className="font-cairo h-11">
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

          {/* Selected product preview card */}
          {selectedProduct && (
            <div className="flex gap-4 p-4 bg-muted/50 rounded-xl border">
              {selectedProduct.images?.[0] && (
                <img src={selectedProduct.images[0]} alt="" className="w-24 h-24 rounded-xl object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-cairo font-bold text-base truncate">{selectedProduct.name}</h3>
                <p className="text-sm text-muted-foreground font-cairo line-clamp-2">{selectedProduct.short_description || selectedProduct.description}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-bold text-primary">{selectedProduct.price} DA</span>
                  {selectedProduct.old_price && <span className="text-sm text-muted-foreground line-through">{selectedProduct.old_price} DA</span>}
                </div>
              </div>
            </div>
          )}

          <Button onClick={() => { if (selectedProductId) setStep(2); }} disabled={!selectedProductId} className="gap-2 font-cairo" size="lg">
            {t('common.next')} <ArrowDown className="w-4 h-4 rotate-[-90deg]" />
          </Button>
        </div>
      )}

      {/* Step 2: Images + AI Generation */}
      {step === 2 && selectedProduct && (
        <div className="bg-card rounded-2xl border shadow-sm p-6 space-y-5">
          <h2 className="font-cairo font-bold text-lg flex items-center gap-2">
            <ImagePlus className="w-5 h-5 text-primary" />
            {t('landing.selectImage')}
          </h2>

          {/* Image grid */}
          <div className="flex gap-3 flex-wrap">
            {allImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImageIndex(i)}
                className={`relative w-24 h-24 rounded-xl overflow-hidden border-2 transition-all group ${
                  i === selectedImageIndex ? 'border-primary ring-2 ring-primary/30 scale-105' : 'border-border hover:border-primary/50'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
                {i === selectedImageIndex && (
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-primary drop-shadow" />
                  </div>
                )}
                {i >= (selectedProduct.images?.length || 0) && (
                  <span className="absolute top-1 right-1 bg-primary/90 text-primary-foreground text-[9px] px-1 rounded font-bold">AI</span>
                )}
              </button>
            ))}
          </div>

          {/* AI Image Generation */}
          <div className="p-4 bg-muted/50 rounded-xl border space-y-3">
            <h3 className="font-cairo font-semibold text-sm flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-primary" />
              {t('landing.generateImage')}
            </h3>
            <div className="flex gap-2">
              <Input
                value={imagePrompt}
                onChange={e => setImagePrompt(e.target.value)}
                placeholder={t('landing.imagePromptPlaceholder')}
                className="font-cairo flex-1"
              />
              <Button onClick={handleGenerateImage} disabled={generatingImage} className="gap-2 font-cairo shrink-0">
                {generatingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generatingImage ? t('landing.generatingImage') : t('landing.generateImageBtn')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground font-cairo">{t('landing.imagePromptHint')}</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2 font-cairo">
              {t('common.back')}
            </Button>
            <Button onClick={handleGenerate} disabled={generating} className="gap-2 font-cairo" size="lg">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? t('landing.generating') : t('landing.generate')}
            </Button>
          </div>
        </div>
      )}

      {/* Generating skeleton */}
      {generating && (
        <div className="bg-card rounded-2xl border p-8 space-y-8">
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="font-cairo text-lg text-muted-foreground">{t('landing.generating')}</span>
          </div>
          <Skeleton className="h-72 w-full rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-36 rounded-xl" />
            <Skeleton className="h-36 rounded-xl" />
            <Skeleton className="h-36 rounded-xl" />
          </div>
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
      )}

      {/* Step 3: Live Preview */}
      {step === 3 && content && !generating && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-card rounded-2xl border p-4 shadow-sm sticky top-14 z-30">
            <div className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-cairo">{t('landing.editHint')}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setStep(2)} className="gap-1.5 font-cairo">
                {t('common.back')}
              </Button>
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

          {/* Landing page preview */}
          <div ref={previewRef} className="rounded-2xl border overflow-hidden shadow-2xl" dir={selectedLang === 'ar' ? 'rtl' : 'ltr'} style={{ background: '#fff', color: '#1a1a1a' }}>
            {/* Hero */}
            <div style={{ position: 'relative', minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}>
              {productImage && (
                <img src={productImage} alt={selectedProduct?.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.2),rgba(0,0,0,0.7))' }} />
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: '#fff', padding: '3rem 2rem', maxWidth: '800px' }}>
                <EditableText tag="h1" value={content.headline} onChange={(v: string) => updateField('headline', v)} style={{ fontSize: 'clamp(2rem,6vw,4rem)', fontWeight: 900, marginBottom: '1.5rem', lineHeight: 1.1, textShadow: '0 2px 20px rgba(0,0,0,0.3)' }} />
                <EditableText tag="p" value={content.subheadline} onChange={(v: string) => updateField('subheadline', v)} className="block" style={{ fontSize: '1.3rem', opacity: 0.9, marginBottom: '2.5rem', lineHeight: 1.6 }} />
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <a href="#order-form" style={{ display: 'inline-block', padding: '1rem 2.5rem', borderRadius: '0.75rem', fontWeight: 700, fontSize: '1.1rem', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 20px rgba(249,115,22,0.4)' }}>
                    <EditableText value={content.cta_primary} onChange={(v: string) => updateField('cta_primary', v)} />
                  </a>
                  <a href="#details" style={{ display: 'inline-block', padding: '1rem 2.5rem', borderRadius: '0.75rem', fontWeight: 700, fontSize: '1.1rem', border: '2px solid rgba(255,255,255,0.6)', color: '#fff', textDecoration: 'none' }}>
                    <EditableText value={content.cta_secondary} onChange={(v: string) => updateField('cta_secondary', v)} />
                  </a>
                </div>
              </div>
            </div>

            {/* Trust bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem', padding: '1.5rem 2rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {[
                { icon: '🚚', text: selectedLang === 'ar' ? 'توصيل سريع' : selectedLang === 'fr' ? 'Livraison rapide' : 'Fast Delivery' },
                { icon: '🛡️', text: selectedLang === 'ar' ? 'دفع آمن' : selectedLang === 'fr' ? 'Paiement sécurisé' : 'Secure Payment' },
                { icon: '↩️', text: selectedLang === 'ar' ? 'إرجاع مجاني' : selectedLang === 'fr' ? 'Retour gratuit' : 'Free Returns' },
                { icon: '⭐', text: selectedLang === 'ar' ? 'جودة مضمونة' : selectedLang === 'fr' ? 'Qualité garantie' : 'Quality Guaranteed' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: '#475569', fontWeight: 600 }}>
                  <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            {/* Benefits */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1.5rem', padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
              {content.benefits.map((b, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '2rem 1.5rem', borderRadius: '1rem', background: '#fff', border: '1px solid #f1f5f9', transition: 'all 0.3s' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{b.icon}</div>
                  <EditableText
                    tag="h3"
                    value={b.title}
                    onChange={(v: string) => { const n = [...content.benefits]; n[i] = { ...n[i], title: v }; setContent({ ...content, benefits: n }); }}
                    style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}
                  />
                  <EditableText
                    tag="p"
                    value={b.text}
                    onChange={(v: string) => { const n = [...content.benefits]; n[i] = { ...n[i], text: v }; setContent({ ...content, benefits: n }); }}
                    className="block"
                    style={{ color: '#64748b', lineHeight: 1.6 }}
                  />
                </div>
              ))}
            </div>

            {/* Product Details */}
            <div id="details" style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', alignItems: 'center' }}>
              {productImage && (
                <img src={productImage} alt="" style={{ flex: 1, minWidth: '280px', maxWidth: '500px', borderRadius: '1.5rem', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', objectFit: 'cover' }} />
              )}
              <div style={{ flex: 1, minWidth: '280px' }}>
                <h2 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '1rem', color: '#0f172a', lineHeight: 1.2 }}>{selectedProduct?.name}</h2>
                <EditableText
                  tag="div"
                  value={content.description.replace(/\n/g, '<br/>')}
                  onChange={(v: string) => updateField('description', v)}
                  className="block"
                  style={{ color: '#475569', lineHeight: 1.9, whiteSpace: 'pre-line' }}
                />
                <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '1.5rem', padding: '1rem 1.5rem', background: 'linear-gradient(135deg,#fff7ed,#fef3c7)', borderRadius: '1rem', border: '1px solid #fed7aa' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 900, color: '#ea580c' }}>{selectedProduct?.price} DA</span>
                  {selectedProduct?.old_price && (
                    <span style={{ fontSize: '1.2rem', color: '#9ca3af', textDecoration: 'line-through' }}>{selectedProduct.old_price} DA</span>
                  )}
                </div>
              </div>
            </div>

            {/* Testimonials */}
            <div style={{ padding: '4rem 2rem', background: '#f8fafc' }}>
              <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '2.5rem', color: '#0f172a' }}>
                {selectedLang === 'ar' ? '⭐ آراء عملائنا' : selectedLang === 'fr' ? '⭐ Avis Clients' : '⭐ Customer Reviews'}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
                {content.testimonials.map((rev, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
                    <div style={{ color: '#f59e0b', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                      {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                    </div>
                    <EditableText
                      tag="p"
                      value={rev.text}
                      onChange={(v: string) => { const n = [...content.testimonials]; n[i] = { ...n[i], text: v }; setContent({ ...content, testimonials: n }); }}
                      className="block"
                      style={{ color: '#475569', fontStyle: 'italic', marginBottom: '0.75rem', lineHeight: 1.7 }}
                    />
                    <EditableText
                      tag="span"
                      value={rev.name}
                      onChange={(v: string) => { const n = [...content.testimonials]; n[i] = { ...n[i], name: v }; setContent({ ...content, testimonials: n }); }}
                      style={{ fontWeight: 700, color: '#0f172a' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Urgency */}
            <div style={{ background: 'linear-gradient(135deg,#dc2626,#ea580c)', color: '#fff', textAlign: 'center', padding: '1.25rem', fontSize: '1.2rem', fontWeight: 700, letterSpacing: '0.02em' }}>
              🔥 <EditableText value={content.urgency_text} onChange={(v: string) => updateField('urgency_text', v)} />
            </div>

            {/* Order Form */}
            <div id="order-form" style={{ padding: '4rem 2rem', background: 'linear-gradient(135deg,#0f172a,#1e293b)', color: '#fff' }}>
              <div style={{ maxWidth: '550px', margin: '0 auto' }}>
                <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                  📦 {fl.orderNow}
                </h2>
                <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '2rem', fontSize: '1rem' }}>
                  {fl.subtitle}
                </p>

                {/* Price display in form */}
                <div style={{ textAlign: 'center', marginBottom: '2rem', padding: '1.25rem', background: 'rgba(249,115,22,0.1)', borderRadius: '1rem', border: '1px solid rgba(249,115,22,0.2)' }}>
                  <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{selectedProduct?.name}</span>
                  <div style={{ marginTop: '0.5rem' }}>
                    {selectedProduct?.old_price && (
                      <span style={{ fontSize: '1.1rem', color: '#6b7280', textDecoration: 'line-through', marginRight: '0.75rem' }}>{selectedProduct.old_price} DA</span>
                    )}
                    <span style={{ fontSize: '2rem', fontWeight: 900, color: '#f97316' }}>{selectedProduct?.price} DA</span>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.35rem', color: '#cbd5e1' }}>{fl.name} *</label>
                  <input type="text" placeholder={fl.namePh} style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '1rem', outline: 'none' }} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.35rem', color: '#cbd5e1' }}>{fl.phone} *</label>
                  <input type="tel" placeholder={fl.phonePh} style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '1rem', outline: 'none' }} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.35rem', color: '#cbd5e1' }}>{fl.wilaya} *</label>
                  <input type="text" placeholder={fl.wilayaPh} style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '1rem', outline: 'none' }} />
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.35rem', color: '#cbd5e1' }}>{fl.address}</label>
                  <textarea placeholder={fl.addressPh} rows={2} style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '1rem', outline: 'none', resize: 'vertical' as const }} />
                </div>
                <button type="button" style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', border: 'none', borderRadius: '0.75rem', fontSize: '1.15rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem' }}>
                  ✅ {fl.submit}
                </button>

                {/* Trust icons under form */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1.5rem', fontSize: '0.85rem', color: '#64748b' }}>
                  <span>🔒 {selectedLang === 'ar' ? 'آمن' : 'Secure'}</span>
                  <span>🚚 {selectedLang === 'ar' ? 'سريع' : 'Fast'}</span>
                  <span>💯 {selectedLang === 'ar' ? 'مضمون' : 'Guaranteed'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
