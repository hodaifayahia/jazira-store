import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/format';
import { useFacebookPixel } from '@/hooks/useFacebookPixel';

interface LandingContent {
  headline: string;
  subheadline: string;
  description: string;
  benefits: { icon: string; title: string; text: string }[];
  cta_primary: string;
  cta_secondary: string;
  testimonials: { name: string; text: string; rating: number }[];
  urgency_text: string;
  faq?: { question: string; answer: string }[];
}

interface OptionGroup {
  id: string;
  name: string;
  display_type: string;
  position: number | null;
  product_option_values: { id: string; label: string; color_hex: string | null; position: number | null }[];
}

interface ProductVariant {
  id: string;
  price: number;
  quantity: number;
  is_active: boolean | null;
  option_values: any;
  image_url: string | null;
}

const formLabels: Record<string, Record<string, string>> = {
  ar: { orderNow: 'اطلب الآن', name: 'الاسم الكامل', phone: 'رقم الهاتف', wilaya: 'الولاية', baladiya: 'البلدية', deliveryType: 'نوع التوصيل', office: 'إلى المكتب', home: 'إلى المنزل', address: 'العنوان', submit: 'تأكيد الطلب', subtitle: 'املأ النموذج وسنتواصل معك', namePh: 'أدخل اسمك', phonePh: '05XXXXXXXX', wilayaPh: 'اختر الولاية', baladiyaPh: 'اختر البلدية', addressPh: 'عنوان التوصيل', success: 'تم تسجيل طلبك بنجاح! سنتواصل معك قريباً ✅', secure: 'آمن', fast: 'سريع', guaranteed: 'مضمون', fastDelivery: 'توصيل سريع', securePayment: 'دفع آمن', freeReturns: 'إرجاع مجاني', qualityGuaranteed: 'جودة مضمونة', reviews: '⭐ آراء عملائنا', required: 'مطلوب', invalidPhone: 'رقم هاتف غير صحيح', selectVariant: 'يرجى اختيار جميع الخيارات', faq: 'أسئلة شائعة' },
  en: { orderNow: 'Order Now', name: 'Full Name', phone: 'Phone Number', wilaya: 'Wilaya', baladiya: 'City', deliveryType: 'Delivery Type', office: 'To Office', home: 'To Home', address: 'Address', submit: 'Confirm Order', subtitle: "Fill the form and we'll contact you", namePh: 'Enter your name', phonePh: '05XXXXXXXX', wilayaPh: 'Select wilaya', baladiyaPh: 'Select city', addressPh: 'Delivery address', success: 'Your order has been placed! We will contact you soon ✅', secure: 'Secure', fast: 'Fast', guaranteed: 'Guaranteed', fastDelivery: 'Fast Delivery', securePayment: 'Secure Payment', freeReturns: 'Free Returns', qualityGuaranteed: 'Quality Guaranteed', reviews: '⭐ Customer Reviews', required: 'Required', invalidPhone: 'Invalid phone number', selectVariant: 'Please select all options', faq: 'FAQ' },
  fr: { orderNow: 'Commander Maintenant', name: 'Nom complet', phone: 'Téléphone', wilaya: 'Wilaya', baladiya: 'Commune', deliveryType: 'Type de livraison', office: 'Au bureau', home: 'À domicile', address: 'Adresse', submit: 'Confirmer la commande', subtitle: 'Remplissez le formulaire et nous vous contacterons', namePh: 'Entrez votre nom', phonePh: '05XXXXXXXX', wilayaPh: 'Sélectionner wilaya', baladiyaPh: 'Sélectionner commune', addressPh: 'Adresse de livraison', success: 'Votre commande a été enregistrée ! Nous vous contacterons bientôt ✅', secure: 'Sécurisé', fast: 'Rapide', guaranteed: 'Garanti', fastDelivery: 'Livraison rapide', securePayment: 'Paiement sécurisé', freeReturns: 'Retour gratuit', qualityGuaranteed: 'Qualité garantie', reviews: '⭐ Avis Clients', required: 'Requis', invalidPhone: 'Numéro de téléphone invalide', selectVariant: 'Veuillez sélectionner toutes les options', faq: 'FAQ' },
};

