import { useState, useEffect } from 'react';
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
  ChevronLeft, Search, TrendingUp, Award, Droplets, Package, CheckCircle,
  type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProductCard from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/LoadingSkeleton';
import { useCategories } from '@/hooks/useCategories';
import heroImage from '@/assets/hero-dates-honey.jpg';
import AnimatedSection from '@/components/AnimatedSection';
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

  const { data: reviews } = useQuery({
    queryKey: ['all-reviews-homepage'],
    queryFn: async () => {
      const { data } = await supabase.from('reviews').select('*').gte('rating', 4).order('created_at', { ascending: false }).limit(6);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const [emblaRef] = useEmblaCarousel({ direction: 'rtl', loop: true }, [Autoplay({ delay: 5000 })]);

  const newestProducts = allProducts?.slice(0, 8) || [];
  const bestProducts = [...(allProducts || [])].sort((a, b) => Number(b.price) - Number(a.price)).slice(0, 4);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Template routing
  if (storeTemplate === 'minimal') return <MinimalTemplate products={allProducts} isLoading={isLoading} categories={categoriesData} />;
  if (storeTemplate === 'bold') return <BoldTemplate products={allProducts} isLoading={isLoading} categories={categoriesData} heroSlides={heroSlides} />;
  if (storeTemplate === 'liquid') return <LiquidTemplate products={allProducts} isLoading={isLoading} categories={categoriesData} heroSlides={heroSlides} />;
  if (storeTemplate === 'digital') return <DigitalTemplate products={allProducts} isLoading={isLoading} categories={categoriesData} heroSlides={heroSlides} />;

  const trustItems = [
    { icon: Droplets, label: 'عسل طبيعي 100%', desc: 'بدون إضافات' },
    { icon: Truck, label: 'توصيل سريع', desc: 'لجميع الولايات' },
    { icon: CheckCircle, label: 'جودة معتمدة', desc: 'منتجات مختارة' },
    { icon: Leaf, label: 'بدون مواد حافظة', desc: '100% طبيعي' },
  ];

  const categoryCards = [
    { name: 'تمور', subtitle: 'أجود أنواع التمور الجزائرية', emoji: '🌴', gradient: 'from-amber-900/80 to-amber-700/60' },
    { name: 'عسل', subtitle: 'عسل طبيعي خام من الجبال', emoji: '🍯', gradient: 'from-yellow-800/80 to-yellow-600/60' },
    { name: 'هدايا وتشكيلات', subtitle: 'علب هدايا فاخرة للمناسبات', emoji: '🎁', gradient: 'from-emerald-900/80 to-emerald-700/60' },
  ];

  const renderProductGrid = (products: typeof newestProducts) => (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
      {products.map((p, i) => (
        <div key={p.id} style={{ animationDelay: `${i * 0.06}s` }} className="animate-fade-in opacity-0 [animation-fill-mode:forwards]">
          <ProductCard
            id={p.id}
            name={p.name}
            price={Number(p.price)}
            oldPrice={p.old_price ? Number(p.old_price) : undefined}
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
        <section className="relative isolate overflow-hidden grain-texture">
          <div className="absolute inset-0">
            <img src={heroImage} alt="" aria-hidden className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1C1005]/90 via-[#1C1005]/70 to-transparent" />
          </div>

          <div className="container relative z-10 py-24 md:py-32 lg:py-40 flex justify-center">
            <div className="max-w-2xl text-center space-y-6">
              {/* Floating badge */}
              <span className="inline-flex items-center gap-2 font-cairo text-sm font-semibold tracking-wide text-amber-100 bg-amber-900/40 backdrop-blur-sm rounded-full px-5 py-2 animate-fade-in border border-amber-500/20">
                🌿 100% طبيعي — Natural & Pure
              </span>

              <h1 className="font-cairo font-extrabold text-4xl sm:text-5xl lg:text-6xl text-amber-50 leading-[1.15] tracking-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
                أجود التمور والعسل الطبيعي
              </h1>

              {/* Golden decorative line */}
              <div className="h-[2px] w-32 mx-auto golden-line rounded-full animate-fade-in" style={{ animationDelay: '0.15s' }} />

              <p className="font-playfair text-amber-200/80 text-lg sm:text-xl leading-relaxed max-w-md mx-auto animate-fade-in italic" style={{ animationDelay: '0.2s' }}>
                The finest dates & natural honey
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <Link to="/products">
                  <Button size="lg" className="font-cairo font-bold text-base px-8 h-12 gap-2 rounded-2xl shadow-lg hover:scale-[1.02] transition-all bg-primary hover:bg-primary/90">
                    تسوّق الآن
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/products">
                  <Button size="lg" variant="outline" className="font-cairo font-semibold text-base px-8 h-12 rounded-2xl border-amber-300/30 text-amber-100 hover:bg-amber-100/10 hover:text-amber-50 backdrop-blur-sm bg-transparent">
                    اكتشف المنتجات
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Trust Bar ─── */}
      <AnimatedSection>
        <section className="border-b bg-primary/5">
          <div className="container py-5 md:py-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-6">
              {trustItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3 group cursor-default">
                  <div className="shrink-0 w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300">
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
      </AnimatedSection>

      {/* ─── Featured Categories ─── */}
      <section className="py-16 md:py-24">
        <div className="container">
          <AnimatedSection>
            <SectionHeader title="تصفح حسب الفئة" center />
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-10">
            {categoryCards.map((cat, i) => (
              <AnimatedSection key={cat.name} delay={i * 100}>
                <Link to={`/products?category=${encodeURIComponent(cat.name)}`}>
                  <div className="relative rounded-3xl overflow-hidden h-56 sm:h-64 group cursor-pointer border border-secondary/20 hover:border-secondary/40 transition-all duration-500">
                    <div className={`absolute inset-0 bg-gradient-to-t ${cat.gradient}`} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10">
                      <span className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">{cat.emoji}</span>
                      <h3 className="font-cairo font-bold text-2xl text-amber-50 mb-1">{cat.name}</h3>
                      <p className="font-cairo text-sm text-amber-200/70">{cat.subtitle}</p>
                    </div>
                    {/* Golden shimmer border on hover */}
                    <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-secondary/30 transition-all duration-500" />
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bestsellers ─── */}
      <section className="py-14 md:py-20 bg-muted/40">
        <div className="container">
          <AnimatedSection>
            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <SectionHeader title="الأكثر مبيعاً" subtitle="أفضل منتجاتنا المختارة بعناية" />
                <div className="h-[2px] w-16 golden-line rounded-full mt-2" />
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
            {isLoading ? <ProductGridSkeleton /> : newestProducts.length > 0 ? renderProductGrid(newestProducts) : (
              <div className="text-center py-20 bg-card rounded-2xl border border-dashed">
                <ShoppingBag className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="font-cairo text-muted-foreground text-lg">لا توجد منتجات حالياً</p>
              </div>
            )}
          </AnimatedSection>
        </div>
      </section>

      {/* ─── Brand Story Section ─── */}
      <section className="py-20 md:py-28">
        <div className="container">
          <AnimatedSection>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <span className="font-cairo text-sm font-semibold text-primary bg-primary/10 rounded-full px-4 py-1.5">قصتنا</span>
                <h2 className="font-cairo font-extrabold text-3xl md:text-4xl text-foreground leading-tight">
                  من قلب الطبيعة إلى مائدتكم
                </h2>
                <blockquote className="font-playfair text-xl text-muted-foreground italic border-r-4 border-secondary pr-4 leading-relaxed">
                  "نختار لكم أجود المنتجات الطبيعية من أفضل المزارع والمناحل"
                </blockquote>
                <p className="font-cairo text-muted-foreground leading-relaxed">
                  نؤمن بأن الطبيعة تقدم أفضل ما يمكن لصحتكم. لذلك نختار بعناية فائقة كل منتج نقدمه لكم، 
                  من تمور المجهول الفاخرة إلى عسل السدر الطبيعي، لنضمن لكم تجربة استثنائية بجودة لا مثيل لها.
                </p>
                {/* Animated counters */}
                <div className="grid grid-cols-3 gap-4 pt-4">
                  {[
                    { icon: '🌴', value: 50, suffix: '+', label: 'نوع من التمور' },
                    { icon: '🍯', value: 20, suffix: '+', label: 'نوع من العسل' },
                    { icon: '⭐', value: 10000, suffix: '+', label: 'عميل راضٍ' },
                  ].map((stat, i) => (
                    <div key={i} className="text-center bg-card border border-border rounded-2xl p-4">
                      <span className="text-2xl">{stat.icon}</span>
                      <p className="font-roboto font-bold text-2xl text-primary mt-1">
                        <AnimatedCounter target={stat.value} />{stat.suffix}
                      </p>
                      <p className="font-cairo text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="rounded-3xl overflow-hidden border-2 border-secondary/20 shadow-2xl shadow-primary/10">
                  <img src={heroImage} alt="منتجاتنا الطبيعية" className="w-full aspect-[4/3] object-cover" />
                </div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-secondary/20 rounded-full blur-2xl" />
                <div className="absolute -top-4 -left-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      {reviews && reviews.length > 0 && (
        <section className="py-16 md:py-24 bg-muted/40">
          <div className="container">
            <AnimatedSection>
              <SectionHeader title="آراء عملائنا" subtitle="ماذا يقول عملاؤنا عن منتجاتنا" center />
            </AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
              {reviews.slice(0, 6).map((review, i) => (
                <AnimatedSection key={review.id} delay={i * 80}>
                  <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                    <div className="flex gap-1 mb-3" dir="ltr">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'fill-secondary text-secondary' : 'text-muted-foreground/20'}`} />
                      ))}
                    </div>
                    <p className="font-cairo text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                      "{review.comment}"
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-cairo font-bold text-xs text-primary">{review.reviewer_name[0]}</span>
                      </div>
                      <span className="font-cairo font-semibold text-sm text-foreground">{review.reviewer_name}</span>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Premium Products ─── */}
      {bestProducts.length > 0 && (
        <section className="py-14 md:py-20">
          <div className="container">
            <AnimatedSection>
              <div className="flex items-end justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-secondary" />
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
              {renderProductGrid(bestProducts)}
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* ─── Newsletter CTA ─── */}
      <section className="relative overflow-hidden grain-texture">
        <div className="absolute inset-0 bg-gradient-to-bl from-primary via-primary to-primary/90 animated-gradient" />
        <div className="absolute top-0 left-0 w-72 h-72 bg-secondary/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full translate-x-1/3 translate-y-1/3" />
        <div className="container relative z-10 py-16 md:py-20 text-center">
          <AnimatedSection>
            <h2 className="font-cairo font-extrabold text-3xl md:text-4xl text-primary-foreground mb-3">
              احصل على عروض حصرية 🍯
            </h2>
            <p className="font-cairo text-primary-foreground/80 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
              اكتشف مجموعتنا الواسعة من التمور والعسل الطبيعي واستفد من عروضنا الحصرية.
            </p>
            <Link to="/products">
              <Button size="lg" variant="secondary" className="font-cairo font-bold text-base px-10 h-12 rounded-2xl gap-2 shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all">
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
