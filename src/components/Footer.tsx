import { Link } from 'react-router-dom';
import { useStoreLogo } from '@/hooks/useStoreLogo';

export default function Footer() {
  const { data: logoUrl } = useStoreLogo();

  return (
    <footer className="bg-foreground text-background mt-auto">
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              {logoUrl ? (
                <img src={logoUrl} alt="DZ Store" className="w-8 h-8 rounded object-contain bg-background/10 p-0.5" />
              ) : (
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-cairo font-bold text-sm">DZ</span>
                </div>
              )}
              <h3 className="font-cairo font-bold text-lg">DZ Store</h3>
            </div>
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
            <p className="text-background/70 font-cairo text-sm">الجزائر</p>
          </div>
        </div>
        <div className="border-t border-background/20 mt-8 pt-6 text-center">
          <p className="text-background/50 font-cairo text-sm">© {new Date().getFullYear()} DZ Store. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