export default function LandingPage() {
  const { id } = useParams<{ id: string }>();
  const { trackEvent } = useFacebookPixel();

  // Form state
  const [orderName, setOrderName] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [orderWilayaId, setOrderWilayaId] = useState('');
  const [orderBaladiya, setOrderBaladiya] = useState('');
  const [orderDeliveryType, setOrderDeliveryType] = useState('');
  const [orderAddress, setOrderAddress] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  // Fetch landing page
  const { data: page, isLoading } = useQuery({
    queryKey: ['landing-page', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 30,
  });

  // Fetch product
  const { data: product } = useQuery({
    queryKey: ['landing-product', page?.product_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, price, old_price, images, main_image_index, has_variants')
        .eq('id', page!.product_id)
        .single();
      return data;
    },
    enabled: !!page?.product_id,
    staleTime: 1000 * 60 * 30,
  });

  // Fetch option groups & variants
  const { data: optionGroups } = useQuery({
    queryKey: ['lp-option-groups', product?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('product_option_groups')
        .select('*, product_option_values(*)')
        .eq('product_id', product!.id)
        .order('position');
      return (data || []) as OptionGroup[];
    },
    enabled: !!product?.id && !!product?.has_variants,
    staleTime: 1000 * 60 * 30,
  });

  const { data: productVariants } = useQuery({
    queryKey: ['lp-variants', product?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', product!.id)
        .eq('is_active', true);
      return (data || []) as ProductVariant[];
    },
    enabled: !!product?.id && !!product?.has_variants,
    staleTime: 1000 * 60 * 30,
  });

  // Legacy variations
  const { data: legacyVariations } = useQuery({
    queryKey: ['lp-legacy-vars', product?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('product_variations')
        .select('*')
        .eq('product_id', product!.id)
        .eq('is_active', true);
      return data || [];
    },
    enabled: !!product?.id && !product?.has_variants,
    staleTime: 1000 * 60 * 30,
  });

  // Match variant
  useEffect(() => {
    if (!optionGroups || !productVariants || optionGroups.length === 0) {
      setSelectedVariantId(null);
      return;
    }
    if (Object.keys(selectedOptions).length < optionGroups.length) {
      setSelectedVariantId(null);
      return;
    }
    const match = productVariants.find(v => {
      const ov = v.option_values as Record<string, string>;
      return optionGroups.every(g => ov[g.name] === selectedOptions[g.name]);
    });
    setSelectedVariantId(match?.id || null);
  }, [selectedOptions, optionGroups, productVariants]);

  const activeVariant = productVariants?.find(v => v.id === selectedVariantId);
  const displayPrice = activeVariant?.price ?? product?.price ?? 0;

  // Fetch wilayas
  const { data: wilayas } = useQuery({
    queryKey: ['wilayas-lp'],
    queryFn: async () => {
      const { data } = await supabase.from('wilayas').select('*').eq('is_active', true).order('name');
      return data || [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const { data: baladiyat } = useQuery({
    queryKey: ['baladiyat-lp', orderWilayaId],
    queryFn: async () => {
      const { data } = await supabase.from('baladiyat').select('*').eq('wilaya_id', orderWilayaId).eq('is_active', true).order('name');
      return data || [];
    },
    enabled: !!orderWilayaId,
  });

  const content = page?.content as LandingContent | undefined;
  const lang = page?.language || 'ar';
  const fl = formLabels[lang] || formLabels.en;
  const isRtl = lang === 'ar';
  const selectedWilaya = wilayas?.find(w => w.id === orderWilayaId);

  const heroImage = (page?.generated_images as string[])?.[0] || page?.selected_image || product?.images?.[0];
  const detailImage = (page?.generated_images as string[])?.[1] || page?.selected_image || product?.images?.[0];
  const galleryImage = (page?.generated_images as string[])?.[2] || null;

  // Legacy grouped
  const legacyGrouped = (legacyVariations || []).reduce<Record<string, typeof legacyVariations>>((acc, v) => {
    if (!acc[v.variation_type]) acc[v.variation_type] = [];
    acc[v.variation_type]!.push(v);
    return acc;
  }, {});

  const hasVariantOptions = (product?.has_variants && optionGroups && optionGroups.length > 0) || (!product?.has_variants && Object.keys(legacyGrouped).length > 0);

  // FB Pixel: ViewContent on load
  useEffect(() => {
    if (product && content) {
      trackEvent('ViewContent', {
        content_name: product.name,
        content_ids: [product.id],
        content_type: 'product',
        value: product.price,
        currency: 'DZD',
      });
    }
  }, [product?.id]);

  useEffect(() => {
    if (content?.headline) {
      document.title = content.headline;
    }
  }, [content?.headline]);

  const handleOrderSubmit = async () => {
    if (!product || !id) return;
    const errors: Record<string, string> = {};
    if (!orderName.trim()) errors.name = fl.required;
    if (!orderPhone.trim()) errors.phone = fl.required;
    else if (!/^0[567]\d{8}$/.test(orderPhone)) errors.phone = fl.invalidPhone;
    if (!orderWilayaId) errors.wilaya = fl.required;
    if (product.has_variants && optionGroups && optionGroups.length > 0 && !selectedVariantId) {
      errors.variant = fl.selectVariant;
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setOrderSubmitting(true);
    try {
      const shippingCost = selectedWilaya
        ? (orderDeliveryType === 'home' ? Number(selectedWilaya.shipping_price_home) : Number(selectedWilaya.shipping_price))
        : 0;
      const total = displayPrice + shippingCost;

      trackEvent('InitiateCheckout', {
        content_ids: [product.id],
        num_items: 1,
        value: total,
        currency: 'DZD',
      });

      const { data: order, error } = await supabase.from('orders').insert({
        order_number: '',
        customer_name: orderName,
        customer_phone: orderPhone,
        wilaya_id: orderWilayaId || null,
        baladiya: orderBaladiya || null,
        delivery_type: orderDeliveryType || 'office',
        address: orderAddress || null,
        subtotal: displayPrice,
        shipping_cost: shippingCost,
        total_amount: total,
        payment_method: 'cod',
        landing_page_id: id,
      } as any).select().single();
      if (error) throw error;

      await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: product.id,
        variant_id: selectedVariantId || null,
        quantity: 1,
        unit_price: displayPrice,
      });

      trackEvent('Purchase', {
        content_ids: [product.id],
        content_type: 'product',
        value: total,
        currency: 'DZD',
        num_items: 1,
      });

      supabase.functions.invoke('telegram-notify', { body: { type: 'new_order', order_id: order.id } }).catch(() => {});

      setOrderSuccess(true);
    } catch (e: any) {
      console.error(e);
      setFormErrors({ submit: e.message || 'Error' });
    } finally {
      setOrderSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#fff' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #334155', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (!page || !content) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#94a3b8', fontFamily: 'system-ui' }}>
        <p>Page not found</p>
      </div>
    );
  }

  // Render variant selection
  const renderVariants = () => {
    if (product?.has_variants && optionGroups && optionGroups.length > 0) {
      return (
        <div style={{ marginBottom: '1.25rem' }}>
          {optionGroups.map(group => (
            <div key={group.id} style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.35rem', color: '#cbd5e1' }}>{group.name} *</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {(group.product_option_values || [])
                  .sort((a, b) => (a.position || 0) - (b.position || 0))
                  .map(val => {
                    const isSelected = selectedOptions[group.name] === val.label;
                    return (
                      <button
                        key={val.id}
                        type="button"
                        onClick={() => setSelectedOptions(prev => ({ ...prev, [group.name]: val.label }))}
                        style={{
                          padding: group.display_type === 'color' ? '0' : '0.5rem 1rem',
                          borderRadius: group.display_type === 'color' ? '50%' : '0.5rem',
                          width: group.display_type === 'color' ? '2.5rem' : 'auto',
                          height: group.display_type === 'color' ? '2.5rem' : 'auto',
                          border: isSelected ? '2px solid #f97316' : '1px solid #334155',
                          background: group.display_type === 'color' ? (val.color_hex || '#888') : (isSelected ? 'rgba(249,115,22,0.1)' : '#1e293b'),
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: isSelected ? 700 : 400,
                        }}
                        title={val.label}
                      >
                        {group.display_type !== 'color' && val.label}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
          {formErrors.variant && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>{formErrors.variant}</p>}
        </div>
      );
    }

    if (!product?.has_variants && Object.keys(legacyGrouped).length > 0) {
      return (
        <div style={{ marginBottom: '1.25rem' }}>
          {Object.entries(legacyGrouped).map(([type, vars]) => (
            <div key={type} style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.35rem', color: '#cbd5e1' }}>{type}</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {(vars || []).map(v => {
                  const isSelected = selectedOptions[type] === v.variation_value;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedOptions(prev => ({ ...prev, [type]: v.variation_value }))}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        border: isSelected ? '2px solid #f97316' : '1px solid #334155',
                        background: isSelected ? 'rgba(249,115,22,0.1)' : '#1e293b',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: isSelected ? 700 : 400,
                      }}
                    >
                      {v.variation_value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{ background: '#fff', color: '#1a1a1a', fontFamily: 'system-ui,-apple-system,sans-serif', margin: 0 }}>
      {/* Hero */}
      <div style={{ position: 'relative', minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}>
        {heroImage && (
          <img src={heroImage} alt={product?.name} loading="eager" fetchPriority="high" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.2),rgba(0,0,0,0.7))' }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: '#fff', padding: '3rem 2rem', maxWidth: '800px' }}>
          <h1 style={{ fontSize: 'clamp(2rem,6vw,4rem)', fontWeight: 900, marginBottom: '1.5rem', lineHeight: 1.1, textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>{content.headline}</h1>
          <p style={{ fontSize: '1.3rem', opacity: 0.9, marginBottom: '2.5rem', lineHeight: 1.6 }}>{content.subheadline}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#order-form" style={{ display: 'inline-block', padding: '1rem 2.5rem', borderRadius: '0.75rem', fontWeight: 700, fontSize: '1.1rem', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 20px rgba(249,115,22,0.4)' }}>
              {content.cta_primary}
            </a>
            <a href="#details" style={{ display: 'inline-block', padding: '1rem 2.5rem', borderRadius: '0.75rem', fontWeight: 700, fontSize: '1.1rem', border: '2px solid rgba(255,255,255,0.6)', color: '#fff', textDecoration: 'none' }}>
              {content.cta_secondary}
            </a>
          </div>
        </div>
      </div>

      {/* Trust bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem', padding: '1.5rem 2rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        {[
          { icon: '🚚', text: fl.fastDelivery },
          { icon: '🛡️', text: fl.securePayment },
          { icon: '↩️', text: fl.freeReturns },
          { icon: '⭐', text: fl.qualityGuaranteed },
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
          <div key={i} style={{ textAlign: 'center', padding: '2rem 1.5rem', borderRadius: '1rem', background: '#fff', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{b.icon}</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>{b.title}</h3>
            <p style={{ color: '#64748b', lineHeight: 1.6 }}>{b.text}</p>
          </div>
        ))}
      </div>

      {/* Product Details */}
      <div id="details" style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', alignItems: 'center' }}>
        {detailImage && (
          <img src={detailImage} alt="" loading="lazy" style={{ flex: 1, minWidth: '280px', maxWidth: '500px', borderRadius: '1.5rem', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', objectFit: 'cover' }} />
        )}
        <div style={{ flex: 1, minWidth: '280px' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '1rem', color: '#0f172a', lineHeight: 1.2 }}>{product?.name}</h2>
          <div style={{ color: '#475569', lineHeight: 1.9, whiteSpace: 'pre-line' }} dangerouslySetInnerHTML={{ __html: content.description.replace(/\n/g, '<br/>') }} />
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '1.5rem', padding: '1rem 1.5rem', background: 'linear-gradient(135deg,#fff7ed,#fef3c7)', borderRadius: '1rem', border: '1px solid #fed7aa' }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: '#ea580c' }}>{displayPrice} DA</span>
            {product?.old_price && (
              <span style={{ fontSize: '1.2rem', color: '#9ca3af', textDecoration: 'line-through' }}>{product.old_price} DA</span>
            )}
          </div>
        </div>
      </div>

      {/* Gallery */}
      {galleryImage && (
        <div style={{ padding: '0 2rem 4rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: '1rem' }}>
            {[heroImage, detailImage, galleryImage].filter(Boolean).map((img, i) => (
              <img key={i} src={img!} alt="" loading="lazy" style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '1rem' }} />
            ))}
          </div>
        </div>
      )}

      {/* Testimonials */}
      <div style={{ padding: '4rem 2rem', background: '#f8fafc' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '2.5rem', color: '#0f172a' }}>{fl.reviews}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
          {content.testimonials.map((rev, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
              <div style={{ color: '#f59e0b', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
              </div>
              <p style={{ color: '#475569', fontStyle: 'italic', marginBottom: '0.75rem', lineHeight: 1.7 }}>{rev.text}</p>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{rev.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      {content.faq && content.faq.length > 0 && (
        <div style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '2rem', color: '#0f172a' }}>
            ❓ {fl.faq}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {content.faq.map((item, i) => (
              <div key={i} style={{ background: '#f8fafc', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', fontSize: '1.05rem' }}>{item.question}</h3>
                <p style={{ color: '#64748b', lineHeight: 1.7 }}>{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Urgency */}
      <div style={{ background: 'linear-gradient(135deg,#dc2626,#ea580c)', color: '#fff', textAlign: 'center', padding: '1.25rem', fontSize: '1.2rem', fontWeight: 700 }}>
        🔥 {content.urgency_text}
      </div>

      {/* Order Form */}
      <div id="order-form" style={{ padding: '4rem 2rem', background: 'linear-gradient(135deg,#0f172a,#1e293b)', color: '#fff' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>📦 {fl.orderNow}</h2>
          <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '2rem' }}>{fl.subtitle}</p>

          {/* Price */}
          <div style={{ textAlign: 'center', marginBottom: '2rem', padding: '1.25rem', background: 'rgba(249,115,22,0.1)', borderRadius: '1rem', border: '1px solid rgba(249,115,22,0.2)' }}>
            <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{product?.name}</span>
            <div style={{ marginTop: '0.5rem' }}>
              {product?.old_price && (
                <span style={{ fontSize: '1.1rem', color: '#6b7280', textDecoration: 'line-through', marginRight: '0.75rem' }}>{product.old_price} DA</span>
              )}
              <span style={{ fontSize: '2rem', fontWeight: 900, color: '#f97316' }}>{displayPrice} DA</span>
            </div>
          </div>

          {orderSuccess ? (
            <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(34,197,94,0.1)', borderRadius: '1rem', border: '1px solid rgba(34,197,94,0.3)' }}>
              <div style={{ width: '3rem', height: '3rem', color: '#22c55e', margin: '0 auto 1rem', fontSize: '3rem' }}>✅</div>
              <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#22c55e' }}>{fl.success}</p>
            </div>
          ) : (
            <>
              {/* Variants */}
              {renderVariants()}

              {/* Name */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.35rem', color: '#cbd5e1' }}>{fl.name} *</label>
                <input type="text" value={orderName} onChange={e => setOrderName(e.target.value)} placeholder={fl.namePh} style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: formErrors.name ? '2px solid #ef4444' : '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '1rem', outline: 'none' }} />
                {formErrors.name && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>{formErrors.name}</p>}
              </div>
              {/* Phone */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.35rem', color: '#cbd5e1' }}>{fl.phone} *</label>
                <input type="tel" value={orderPhone} onChange={e => setOrderPhone(e.target.value)} placeholder={fl.phonePh} dir="ltr" style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: formErrors.phone ? '2px solid #ef4444' : '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '1rem', outline: 'none' }} />
                {formErrors.phone && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>{formErrors.phone}</p>}
              </div>
              {/* Wilaya */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.35rem', color: '#cbd5e1' }}>{fl.wilaya} *</label>
                <select value={orderWilayaId} onChange={e => { setOrderWilayaId(e.target.value); setOrderBaladiya(''); setOrderDeliveryType(''); }} style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: formErrors.wilaya ? '2px solid #ef4444' : '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '1rem', outline: 'none' }}>
                  <option value="">{fl.wilayaPh}</option>
                  {wilayas?.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                {formErrors.wilaya && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>{formErrors.wilaya}</p>}
              </div>
              {/* Baladiya */}
              {orderWilayaId && baladiyat && baladiyat.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.35rem', color: '#cbd5e1' }}>{fl.baladiya}</label>
                  <select value={orderBaladiya} onChange={e => setOrderBaladiya(e.target.value)} style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '1rem', outline: 'none' }}>
                    <option value="">{fl.baladiyaPh}</option>
                    {baladiyat.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
              )}
              {/* Delivery Type */}
              {orderWilayaId && selectedWilaya && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.35rem', color: '#cbd5e1' }}>{fl.deliveryType}</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <button type="button" onClick={() => setOrderDeliveryType('office')} style={{ padding: '1rem', borderRadius: '0.75rem', border: orderDeliveryType === 'office' ? '2px solid #f97316' : '1px solid #334155', background: orderDeliveryType === 'office' ? 'rgba(249,115,22,0.1)' : '#1e293b', color: '#fff', cursor: 'pointer', textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{fl.office}</div>
                      <div style={{ color: '#f97316', fontWeight: 800 }}>{formatPrice(Number(selectedWilaya.shipping_price))}</div>
                    </button>
                    <button type="button" onClick={() => setOrderDeliveryType('home')} style={{ padding: '1rem', borderRadius: '0.75rem', border: orderDeliveryType === 'home' ? '2px solid #f97316' : '1px solid #334155', background: orderDeliveryType === 'home' ? 'rgba(249,115,22,0.1)' : '#1e293b', color: '#fff', cursor: 'pointer', textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{fl.home}</div>
                      <div style={{ color: '#f97316', fontWeight: 800 }}>{formatPrice(Number(selectedWilaya.shipping_price_home))}</div>
                    </button>
                  </div>
                </div>
              )}
              {/* Address */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.35rem', color: '#cbd5e1' }}>{fl.address}</label>
                <textarea value={orderAddress} onChange={e => setOrderAddress(e.target.value)} placeholder={fl.addressPh} rows={2} style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '1rem', outline: 'none', resize: 'vertical' }} />
              </div>
              {/* Submit error */}
              {formErrors.submit && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '0.5rem', textAlign: 'center' }}>{formErrors.submit}</p>}
              {/* Submit */}
              <button type="button" onClick={handleOrderSubmit} disabled={orderSubmitting} style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', border: 'none', borderRadius: '0.75rem', fontSize: '1.15rem', fontWeight: 700, cursor: orderSubmitting ? 'not-allowed' : 'pointer', opacity: orderSubmitting ? 0.7 : 1, marginTop: '0.5rem' }}>
                {orderSubmitting ? '...' : `✅ ${fl.submit}`}
              </button>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1.5rem', fontSize: '0.85rem', color: '#64748b' }}>
            <span>🔒 {fl.secure}</span>
            <span>🚚 {fl.fast}</span>
            <span>💯 {fl.guaranteed}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
