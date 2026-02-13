import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ShoppingBag, ChevronLeft, Star, Home as HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProductCard from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/LoadingSkeleton';
import AnimatedSection from '@/components/AnimatedSection';
import FloatingParticles from '@/components/FloatingParticles';
import heroBannerNew from '@/assets/hero-banner-new.jpg';

const ICON_MAP: Record<string, any> = {};

interface Props {
  products: any[] | undefined;
  isLoading: boolean;
  categories: any[] | undefined;
  heroSlides: { url: string; link?: string; alt?: string }[] | undefined;
}

export default function BoldTemplate({ products, isLoading, categories, heroSlides }: Props) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const allProducts = products || [];
  const featured = allProducts[0];
  const restProducts = allProducts.slice(1, 9);
  const heroImage = heroSlides?.[0]?.url || heroBannerNew;

  return (
    <div className="min-h-screen bg-background">
      {/* Full-width Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="" aria-hidden className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/95 via-foreground/60 to-foreground/30" />
        </div>
        <FloatingParticles className="opacity-20" />
        <div className="container relative z-10 text-center space-y-8 py-20">
          <AnimatedSection>
            <h1 className="font-cairo font-extrabold text-5xl sm:text-6xl lg:text-7xl text-background leading-[1.1]">
              اكتشف التميّز
            </h1>
            <p className="font-cairo text-background/70 text-xl mt-4 max-w-lg mx-auto">
              منتجات مختارة بعناية لتناسب ذوقك
            </p>
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ابحث..."
                  className="pr-11 font-cairo bg-background/95 backdrop-blur-sm rounded-2xl h-14 text-base"
                />
              </div>
              <Button type="submit" size="lg" className="font-cairo font-bold rounded-2xl h-14 px-8">بحث</Button>
            </form>
          </AnimatedSection>
          <AnimatedSection delay={300}>
            <Link to="/products">
              <Button size="lg" className="font-cairo font-bold text-lg px-10 h-14 gap-2 rounded-2xl">
                تسوّق الآن
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Large Category Cards */}
      {categories && categories.length > 0 && (
        <section className="py-14 md:py-20">
          <div className="container">
            <AnimatedSection>
              <h2 className="font-cairo font-extrabold text-2xl md:text-3xl text-foreground text-center mb-8">تصفح الفئات</h2>
            </AnimatedSection>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categories.slice(0, 6).map((cat, i) => (
                <AnimatedSection key={cat.name} delay={i * 80}>
                  <Link to={`/products?category=${encodeURIComponent(cat.name)}`}>
                    <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-border p-8 text-center hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group min-h-[120px] flex flex-col items-center justify-center">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-12 h-12 rounded-xl object-cover mb-3" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-3">
                          <Star className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      <h3 className="font-cairo font-bold text-lg text-foreground">{cat.name}</h3>
                    </div>
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Product Spotlight */}
      {featured && (
        <section className="py-14 md:py-20 bg-muted/40">
          <div className="container">
            <AnimatedSection>
              <div className="flex items-center gap-2 mb-6">
                <Star className="w-6 h-6 text-primary fill-primary" />
                <h2 className="font-cairo font-extrabold text-2xl md:text-3xl text-foreground">منتج مميز</h2>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={100}>
              <Link to={`/product/${featured.slug || featured.id}`}>
                <div className="grid md:grid-cols-2 gap-6 bg-card border rounded-2xl overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="aspect-square md:aspect-auto">
                    <img
                      src={featured.images?.[featured.main_image_index ?? 0] || featured.images?.[0] || ''}
                      alt={featured.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-8 flex flex-col justify-center">
                    <h3 className="font-cairo font-extrabold text-2xl md:text-3xl text-foreground mb-3">{featured.name}</h3>
                    {featured.short_description && (
                      <p className="font-cairo text-muted-foreground mb-4">{featured.short_description}</p>
                    )}
                    <p className="font-roboto font-bold text-3xl text-primary">{Number(featured.price).toLocaleString()} د.ج</p>
                    <Button className="font-cairo font-bold mt-6 w-fit gap-2 rounded-xl" size="lg">
                      اطلب الآن
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Link>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* Products Grid */}
      <section className="py-14 md:py-20">
        <div className="container">
          <AnimatedSection>
            <div className="flex items-end justify-between gap-4 mb-8">
              <h2 className="font-cairo font-extrabold text-2xl md:text-3xl text-foreground">أحدث المنتجات</h2>
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
            ) : restProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {restProducts.map((p, i) => (
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
              <div className="text-center py-20 bg-card rounded-2xl border border-dashed">
                <ShoppingBag className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="font-cairo text-muted-foreground text-lg">لا توجد منتجات حالياً</p>
              </div>
            )}
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
