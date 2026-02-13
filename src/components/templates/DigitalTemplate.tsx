import { Link } from 'react-router-dom';
import { Zap, Download, Shield, Monitor, ChevronLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/LoadingSkeleton';
import AnimatedSection from '@/components/AnimatedSection';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  products: any[] | undefined;
  isLoading: boolean;
  categories: any[] | undefined;
  heroSlides?: any[];
}

export default function DigitalTemplate({ products, isLoading, categories }: Props) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const newestProducts = products?.slice(0, 8) || [];
  const featuredProducts = [...(products || [])].sort((a, b) => Number(b.price) - Number(a.price)).slice(0, 4);

  const trustItems = [
    { icon: Zap, label: 'تسليم فوري', desc: 'فور الدفع' },
    { icon: Download, label: 'تحميل مباشر', desc: 'روابط آمنة' },
    { icon: Shield, label: 'دفع آمن', desc: 'طرق متعددة' },
    { icon: Monitor, label: 'دعم رقمي', desc: 'مساعدة 24/7' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-bl from-primary/10 via-background to-secondary/10">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="container relative z-10 py-20 md:py-28 text-center space-y-6">
          <Badge className="font-cairo bg-primary/10 text-primary border-primary/20 px-4 py-1.5">
            <Zap className="w-3.5 h-3.5 ml-1" /> منتجات رقمية — تسليم فوري
          </Badge>
          <h1 className="font-cairo font-extrabold text-4xl sm:text-5xl lg:text-6xl text-foreground leading-tight">
            احصل على منتجاتك <span className="text-primary">الرقمية</span> فوراً
          </h1>
          <p className="font-cairo text-muted-foreground text-lg max-w-lg mx-auto">
            اشترِ واستلم فوراً — بدون انتظار شحن. كل شيء رقمي وجاهز للتحميل.
          </p>

          <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث عن منتج رقمي..."
                className="pr-11 font-cairo bg-card border rounded-2xl h-14 text-base shadow-sm"
              />
            </div>
            <Button type="submit" size="lg" className="font-cairo font-bold rounded-2xl h-14 px-8">
              بحث
            </Button>
          </form>

          <div className="flex justify-center gap-3 pt-2">
            <Link to="/products">
              <Button size="lg" className="font-cairo font-bold rounded-xl gap-2">
                تصفح المنتجات <ChevronLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <AnimatedSection>
        <section className="border-y bg-card">
          <div className="container py-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-6">
              {trustItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
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
      </AnimatedSection>

      {/* Products */}
      <section className="py-14 md:py-20">
        <div className="container">
          <AnimatedSection>
            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="font-cairo font-bold text-2xl text-foreground">أحدث المنتجات</h2>
                <p className="font-cairo text-sm text-muted-foreground mt-1">اكتشف أحدث المنتجات الرقمية</p>
              </div>
              <Link to="/products">
                <Button variant="ghost" className="font-cairo font-semibold gap-1 text-primary rounded-xl">
                  عرض الكل <ChevronLeft className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={100}>
            {isLoading ? <ProductGridSkeleton /> : newestProducts.length > 0 ? (
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
                      shippingPrice={0}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-card rounded-2xl border border-dashed">
                <Monitor className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="font-cairo text-muted-foreground text-lg">لا توجد منتجات حالياً</p>
              </div>
            )}
          </AnimatedSection>
        </div>
      </section>

      {/* Featured */}
      {featuredProducts.length > 0 && (
        <section className="py-14 md:py-20 bg-muted/40">
          <div className="container">
            <AnimatedSection>
              <div className="flex items-end justify-between gap-4 mb-8">
                <div>
                  <h2 className="font-cairo font-bold text-2xl text-foreground">منتجات مميزة</h2>
                  <p className="font-cairo text-sm text-muted-foreground mt-1">أفضل منتجاتنا الرقمية</p>
                </div>
                <Link to="/products">
                  <Button variant="ghost" className="font-cairo font-semibold gap-1 text-primary rounded-xl">
                    عرض الكل <ChevronLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={100}>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {featuredProducts.map((p, i) => (
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
                      shippingPrice={0}
                    />
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}
    </div>
  );
}