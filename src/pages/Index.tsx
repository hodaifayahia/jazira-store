import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Home, Sparkles, Watch, ArrowLeft, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/LoadingSkeleton';
import { useCategories } from '@/hooks/useCategories';
import heroBanner from '@/assets/hero-banner.jpg';

const ICON_MAP: Record<string, LucideIcon> = { Home, Sparkles, Watch };
const COLOR_CLASSES = [
  'bg-primary/10 text-primary',
  'bg-secondary/10 text-secondary',
  'bg-accent text-accent-foreground',
];

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

      {/* Categories */}
      <section className="container py-12">
        <h2 className="font-cairo font-bold text-2xl text-foreground mb-6">تصفح حسب الفئة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {categories.map(cat => (
            <Link key={cat.name} to={`/products?category=${encodeURIComponent(cat.name)}`}>
              <div className={`rounded-lg p-6 ${cat.color} hover:shadow-md transition-all duration-200 text-center group`}>
                <cat.icon className="w-10 h-10 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-cairo font-bold text-lg">{cat.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container py-12">
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
      </section>
    </div>
  );
}
