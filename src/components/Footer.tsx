import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Facebook } from 'lucide-react';

export default function Footer() {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('*');
      const map: Record<string, string> = {};
      data?.forEach(s => { map[s.key] = s.value || ''; });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  const facebookUrl = settings?.facebook_url || '#';

  return (
    <footer className="bg-foreground text-background mt-auto">
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-cairo font-bold text-lg mb-3">DZ Store</h3>
            <p className="text-background/70 font-cairo text-sm">
              متجرك الإلكتروني الأول في الجزائر للأدوات المنزلية، منتجات الزينة والإكسسوارات.
            </p>
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
            <p className="text-background/70 font-cairo text-sm mb-3">الجزائر</p>
            {facebookUrl && facebookUrl !== '#' && (
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-background/70 hover:text-background transition-colors">
                <Facebook className="w-5 h-5" />
                <span className="font-cairo text-sm">فيسبوك</span>
              </a>
            )}
          </div>
        </div>
        <div className="border-t border-background/20 mt-8 pt-6 text-center">
          <p className="text-background/50 font-cairo text-sm">© {new Date().getFullYear()} DZ Store. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
