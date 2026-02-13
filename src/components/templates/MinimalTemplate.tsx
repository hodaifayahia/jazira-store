import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProductCard from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/LoadingSkeleton';
import AnimatedSection from '@/components/AnimatedSection';

interface Props {
  products: any[] | undefined;
  isLoading: boolean;
  categories: any[] | undefined;
}

export default function MinimalTemplate({ products, isLoading, categories }: Props) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const allProducts = products || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Search Hero */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container max-w-2xl text-center space-y-6">
          <AnimatedSection>
            <h1 className="font-cairo font-extrabold text-3xl md:text-4xl text-foreground">
              ابحث عن ما تريد
            </h1>
            <p className="font-cairo text-muted-foreground mt-2">تصفح مجموعتنا الواسعة من المنتجات</p>
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto">
              <div className="relative flex-1 group">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن منتج..."
                  className="pr-11 font-cairo rounded-2xl h-14 text-base"
                />
              </div>
              <Button type="submit" size="lg" className="font-cairo font-bold rounded-2xl h-14 px-8">
                بحث
              </Button>
            </form>
          </AnimatedSection>
        </div>
      </section>

      {/* Categories as pills */}
      {categories && categories.length > 0 && (
        <section className="py-6 border-b">
          <div className="container">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map(cat => (
                <Link key={cat.name} to={`/products?category=${encodeURIComponent(cat.name)}`}>
                  <Button variant="outline" size="sm" className="font-cairo rounded-full">
                    {cat.name}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Products */}
      <section className="py-14 md:py-20">
        <div className="container">
          <AnimatedSection>
            <div className="flex items-end justify-between gap-4 mb-8">
              <h2 className="font-cairo font-extrabold text-2xl md:text-3xl text-foreground">جميع المنتجات</h2>
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
            ) : allProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {allProducts.slice(0, 12).map((p, i) => (
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
