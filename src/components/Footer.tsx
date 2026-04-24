import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreLogo } from '@/hooks/useStoreLogo';
import { Phone, Mail, MapPin, ChevronLeft, Facebook, Instagram, Heart, ShoppingCart, Truck, Shield, Headphones } from 'lucide-react';

export default function Footer() {
  const { data: logoUrl } = useStoreLogo();

  const { data: settings } = useQuery({
    queryKey: ['footer-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('*').in('key', [
        'store_name', 'footer_description', 'footer_phone', 'footer_email', 'footer_address', 'facebook_url', 'instagram_url', 'copyright_text'
      ]);
      const map: Record<string, string> = {};
      data?.forEach(s => { map[s.key] = s.value || ''; });
      return map;
    },
  });

  const storeName = settings?.store_name || 'جزيرة الطبيعة';
  const description = settings?.footer_description || 'أجود أنواع التمور والعسل الطبيعي والهدايا الفاخرة. منتجات طبيعية 100% بجودة استثنائية.';
  const phone = settings?.footer_phone;
  const email = settings?.footer_email;
  const address = settings?.footer_address || 'الجزائر';
  const facebookUrl = settings?.facebook_url;
  const instagramUrl = settings?.instagram_url;

  const quickLinks = [
    { to: '/products', label: 'المنتجات' },
    { to: '/track', label: 'تتبع الطلب' },
    { to: '/cart', label: 'السلة' },
    { to: '/wishlist', label: 'المفضلة' },
    { to: '/about', label: 'من نحن' },
  ];

  const trustBadges = [
    { icon: Truck, label: 'توصيل لكل الولايات' },
    { icon: Shield, label: 'دفع آمن عند الاستلام' },
    { icon: Headphones, label: 'خدمة عملاء متميزة' },
  ];

  return (
    <footer className="bg-foreground text-background mt-auto">
      {/* Trust badges */}
      <div className="border-b border-background/10">
        <div className="container py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {trustBadges.map((badge, i) => (
              <div key={i} className="flex items-center gap-3 justify-center sm:justify-start">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <badge.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-cairo font-semibold text-sm text-background/80">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container py-10 md:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8">

          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-5">
            <div className="flex items-center gap-2.5 mb-4">
              {logoUrl ? (
                <img src={logoUrl} alt={storeName} className="w-10 h-10 rounded-xl object-contain bg-background/10 p-0.5" />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-cairo font-bold text-sm">🌴</span>
                </div>
              )}
              <h3 className="font-cairo font-bold text-xl">{storeName}</h3>
            </div>
            <p className="text-background/50 font-cairo text-sm leading-relaxed max-w-sm mb-5">{description}</p>
            {/* Social links */}
            <div className="flex items-center gap-2">
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-background/10 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-background/10 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="lg:col-span-3">
            <h3 className="font-cairo font-bold text-sm uppercase tracking-wider text-background/40 mb-4">روابط سريعة</h3>
            <nav className="flex flex-col gap-2.5">
              {quickLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-1.5 text-background/60 hover:text-primary font-cairo text-sm transition-colors group"
                >
                  <ChevronLeft className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div className="lg:col-span-4">
            <h3 className="font-cairo font-bold text-sm uppercase tracking-wider text-background/40 mb-4">تواصل معنا</h3>
            <div className="space-y-3">
              {phone && (
                <a href={`tel:${phone}`} className="flex items-center gap-2.5 text-background/60 hover:text-primary font-cairo text-sm transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-background/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-roboto" dir="ltr">{phone}</span>
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="flex items-center gap-2.5 text-background/60 hover:text-primary font-cairo text-sm transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-background/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-roboto" dir="ltr">{email}</span>
                </a>
              )}
              <div className="flex items-center gap-2.5 text-background/60 font-cairo text-sm">
                <div className="w-8 h-8 rounded-lg bg-background/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                {address}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-background/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-background/40 font-cairo text-xs">
            {settings?.copyright_text || `© ${new Date().getFullYear()} ${storeName}. جميع الحقوق محفوظة.`}
          </p>
          <p className="text-background/30 font-cairo text-[11px] flex items-center gap-1">
            صنع بـ <Heart className="w-3 h-3 text-destructive fill-destructive" /> في الجزائر
          </p>
        </div>
      </div>
    </footer>
  );
}
