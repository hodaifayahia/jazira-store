import { useState, useRef, useCallback, MouseEvent as ReactMouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ShoppingBag, ChevronLeft, Truck, Shield, Clock, HeadphonesIcon, Home, Star, Sparkles, Watch, Gift, Heart, Shirt, Laptop, Smartphone, Car, Utensils, Baby, Headphones, Camera, Sofa, Dumbbell, Palette, Book, Gem, Zap, Flame, Leaf, Music, Plane, Pizza, Coffee, Glasses, Footprints, Dog, Wrench, Gamepad2, Crown, Flower2, Bike, Briefcase, Stethoscope, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProductCard from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/LoadingSkeleton';
import AnimatedSection from '@/components/AnimatedSection';
import HeroScene3D from '@/components/HeroScene3D';

const ICON_MAP: Record<string, LucideIcon> = {
  Home, Sparkles, Watch, ShoppingBag, Gift, Star, Heart, Shirt,
  Laptop, Smartphone, Car, Utensils, Baby, Headphones, Camera, Sofa, Dumbbell, Palette,
  Book, Gem, Zap, Flame, Leaf, Music, Plane, Pizza, Coffee, Glasses, Footprints, Dog,
  Wrench, Gamepad2, Crown, Flower2, Bike, Briefcase, Stethoscope,
};

/* ─── Animated SVG Blobs ─── */
function LiquidBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] opacity-30" viewBox="0 0 600 600">
        <defs>
          <linearGradient id="liquid-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <path className="animate-blob-morph" fill="url(#liquid-grad-1)"
          d="M300,520C390,520,480,480,530,400C580,320,580,220,530,150C480,80,390,40,300,40C210,40,120,80,70,150C20,220,20,320,70,400C120,480,210,520,300,520Z"
        />
      </svg>
      <svg className="absolute -bottom-1/4 -left-1/4 w-[700px] h-[700px] opacity-20" viewBox="0 0 600 600">
        <defs>
          <linearGradient id="liquid-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path className="animate-blob-morph" style={{ animationDelay: '-3s' }} fill="url(#liquid-grad-2)"
          d="M300,520C390,520,480,480,530,400C580,320,580,220,530,150C480,80,390,40,300,40C210,40,120,80,70,150C20,220,20,320,70,400C120,480,210,520,300,520Z"
        />
      </svg>
    </div>
  );
}

