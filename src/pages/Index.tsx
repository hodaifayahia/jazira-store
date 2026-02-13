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
import heroBannerNew from '@/assets/hero-banner-new.jpg';
import AnimatedSection from '@/components/AnimatedSection';
import FloatingParticles from '@/components/FloatingParticles';
import HeroScene3D from '@/components/HeroScene3D';
import MinimalTemplate from '@/components/templates/MinimalTemplate';
import BoldTemplate from '@/components/templates/BoldTemplate';
import LiquidTemplate from '@/components/templates/LiquidTemplate';
import DigitalTemplate from '@/components/templates/DigitalTemplate';

const ICON_MAP: Record<string, LucideIcon> = {
  Home, Sparkles, Watch, ShoppingBag, Gift, Star, Heart, Shirt,
  Laptop, Smartphone, Car, Utensils, Baby, Headphones, Camera, Sofa, Dumbbell, Palette,
  Book, Gem, Zap, Flame, Leaf, Music, Plane, Pizza, Coffee, Glasses, Footprints, Dog,
  Wrench, Gamepad2, Crown, Flower2, Bike, Briefcase, Stethoscope,
};

function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target <= 0) return;
    let frame: number;
    const duration = 1200;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return <>{count}</>;
}

export default function IndexPage() {
  const { data: categoriesData } = useCategories();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

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

  const { data: heroSlides } = useQuery({
    queryKey: ['hero-slides'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'hero_slides').maybeSingle();
      try { return JSON.parse(data?.value || '[]') as { url: string; link?: string; alt?: string }[]; } catch { return []; }
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: storeTemplate } = useQuery({
    queryKey: ['store-template'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'store_template').maybeSingle();
      return data?.value || 'classic';
    },
    staleTime: 5 * 60 * 1000,
  });

  const [emblaRef] = useEmblaCarousel({ direction: 'rtl', loop: true }, [Autoplay({ delay: 5000 })]);

  const newestProducts = allProducts?.slice(0, 8) || [];
  const mostExpensive = [...(allProducts || [])].sort((a, b) => Number(b.price) - Number(a.price)).slice(0, 4);
  const bestProducts = [...(allProducts || [])].sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0)).slice(0, 4);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Template routing
  if (storeTemplate === 'minimal') {
    return <MinimalTemplate products={allProducts} isLoading={isLoading} categories={categoriesData} />;
  }
  if (storeTemplate === 'bold') {
    return <BoldTemplate products={allProducts} isLoading={isLoading} categories={categoriesData} heroSlides={heroSlides} />;
  }
  if (storeTemplate === 'liquid') {
    return <LiquidTemplate products={allProducts} isLoading={isLoading} categories={categoriesData} heroSlides={heroSlides} />;
  }
  if (storeTemplate === 'digital') {
    return <DigitalTemplate products={allProducts} isLoading={isLoading} categories={categoriesData} heroSlides={heroSlides} />;
  }

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
      {products.map((p, i) => (
        <div key={p.id} style={{ animationDelay: `${i * 0.06}s` }} className="animate-fade-in opacity-0 [animation-fill-mode:forwards]">
          <ProductCard
            id={p.id}
            name={p.name}
            price={Number(p.price)}
            image={p.images?.[p.main_image_index ?? 0] || p.images?.[0] || ''}
            images={p.images || []}
            mainImageIndex={p.main_image_index ?? 0}
            category={p.category || []}
            stock={p.stock ?? 0}
            shippingPrice={Number(p.shipping_price) || 0}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">

      {/* ─── Hero Section ─── */}
      {heroSlides && heroSlides.length > 0 ? (
        <section className="relative isolate overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {heroSlides.map((slide, i) => (
              <div key={i} className="flex-[0_0_100%] min-w-0 relative">
                {slide.link ? (
                  <Link to={slide.link}>
                    <img src={slide.url} alt={slide.alt || `Slide ${i + 1}`} className="w-full h-[300px] sm:h-[400px] lg:h-[500px] object-cover" />
                  </Link>
                ) : (
                  <img src={slide.url} alt={slide.alt || `Slide ${i + 1}`} className="w-full h-[300px] sm:h-[400px] lg:h-[500px] object-cover" />
                )}
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroBannerNew} alt="" aria-hidden className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-transparent" />
          </div>

          {/* 3D Scene (desktop only) */}
          <HeroScene3D />

          <div className="container relative z-10 py-20 md:py-28 lg:py-36 flex justify-center">
            <div className="max-w-2xl text-center space-y-6">
              <span className="inline-block font-cairo text-sm font-semibold tracking-wide text-primary bg-primary/20 backdrop-blur-sm rounded-full px-4 py-1.5 animate-fade-in">
                🇩🇿 أفضل المنتجات في الجزائر
              </span>
              <h1 className="font-cairo font-extrabold text-4xl sm:text-5xl lg:text-6xl text-background leading-[1.15] tracking-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
                تسوّق بثقة مع{' '}
                <span className="text-primary">DZ Store</span>
              </h1>
              <p className="font-cairo text-background/75 text-lg sm:text-xl leading-relaxed max-w-md mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
                أفضل المنتجات المنزلية، الزينة والإكسسوارات بأسعار مناسبة مع التوصيل لجميع الولايات.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="relative flex-1 group">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن منتج..."
                    className="pr-11 font-cairo bg-background/95 backdrop-blur-sm border-background/20 rounded-2xl h-14 text-base shadow-lg"
                  />
                </div>
                <Button type="submit" size="lg" className="font-cairo font-bold rounded-2xl h-14 px-8 shadow-lg">
                  بحث
                </Button>
              </form>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <Link to="/products">
                  <Button size="lg" className="font-cairo font-bold text-base px-8 h-12 gap-2 rounded-xl shadow-lg hover:scale-[1.02] transition-all animate-glow-pulse">
                    تسوّق الآن
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/track">
                  <Button size="lg" className="font-cairo font-semibold text-base px-8 h-12 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg hover:scale-[1.02] transition-all">
                    تتبع طلبك
                  </Button>
                </Link>
                {allProducts && allProducts.length > 0 && (
                  <span className="font-cairo text-sm text-background/60 bg-background/10 backdrop-blur-sm rounded-full px-3 py-1.5">
                    +<AnimatedCounter target={allProducts.length} /> منتج
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Trust Bar ─── */}
      <AnimatedSection>
        <section className="border-b bg-card">
          <div className="container py-5 md:py-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-6">
              {trustItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3 group cursor-default">
                  <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                    <item.icon className="w-5 h-5 text-primary group-hover:animate-float" />
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
      </AnimatedSection>

      {/* ─── Categories ─── */}
      {(categoriesData?.length ?? 0) > 0 && (
        <section className="py-14 md:py-20">
          <div className="container">
            <AnimatedSection>
              <SectionHeader title="تصفح حسب الفئة" />
            </AnimatedSection>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-6">
              {(categoriesData || []).map((cat, i) => {
                const Icon = ICON_MAP[cat.icon] || Home;
                return (
                  <AnimatedSection key={cat.name} delay={i * 60}>
                    <Link to={`/products?category=${encodeURIComponent(cat.name)}`}>
                      <div className="relative rounded-2xl border border-border bg-card p-6 text-center hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.03] transition-all duration-300 group">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary/8 flex items-center justify-center group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300">
                          {cat.image ? (
                            <img src={cat.image} alt={cat.name} className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <Icon className="w-7 h-7 text-primary" />
                          )}
                        </div>
                        <h3 className="font-cairo font-bold text-sm text-foreground">{cat.name}</h3>
                      </div>
                    </Link>
                  </AnimatedSection>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── Newest Products ─── */}
      <section className="py-14 md:py-20 bg-muted/40">
        <div className="container">
          <AnimatedSection>
            <div className="flex items-end justify-between gap-4 mb-8">
              <SectionHeader title="أحدث المنتجات" subtitle="اكتشف أحدث ما أضفناه لمجموعتنا" />
              <Link to="/products" className="shrink-0">
                <Button variant="ghost" className="font-cairo font-semibold gap-1 text-primary hover:text-primary hover:bg-primary/10 rounded-xl">
                  عرض الكل
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={100}>
            {isLoading ? <ProductGridSkeleton /> : newestProducts.length > 0 ? renderProductGrid(newestProducts) : (
              <div className="text-center py-20 bg-card rounded-2xl border border-dashed">
                <ShoppingBag className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="font-cairo text-muted-foreground text-lg">لا توجد منتجات حالياً</p>
              </div>
            )}
          </AnimatedSection>
        </div>
      </section>

      {/* ─── Most Expensive (Premium) Products ─── */}
      {mostExpensive.length > 0 && (
        <section className="py-14 md:py-20">
          <div className="container">
            <AnimatedSection>
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
            </AnimatedSection>
            <AnimatedSection delay={100}>
              {renderProductGrid(mostExpensive)}
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* ─── Best Products (highest stock = popular) ─── */}
      {bestProducts.length > 0 && (
        <section className="py-14 md:py-20 bg-muted/40">
          <div className="container">
            <AnimatedSection>
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
            </AnimatedSection>
            <AnimatedSection delay={100}>
              {renderProductGrid(bestProducts)}
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* ─── Why Choose Us ─── */}
      <section className="py-16 md:py-24 relative">
        <FloatingParticles />
        <div className="container relative z-10">
          <AnimatedSection>
            <SectionHeader title="لماذا تختارنا؟" subtitle="نسعى لتقديم أفضل تجربة تسوق لكم" center />
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            {whyUsItems.map((item, i) => (
              <AnimatedSection key={i} delay={i * 120}>
                <div className="relative bg-card border border-border rounded-2xl p-8 text-center hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 group">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300">
                    <item.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-cairo font-bold text-lg mb-2 text-foreground">{item.title}</h3>
                  <p className="font-cairo text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-primary via-primary to-primary/90 animated-gradient" />
        <FloatingParticles className="opacity-30" />
        <div className="absolute top-0 left-0 w-72 h-72 bg-background/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-background/5 rounded-full translate-x-1/3 translate-y-1/3" />
        <div className="container relative z-10 py-16 md:py-20 text-center">
          <AnimatedSection>
            <h2 className="font-cairo font-extrabold text-3xl md:text-4xl text-primary-foreground mb-4">
              جاهز للتسوق؟
            </h2>
            <p className="font-cairo text-primary-foreground/80 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
              اكتشف مجموعتنا الواسعة من المنتجات واستفد من عروضنا الحصرية.
            </p>
            <Link to="/products">
              <Button size="lg" variant="secondary" className="font-cairo font-bold text-base px-10 h-12 rounded-xl gap-2 shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all">
                تصفح المنتجات
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
          </AnimatedSection>
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
