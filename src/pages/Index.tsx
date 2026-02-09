import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Home, Sparkles, Watch, ArrowLeft, ShoppingBag, Gift, Star, Heart, Shirt,
  Laptop, Smartphone, Car, Utensils, Baby, Headphones, Camera, Sofa, Dumbbell, Palette,
  Book, Gem, Zap, Flame, Leaf, Music, Plane, Pizza, Coffee, Glasses, Footprints, Dog,
  Wrench, Gamepad2, Crown, Flower2, Bike, Briefcase, Stethoscope,
  Truck, Shield, Clock, HeadphonesIcon, BadgeCheck, MapPin, CreditCard,
  ChevronLeft, Search, TrendingUp, Award,
  type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProductCard from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/LoadingSkeleton';
import { useCategories } from '@/hooks/useCategories';
import heroBannerFallback from '@/assets/hero-banner.jpg';

const ICON_MAP: Record<string, LucideIcon> = {
  Home, Sparkles, Watch, ShoppingBag, Gift, Star, Heart, Shirt,
  Laptop, Smartphone, Car, Utensils, Baby, Headphones, Camera, Sofa, Dumbbell, Palette,
  Book, Gem, Zap, Flame, Leaf, Music, Plane, Pizza, Coffee, Glasses, Footprints, Dog,
  Wrench, Gamepad2, Crown, Flower2, Bike, Briefcase, Stethoscope,
};