/* ─── 3D Tilt Card ─── */
function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({ transform: 'perspective(800px) rotateX(0deg) rotateY(0deg)' });

  const handleMove = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateY = ((x / rect.width) - 0.5) * -12;
    const rotateX = ((y / rect.height) - 0.5) * 12;
    setStyle({ transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)` });
  }, []);

  const handleLeave = useCallback(() => {
    setStyle({ transform: 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)' });
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`transition-transform duration-300 ease-out ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

interface Props {
  products: any[] | undefined;
  isLoading: boolean;
  categories: any[] | undefined;
  heroSlides: { url: string; link?: string; alt?: string }[] | undefined;
}

export default function LiquidTemplate({ products, isLoading, categories, heroSlides }: Props) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const allProducts = products || [];
  const newestProducts = allProducts.slice(0, 8);

  const trustItems = [
    { icon: Truck, label: 'توصيل لجميع الولايات', desc: '58 ولاية' },
    { icon: Shield, label: 'دفع آمن', desc: 'بريدي موب وفليكسي' },
    { icon: Clock, label: 'توصيل سريع', desc: '24-72 ساعة' },
    { icon: HeadphonesIcon, label: 'خدمة العملاء', desc: 'دعم متواصل' },
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* ════════════════════════ HERO ════════════════════════ */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        {/* Liquid blobs background */}
        <LiquidBlobs />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />

        {/* Decorative glass orbs */}
        <div className="absolute top-20 left-[10%] w-32 h-32 rounded-full bg-primary/10 backdrop-blur-xl animate-float" />
        <div className="absolute bottom-32 right-[15%] w-24 h-24 rounded-full bg-secondary/10 backdrop-blur-xl animate-float" style={{ animationDelay: '-1.5s' }} />
        <div className="absolute top-1/3 right-[8%] w-16 h-16 rounded-full bg-primary/5 backdrop-blur-xl animate-float" style={{ animationDelay: '-2.5s' }} />

        {/* 3D scene on desktop */}
        <HeroScene3D />

        <div className="container relative z-10 text-center space-y-8 py-20">
          <AnimatedSection>
            <span className="inline-block font-cairo text-sm font-semibold tracking-wide text-primary bg-primary/10 backdrop-blur-md border border-primary/20 rounded-full px-5 py-2">
              🇩🇿 أفضل المنتجات في الجزائر
            </span>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <h1 className="font-cairo font-extrabold text-5xl sm:text-6xl lg:text-7xl text-foreground leading-[1.1]">
              <span className="liquid-gradient-text">تسوّق بأسلوب</span>
              <br />
              <span className="text-foreground">عصري ومميّز</span>
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <p className="font-cairo text-muted-foreground text-lg sm:text-xl max-w-lg mx-auto leading-relaxed">
              اكتشف أحدث المنتجات بتصاميم فريدة وجودة عالية مع توصيل سريع لجميع الولايات
            </p>
          </AnimatedSection>

          {/* Glassmorphism Search Bar */}
          <AnimatedSection delay={300}>
            <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto">
              <div className="relative flex-1 group">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن منتج..."
                  className="pr-12 font-cairo bg-card/60 backdrop-blur-xl border-border/50 rounded-2xl h-14 text-base shadow-lg focus:bg-card/80 transition-all"
                />
              </div>
              <Button type="submit" size="lg" className="font-cairo font-bold rounded-2xl h-14 px-8 shadow-lg liquid-glow-btn">
                بحث
              </Button>
            </form>
          </AnimatedSection>

          <AnimatedSection delay={400}>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link to="/products">
                <Button size="lg" className="font-cairo font-bold text-lg px-10 h-14 gap-2 rounded-2xl shadow-xl liquid-glow-btn">
                  تسوّق الآن
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/track">
                <Button size="lg" variant="outline" className="font-cairo font-semibold text-lg px-10 h-14 rounded-2xl border-border/50 bg-card/40 backdrop-blur-xl hover:bg-card/70 transition-all">
                  تتبع طلبك
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ════════════════════════ TRUST BAR ════════════════════════ */}
      <AnimatedSection>
        <section className="relative z-10 -mt-16">
          <div className="container">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {trustItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-card/70 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group cursor-default">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
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

      {/* ════════════════════════ CATEGORIES ════════════════════════ */}
      {(categories?.length ?? 0) > 0 && (
        <section className="py-16 md:py-24 relative overflow-hidden">
          {/* Background decorative blobs */}
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/5 blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-secondary/5 blur-3xl translate-y-1/3 -translate-x-1/4" />

          <div className="container relative z-10">
            <AnimatedSection>
              <div className="text-center mb-10">
                <h2 className="font-cairo font-extrabold text-3xl md:text-4xl text-foreground">تصفح حسب الفئة</h2>
                <p className="font-cairo text-muted-foreground mt-2">اكتشف مجموعاتنا المتنوعة</p>
              </div>
            </AnimatedSection>

            {/* Asymmetric grid: first 2 cards large, rest smaller */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[180px] md:auto-rows-[220px]">
              {(categories || []).slice(0, 7).map((cat, i) => {
                const Icon = ICON_MAP[cat.icon] || Home;
                const isLarge = i < 2;
                return (
                  <AnimatedSection key={cat.name} delay={i * 80}>
                    <TiltCard className={`h-full ${isLarge ? 'md:col-span-2 md:row-span-1' : ''}`}>
                      <Link to={`/products?category=${encodeURIComponent(cat.name)}`} className="block h-full">
                        <div className={`relative h-full rounded-2xl overflow-hidden border border-border/50 bg-card/50 backdrop-blur-xl p-6 flex flex-col items-center justify-center text-center group transition-all duration-500 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 liquid-category-card`}>
                          {/* Animated gradient overlay */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />

                          {/* Glow effect */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl" style={{ boxShadow: 'inset 0 0 40px hsl(var(--primary) / 0.08)' }} />

                          <div className="relative z-10">
                            <div className={`mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-500 ${isLarge ? 'w-20 h-20' : 'w-14 h-14'}`}>
                              {cat.image ? (
                                <img src={cat.image} alt={cat.name} className={`rounded-xl object-cover ${isLarge ? 'w-12 h-12' : 'w-8 h-8'}`} />
                              ) : (
                                <Icon className={`text-primary ${isLarge ? 'w-10 h-10' : 'w-7 h-7'}`} />
                              )}
                            </div>
                            <h3 className={`font-cairo font-bold text-foreground ${isLarge ? 'text-xl' : 'text-sm'}`}>{cat.name}</h3>
                          </div>
                        </div>
                      </Link>
                    </TiltCard>
                  </AnimatedSection>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════ PRODUCTS ════════════════════════ */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Decorative blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/3 blur-3xl pointer-events-none" />

        <div className="container relative z-10">
          <AnimatedSection>
            <div className="flex items-end justify-between gap-4 mb-10">
              <div>
                <h2 className="font-cairo font-extrabold text-3xl md:text-4xl text-foreground">أحدث المنتجات</h2>
                <p className="font-cairo text-muted-foreground mt-1">اكتشف أحدث ما أضفناه لمجموعتنا</p>
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
            {isLoading ? (
              <ProductGridSkeleton />
            ) : newestProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {newestProducts.map((p, i) => (
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
            ) : (
              <div className="text-center py-20 bg-card/50 backdrop-blur-xl rounded-2xl border border-border/50">
                <ShoppingBag className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="font-cairo text-muted-foreground text-lg">لا توجد منتجات حالياً</p>
              </div>
            )}
          </AnimatedSection>
        </div>
      </section>

      {/* ════════════════════════ CTA ════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-primary via-primary to-primary/90 animated-gradient" />
        <LiquidBlobs />
        <div className="container relative z-10 py-20 md:py-28 text-center">
          <AnimatedSection>
            <h2 className="font-cairo font-extrabold text-3xl md:text-5xl text-primary-foreground mb-4">
              جاهز للتسوق؟
            </h2>
            <p className="font-cairo text-primary-foreground/80 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
              اكتشف مجموعتنا الواسعة من المنتجات واستفد من عروضنا الحصرية.
            </p>
            <Link to="/products">
              <Button size="lg" variant="secondary" className="font-cairo font-bold text-base px-10 h-14 rounded-2xl gap-2 shadow-xl hover:shadow-2xl hover:scale-[1.03] transition-all">
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
