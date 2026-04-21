import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreLogo } from '@/hooks/useStoreLogo';
import { Phone, Mail, MapPin, ChevronLeft, Heart, Download, Shield, Headphones, Facebook, Instagram, Twitter } from 'lucide-react';
import { useTranslation } from '@/i18n';

export default function Footer() {
  const { data: logoUrl } = useStoreLogo();
  const { t } = useTranslation();

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

  const storeName = settings?.store_name || 'SloutionsHub';
  const description = settings?.footer_description || 'منصتك الموثوقة للمنتجات الرقمية والاشتراكات المميزة. جودة عالية، تسليم فوري، ودعم متواصل.';
  const phone = settings?.footer_phone;
  const email = settings?.footer_email;
  const address = settings?.footer_address || 'Online';
  const facebookUrl = settings?.facebook_url;
  const instagramUrl = settings?.instagram_url;

  const quickLinks = [
    { to: '/products', label: t('public.nav.products') },
    { to: '/track', label: t('public.nav.track') },
    { to: '/cart', label: t('public.footer.cart') },
    { to: '/wishlist', label: t('public.nav.wishlist') },
    { to: '/about', label: t('public.nav.about') },
  ];

  const trustBadges = [
    { icon: Download, label: t('public.footer.badge.instantDelivery') },
    { icon: Shield, label: t('public.footer.badge.securePayment') },
    { icon: Headphones, label: t('public.footer.badge.support') },
  ];

  return (
    <footer className="bg-[hsl(230,25%,5%)] text-white/90 mt-auto border-t border-border/30">
      {/* Trust badges */}
      <div className="border-b border-white/5">
        <div className="container py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {trustBadges.map((badge, i) => (
              <div key={i} className="flex items-center gap-3 justify-center sm:justify-start">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
                  <badge.icon className="w-5 h-5 text-violet-400" />
                </div>
                <span className="font-medium text-sm text-white/70">{badge.label}</span>
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
                <img src={logoUrl} alt={storeName} className="w-10 h-10 rounded-xl object-contain bg-white/10 p-0.5" />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <span className="text-white font-bold text-sm">ج</span>
                </div>
              )}
              <h3 className="font-cairo font-bold text-xl">{storeName}</h3>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-sm mb-5">{description}</p>
            {/* Social links */}
            <div className="flex items-center gap-2">
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-violet-500/20 hover:text-violet-400 transition-colors"
                  aria-label="فيسبوك"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-violet-500/20 hover:text-violet-400 transition-colors"
                  aria-label="انستغرام"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              <a
                href="#"
                className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-violet-500/20 hover:text-violet-400 transition-colors"
                aria-label="تويتر"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div className="lg:col-span-3">
            <h3 className="font-semibold text-sm text-white/50 mb-4">{t('public.footer.quickLinks')}</h3>
            <nav className="flex flex-col gap-2.5">
              {quickLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-1.5 text-white/50 hover:text-violet-400 text-sm transition-colors group"
                >
                  <ChevronLeft className="w-3.5 h-3.5 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div className="lg:col-span-4">
            <h3 className="font-semibold text-sm text-white/50 mb-4">{t('public.footer.contact')}</h3>
            <div className="space-y-3">
              {phone && (
                <a href={`tel:${phone}`} className="flex items-center gap-2.5 text-white/50 hover:text-violet-400 text-sm transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-violet-500/20 transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <span dir="ltr">{phone}</span>
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="flex items-center gap-2.5 text-white/50 hover:text-violet-400 text-sm transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-violet-500/20 transition-colors">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <span dir="ltr">{email}</span>
                </a>
              )}
              <div className="flex items-center gap-2.5 text-white/50 text-sm">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                {address}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/30 text-xs">
            {settings?.copyright_text || `© ${new Date().getFullYear()} ${storeName}. جميع الحقوق محفوظة.`}
          </p>
          <p className="text-white/20 text-[11px] flex items-center gap-1">
            صنع بـ <Heart className="w-3 h-3 text-violet-500 fill-violet-500" /> بواسطة SloutionsHub
          </p>
        </div>
      </div>
    </footer>
  );
}