export default function IndexPage() {
  const { data: categoriesData } = useCategories();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch ALL active products for different sections
  const { data: allProducts, isLoading } = useQuery({
    queryKey: ['all-active-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Derived product lists
  const newestProducts = allProducts?.slice(0, 8) || [];
  const mostExpensive = [...(allProducts || [])].sort((a, b) => Number(b.price) - Number(a.price)).slice(0, 4);
  const bestProducts = [...(allProducts || [])].sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0)).slice(0, 4);

  // Fetch hero banners
  const { data: heroBanners } = useQuery({
    queryKey: ['hero-banners'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('key, value').in('key', ['hero_banners', 'hero_banner']);
      const map: Record<string, string> = {};
      data?.forEach(s => { map[s.key] = s.value || ''; });
      if (map.hero_banners) {
        try {
          const parsed = JSON.parse(map.hero_banners) as string[];
          if (parsed.length > 0) return parsed;
        } catch { /* fallback */ }
      }
      if (map.hero_banner) return [map.hero_banner];
      return [heroBannerFallback];
    },
  });

  // Fetch product images for the product carousel
  const productImages = allProducts?.flatMap(p => p.images || []).filter(Boolean).slice(0, 8) || [];

  const bannerImages = heroBanners || [heroBannerFallback];

  // Hero Embla carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, direction: 'rtl' }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Product images carousel
  const [prodCarouselRef, prodCarouselApi] = useEmblaCarousel({ loop: true, direction: 'rtl', align: 'start' }, [
    Autoplay({ delay: 3000, stopOnInteraction: false }),
  ]);
  const [prodSelectedIndex, setProdSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  const onProdSelect = useCallback(() => {
    if (!prodCarouselApi) return;
    setProdSelectedIndex(prodCarouselApi.selectedScrollSnap());
  }, [prodCarouselApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!prodCarouselApi) return;
    prodCarouselApi.on('select', onProdSelect);
    onProdSelect();
  }, [prodCarouselApi, onProdSelect]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const trustItems = [
    { icon: Truck, label: 'توصيل لجميع الولايات', desc: '58 ولاية' },
    { icon: Shield, label: 'دفع آمن', desc: 'بريدي موب وفليكسي' },
    { icon: Clock, label: 'توصيل سريع', desc: '24-72 ساعة' },
    { icon: HeadphonesIcon, label: 'خدمة العملاء', desc: 'دعم متواصل' },
  ];

  const whyUsItems = [
    { icon: BadgeCheck, title: 'جودة مضمونة', desc: 'نختار لكم أفضل المنتجات بعناية فائقة لضمان رضاكم التام.' },
    { icon: MapPin, title: 'توصيل وطني', desc: 'نوصّل طلباتكم إلى جميع ولايات الوطن بسرعة وأمان.' },
    { icon: CreditCard, title: 'أسعار تنافسية', desc: 'أسعار مناسبة للجميع مع عروض وخصومات حصرية.' },
  ];

  const renderProductGrid = (products: typeof newestProducts) => (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
      {products.map(p => (
        <ProductCard
          key={p.id}
          id={p.id}
          name={p.name}
          price={Number(p.price)}
          image={p.images?.[p.main_image_index ?? 0] || p.images?.[0] || ''}
          images={p.images || []}
          mainImageIndex={p.main_image_index ?? 0}
          category={p.category || []}
          stock={p.stock ?? 0}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">

      {/* ─── Hero Carousel ─── */}
      <section className="relative isolate overflow-hidden min-h-[520px] md:min-h-[600px]">
        {/* Animated floating elements */}
        <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-primary/10 blur-2xl animate-pulse" />
          <div className="absolute bottom-32 right-20 w-48 h-48 rounded-full bg-secondary/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full bg-primary/5 blur-xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="absolute inset-0" ref={emblaRef}>
          <div className="flex h-full" style={{ direction: 'ltr' }}>
            {bannerImages.map((img, i) => (
              <div key={i} className="flex-[0_0_100%] min-w-0 relative min-h-[520px] md:min-h-[600px]">
                <img src={img} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-l from-foreground/95 via-foreground/75 to-foreground/20 z-[2]" />

        <div className="container relative z-10 flex items-center min-h-[520px] md:min-h-[600px] py-24 md:py-32">
          {/* Glassmorphism card */}
          <div className="max-w-xl space-y-6 bg-foreground/10 backdrop-blur-md rounded-3xl p-8 md:p-10 border border-background/10">
            <span className="inline-block font-cairo text-sm font-semibold tracking-wide text-primary bg-primary/20 backdrop-blur-sm rounded-full px-4 py-1.5 animate-fade-in">
              🇩🇿 أفضل المنتجات في الجزائر
            </span>
            <h1 className="font-cairo font-extrabold text-4xl sm:text-5xl lg:text-6xl text-background leading-[1.15] tracking-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
              مرحباً بك في{' '}
              <span className="text-primary drop-shadow-[0_0_20px_hsl(var(--primary)/0.4)]">DZ Store</span>
            </h1>
            <p className="font-cairo text-background/75 text-lg sm:text-xl leading-relaxed max-w-md animate-fade-in" style={{ animationDelay: '0.2s' }}>
              أفضل المنتجات المنزلية، الزينة والإكسسوارات بأسعار مناسبة مع التوصيل لجميع الولايات.
            </p>

            {/* Enhanced Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-md animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="relative flex-1 group">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن منتج..."
                  className="pr-11 font-cairo bg-background/95 backdrop-blur-sm border-background/20 rounded-2xl h-14 text-base shadow-lg shadow-primary/10 focus:shadow-primary/20 focus:ring-primary/30 transition-shadow"
                />
              </div>
              <Button type="submit" size="lg" className="font-cairo font-bold rounded-2xl h-14 px-8 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                بحث
              </Button>
            </form>

            <div className="flex flex-wrap items-center gap-3 pt-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Link to="/products">
                <Button size="lg" className="font-cairo font-bold text-base px-8 h-12 gap-2 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all">
                  تسوّق الآن
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/track">
                <Button size="lg" className="font-cairo font-semibold text-base px-8 h-12 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg shadow-secondary/25 hover:shadow-secondary/40 hover:scale-[1.02] transition-all">
                  تتبع طلبك
                </Button>
              </Link>
              {allProducts && allProducts.length > 0 && (
                <span className="font-cairo text-sm text-background/60 bg-background/10 backdrop-blur-sm rounded-full px-3 py-1.5">
                  +{allProducts.length} منتج
                </span>
              )}
            </div>
          </div>
        </div>

        {bannerImages.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {bannerImages.map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i === selectedIndex ? 'bg-primary w-8' : 'bg-background/50 hover:bg-background/80'
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* ─── Trust Bar ─── */}
      <section className="border-b bg-card">
        <div className="container py-5 md:py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-6">
            {trustItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-cairo font-semibold text-sm text-foreground truncate">{item.label}</p>
                  <p className="font-cairo text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Product Images Carousel ─── */}
      {productImages.length > 2 && (
        <section className="py-10 bg-muted/30">
          <div className="container">
            <SectionHeader title="صور من منتجاتنا" subtitle="تصفح مجموعة مختارة من منتجاتنا" />
            <div className="mt-6 overflow-hidden rounded-2xl" ref={prodCarouselRef}>
              <div className="flex gap-4" style={{ direction: 'ltr' }}>
                {productImages.map((img, i) => (
                  <div key={i} className="flex-[0_0_280px] md:flex-[0_0_320px] min-w-0">
                    <img src={img} alt="" className="w-full aspect-[4/3] object-cover rounded-xl" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
            {productImages.length > 3 && (
              <div className="flex justify-center gap-1.5 mt-4">
                {productImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => prodCarouselApi?.scrollTo(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i === prodSelectedIndex ? 'bg-primary w-6' : 'bg-muted-foreground/25 hover:bg-muted-foreground/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── Categories ─── */}
      {(categoriesData?.length ?? 0) > 0 && (
        <section className="py-14 md:py-20">
          <div className="container">
            <SectionHeader title="تصفح حسب الفئة" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-6">
              {(categoriesData || []).map((cat) => {
                const Icon = ICON_MAP[cat.icon] || Home;
                return (
                  <Link key={cat.name} to={`/products?category=${encodeURIComponent(cat.name)}`}>
                    <div className="relative rounded-2xl border border-border bg-card p-6 text-center hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 group">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary/8 flex items-center justify-center group-hover:bg-primary/15 group-hover:scale-105 transition-all duration-300">
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <Icon className="w-7 h-7 text-primary" />
                        )}
                      </div>
                      <h3 className="font-cairo font-bold text-sm text-foreground">{cat.name}</h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── Newest Products ─── */}
      <section className="py-14 md:py-20 bg-muted/40">
        <div className="container">
          <div className="flex items-end justify-between gap-4 mb-8">
            <SectionHeader title="أحدث المنتجات" subtitle="اكتشف أحدث ما أضفناه لمجموعتنا" />
            <Link to="/products" className="shrink-0">
              <Button variant="ghost" className="font-cairo font-semibold gap-1 text-primary hover:text-primary hover:bg-primary/10 rounded-xl">
                عرض الكل
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          {isLoading ? <ProductGridSkeleton /> : newestProducts.length > 0 ? renderProductGrid(newestProducts) : (
            <div className="text-center py-20 bg-card rounded-2xl border border-dashed">
              <ShoppingBag className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="font-cairo text-muted-foreground text-lg">لا توجد منتجات حالياً</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── Most Expensive (Premium) Products ─── */}
      {mostExpensive.length > 0 && (
        <section className="py-14 md:py-20">
          <div className="container">
            <div className="flex items-end justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-secondary" />
                </div>
                <SectionHeader title="منتجات مميزة" subtitle="أفخم المنتجات في متجرنا" />
              </div>
              <Link to="/products" className="shrink-0">
                <Button variant="ghost" className="font-cairo font-semibold gap-1 text-primary hover:text-primary hover:bg-primary/10 rounded-xl">
                  عرض الكل
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            {renderProductGrid(mostExpensive)}
          </div>
        </section>
      )}

      {/* ─── Best Products (highest stock = popular) ─── */}
      {bestProducts.length > 0 && (
        <section className="py-14 md:py-20 bg-muted/40">
          <div className="container">
            <div className="flex items-end justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <SectionHeader title="أفضل منتجاتنا" subtitle="الأكثر طلباً وشعبية" />
              </div>
              <Link to="/products" className="shrink-0">
                <Button variant="ghost" className="font-cairo font-semibold gap-1 text-primary hover:text-primary hover:bg-primary/10 rounded-xl">
                  عرض الكل
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            {renderProductGrid(bestProducts)}
          </div>
        </section>
      )}

      {/* ─── Why Choose Us ─── */}
      <section className="py-16 md:py-24">
        <div className="container">
          <SectionHeader title="لماذا تختارنا؟" subtitle="نسعى لتقديم أفضل تجربة تسوق لكم" center />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            {whyUsItems.map((item, i) => (
              <div key={i} className="relative bg-card border border-border rounded-2xl p-8 text-center hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/15 group-hover:scale-105 transition-all duration-300">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-cairo font-bold text-lg mb-2 text-foreground">{item.title}</h3>
                <p className="font-cairo text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-primary via-primary to-primary/90" />
        <div className="absolute top-0 left-0 w-72 h-72 bg-background/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-background/5 rounded-full translate-x-1/3 translate-y-1/3" />
        <div className="container relative z-10 py-16 md:py-20 text-center">
          <h2 className="font-cairo font-extrabold text-3xl md:text-4xl text-primary-foreground mb-4">
            جاهز للتسوق؟
          </h2>
          <p className="font-cairo text-primary-foreground/80 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
            اكتشف مجموعتنا الواسعة من المنتجات واستفد من عروضنا الحصرية.
          </p>
          <Link to="/products">
            <Button size="lg" variant="secondary" className="font-cairo font-bold text-base px-10 h-12 rounded-xl gap-2 shadow-lg hover:shadow-xl transition-shadow">
              تصفح المنتجات
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title, subtitle, center }: { title: string; subtitle?: string; center?: boolean }) {
  return (
    <div className={center ? 'text-center mb-0' : 'mb-0'}>
      <h2 className="font-cairo font-extrabold text-2xl md:text-3xl text-foreground">{title}</h2>
      {subtitle && <p className="font-cairo text-muted-foreground mt-1.5 text-sm md:text-base">{subtitle}</p>}
    </div>
  );
}
