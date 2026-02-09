import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreLogo } from '@/hooks/useStoreLogo';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  const { data: logoUrl } = useStoreLogo();

  const { data: settings } = useQuery({
    queryKey: ['footer-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('*').in('key', [
        'store_name', 'footer_description', 'footer_phone', 'footer_email', 'footer_address', 'facebook_url'
      ]);
      const map: Record<string, string> = {};
      data?.forEach(s => { map[s.key] = s.value || ''; });
      return map;
    },
  });

  const storeName = settings?.store_name || 'DZ Store';
  const description = settings?.footer_description || 'متجرك الإلكتروني الأول في الجزائر للأدوات المنزلية، منتجات الزينة والإكسسوارات.';
  const phone = settings?.footer_phone;
  const email = settings?.footer_email;
  const address = settings?.footer_address || 'الجزائر';

  return (
    <footer className="bg-foreground text-background mt-auto">
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              {logoUrl ? (
                <img src={logoUrl} alt={storeName} className="w-8 h-8 rounded object-contain bg-background/10 p-0.5" />
              ) : (
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-cairo font-bold text-sm">DZ</span>
                </div>
              )}
              <h3 className="font-cairo font-bold text-lg">{storeName}</h3>
            </div>
            <p className="text-background/70 font-cairo text-sm">{description}</p>
          </div>
          <div>
            <h3 className="font-cairo font-bold text-lg mb-3">روابط سريعة</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/products" className="text-background/70 hover:text-background font-cairo text-sm transition-colors">المنتجات</Link>
              <Link to="/track" className="text-background/70 hover:text-background font-cairo text-sm transition-colors">تتبع الطلب</Link>
              <Link to="/cart" className="text-background/70 hover:text-background font-cairo text-sm transition-colors">السلة</Link>
            </nav>
          </div>
          <div>
            <h3 className="font-cairo font-bold text-lg mb-3">تواصل معنا</h3>
            <div className="space-y-2">
              {phone && (
                <a href={`tel:${phone}`} className="flex items-center gap-2 text-background/70 hover:text-background font-cairo text-sm transition-colors">
                  <Phone className="w-4 h-4" /> <span className="font-roboto" dir="ltr">{phone}</span>
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="flex items-center gap-2 text-background/70 hover:text-background font-cairo text-sm transition-colors">
                  <Mail className="w-4 h-4" /> <span className="font-roboto" dir="ltr">{email}</span>
                </a>
              )}
              <div className="flex items-center gap-2 text-background/70 font-cairo text-sm">
                <MapPin className="w-4 h-4 shrink-0" /> {address}
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-background/20 mt-8 pt-6 text-center">
          <p className="text-background/50 font-cairo text-sm">© {new Date().getFullYear()} {storeName}. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
