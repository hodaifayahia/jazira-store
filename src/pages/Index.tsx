import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Truck, Shield, Headphones, Star, Grid3X3 } from 'lucide-react';
import { icons } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/LoadingSkeleton';
import { useCategories } from '@/hooks/useCategories';
import heroBanner from '@/assets/hero-banner-new.jpg';

const CATEGORY_COLORS = [
  'from-primary/20 to-primary/5 border-primary/20',
  'from-secondary/20 to-secondary/5 border-secondary/20',
  'from-accent to-accent/30 border-accent-foreground/20',
  'from-warning/20 to-warning/5 border-warning/20',
  'from-info/20 to-info/5 border-info/20',
];

const trustFeatures = [
  { icon: Truck, title: 'توصيل لجميع الولايات', desc: 'نوصل لـ 58 ولاية عبر الجزائر' },
  { icon: Shield, title: 'دفع آمن', desc: 'بريدي موب أو فليكسي' },
  { icon: Headphones, title: 'خدمة عملاء', desc: 'فريق متاح لمساعدتك دائماً' },
  { icon: Star, title: 'منتجات أصلية', desc: 'جودة مضمونة 100%' },
];

export default function IndexPage() {
  usePageTitle('DZ Store - متجرك الإلكتروني في الجزائر');

  const { data: products, isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  const { data: categoriesSettings, isLoading: categoriesLoading } = useCategories();

  const renderIcon = (iconName: string) => {
    const IconComponent = (icons as any)[iconName];
    return IconComponent ? <IconComponent className="w-7 h-7 text-foreground" /> : <Grid3X3 className="w-7 h-7 text-foreground" />;
  };

  return (
    <div className="min-h-screen">
      {/* ══════════════════ HERO ══════════════════ */}
      <section className="relative overflow-hidden min-h-[520px] md:min-h-[600px] flex items-center">
        <div className="absolute inset-0">
          <img src={heroBanner} alt="DZ Store" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-l from-foreground/90 via-foreground/70 to-foreground/30" />
        </div>
        <div className="container relative z-10 py-16 md:py-24">
          <div className="max-w-xl space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full px-4 py-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-cairo text-sm text-primary-foreground/90">شحن مجاني للطلبات فوق 5000 دج</span>
            </div>
            <h1 className="font-cairo font-extrabold text-4xl md:text-6xl text-background leading-[1.15] tracking-tight">
              اكتشف <span className="text-primary">أفضل</span> المنتجات
              <br />في مكان واحد
            </h1>
            <p className="font-cairo text-background/75 text-lg md:text-xl leading-relaxed max-w-md">
              تشكيلة واسعة من الأدوات المنزلية، منتجات الزينة والإكسسوارات بأسعار لا تُقاوم.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/products">
                <Button size="lg" className="font-cairo font-bold gap-2 text-base px-8 h-12 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                  تسوّق الآن
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/track">
                <Button size="lg" variant="outline" className="font-cairo font-semibold text-base px-8 h-12 border-background/30 text-background hover:bg-background/10 hover:text-background">
                  تتبع طلبك
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60H1440V30C1440 30 1320 0 1080 0C840 0 720 30 480 30C240 30 120 0 0 0V60Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* ══════════════════ TRUST BAR ══════════════════ */}
      <section className="border-b bg-card">
        <div className="container py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {trustFeatures.map((f, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-cairo font-bold text-sm text-foreground truncate">{f.title}</p>
                  <p className="font-cairo text-xs text-muted-foreground truncate">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ CATEGORIES ══════════════════ */}
      <section className="container py-14">
        <div className="text-center mb-10">
          <h2 className="font-cairo font-extrabold text-3xl md:text-4xl text-foreground mb-3">تصفّح حسب الفئة</h2>
          <p className="font-cairo text-muted-foreground text-base max-w-md mx-auto">اختر الفئة التي تناسبك واكتشف أحدث المنتجات</p>
        </div>
        {categoriesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : categoriesSettings && categoriesSettings.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categoriesSettings.map((cat, i) => {
              const colorClass = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
              return (
                <Link key={cat.name} to={`/products?category=${encodeURIComponent(cat.name)}`}>
                  <div className={`relative rounded-xl border bg-gradient-to-br ${colorClass} p-6 text-center group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer`}>
                    <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-card/80 backdrop-blur flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                      {renderIcon(cat.icon)}
                    </div>
                    <h3 className="font-cairo font-bold text-base text-foreground">{cat.name}</h3>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="font-cairo text-muted-foreground">لا توجد فئات بعد</p>
          </div>
        )}
      </section>

      {/* ══════════════════ FEATURED PRODUCTS ══════════════════ */}
      <section className="bg-muted/40">
        <div className="container py-14">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-cairo font-extrabold text-3xl md:text-4xl text-foreground mb-2">أحدث المنتجات</h2>
              <p className="font-cairo text-muted-foreground text-base">تشكيلة مختارة من أحدث ما وصلنا</p>
            </div>
            <Link to="/products" className="hidden sm:block">
              <Button variant="outline" className="font-cairo font-semibold gap-2 border-foreground/20 hover:bg-foreground hover:text-background transition-colors">
                عرض الكل <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          {isLoading ? (
            <ProductGridSkeleton />
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {products.map(p => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  price={Number(p.price)}
                  image={p.images?.[0] || ''}
                  category={p.category}
                  stock={p.stock ?? 0}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="font-cairo text-muted-foreground text-lg">لا توجد منتجات حالياً. يتم إضافة منتجات جديدة قريباً!</p>
            </div>
          )}
          <div className="sm:hidden text-center mt-8">
            <Link to="/products">
              <Button className="font-cairo font-semibold gap-2 w-full max-w-xs">
                عرض كل المنتجات <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA BANNER ══════════════════ */}
      <section className="container py-14">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-l from-primary via-primary/90 to-primary/80 p-8 md:p-14">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-background rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-background rounded-full translate-x-1/3 translate-y-1/3" />
          </div>
          <div className="relative z-10 text-center max-w-lg mx-auto">
            <h2 className="font-cairo font-extrabold text-3xl md:text-4xl text-primary-foreground mb-4">
              لا تفوّت العروض الحصرية!
            </h2>
            <p className="font-cairo text-primary-foreground/80 text-lg mb-6">
              تابعنا على فيسبوك لتكون أول من يعرف عن المنتجات الجديدة والخصومات المميزة.
            </p>
            <Link to="/products">
              <Button size="lg" variant="secondary" className="font-cairo font-bold text-base px-10 h-12 shadow-lg">
                تسوّق الآن
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
