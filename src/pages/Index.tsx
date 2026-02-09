import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Home, Sparkles, Watch, ArrowLeft, ShoppingBag, Gift, Star, Heart, Shirt,
  Laptop, Smartphone, Car, Utensils, Baby, Headphones, Camera, Sofa, Dumbbell, Palette,
  Book, Gem, Zap, Flame, Leaf, Music, Plane, Pizza, Coffee, Glasses, Footprints, Dog,
  Wrench, Gamepad2, Crown, Flower2, Bike, Briefcase, Stethoscope,
  Truck, Shield, Clock, HeadphonesIcon, BadgeCheck, MapPin, CreditCard,
  type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  const { data: heroSetting } = useQuery({
    queryKey: ['hero-banner-setting'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'hero_banner').maybeSingle();
      return data?.value || '';
    },
  });

  const heroBanner = heroSetting || heroBannerFallback;

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

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBanner} alt="DZ Store" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-l from-foreground/80 via-foreground/60 to-foreground/40" />
        </div>
        <div className="container relative py-20 md:py-32">
          <div className="max-w-lg">
            <h1 className="font-cairo font-bold text-4xl md:text-5xl text-background mb-4 leading-tight">
              مرحباً بك في <span className="text-primary">DZ Store</span>
            </h1>
            <p className="font-cairo text-background/80 text-lg mb-8">
              أفضل المنتجات المنزلية، الزينة والإكسسوارات بأسعار مناسبة مع التوصيل لجميع الولايات.
            </p>
            <Link to="/products">
              <Button size="lg" className="font-cairo font-semibold gap-2 text-base px-8">
                تسوّق الآن
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-card border-b">
        <div className="container py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 justify-center md:justify-start">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-cairo font-semibold text-sm text-foreground">{item.label}</p>
                  <p className="font-cairo text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-12">
        <h2 className="font-cairo font-bold text-2xl text-foreground mb-6">تصفح حسب الفئة</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {(categoriesData || []).map((cat, i) => {
            const Icon = ICON_MAP[cat.icon] || Home;
            const gradients = [
              'from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10',
              'from-secondary/10 to-secondary/5 hover:from-secondary/20 hover:to-secondary/10',
              'from-accent to-accent/50 hover:from-accent hover:to-accent/80',
            ];
            return (
              <Link key={cat.name} to={`/products?category=${encodeURIComponent(cat.name)}`}>
                <div className={`rounded-xl p-6 bg-gradient-to-br ${gradients[i % gradients.length]} hover:shadow-lg transition-all duration-300 text-center group border border-transparent hover:border-primary/20`}>
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-12 h-12 mx-auto mb-3 rounded-xl object-cover group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <Icon className="w-12 h-12 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform duration-300" />
                  )}
                  <h3 className="font-cairo font-bold text-base">{cat.name}</h3>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-muted/30">
        <div className="container py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-cairo font-bold text-2xl text-foreground">أحدث المنتجات</h2>
            <Link to="/products">
              <Button variant="outline" className="font-cairo gap-1">
                عرض الكل <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          {isLoading ? (
            <ProductGridSkeleton />
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(p => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  price={Number(p.price)}
                  image={p.images?.[p.main_image_index ?? 0] || p.images?.[0] || ''}
                  category={p.category || []}
                  stock={p.stock ?? 0}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="font-cairo text-muted-foreground text-lg">لا توجد منتجات حالياً. يتم إضافة منتجات جديدة قريباً!</p>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="container py-16">
        <h2 className="font-cairo font-bold text-2xl text-foreground text-center mb-10">لماذا تختارنا؟</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {whyUsItems.map((item, i) => (
            <div key={i} className="bg-card border rounded-2xl p-8 text-center hover:shadow-lg transition-shadow duration-300 group">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/20 transition-colors">
                <item.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-cairo font-bold text-lg mb-2">{item.title}</h3>
              <p className="font-cairo text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary">
        <div className="container py-12 text-center">
          <h2 className="font-cairo font-bold text-2xl text-primary-foreground mb-3">جاهز للتسوق؟</h2>
          <p className="font-cairo text-primary-foreground/80 mb-6 max-w-md mx-auto">
            اكتشف مجموعتنا الواسعة من المنتجات واستفد من عروضنا الحصرية.
          </p>
          <Link to="/products">
            <Button size="lg" variant="secondary" className="font-cairo font-semibold gap-2 text-base px-8">
              تصفح المنتجات
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
