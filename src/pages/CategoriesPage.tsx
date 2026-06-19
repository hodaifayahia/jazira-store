import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Grid3X3, ChevronLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AnimatedSection from '@/components/AnimatedSection';
import { useTranslation } from '@/i18n';
import { useCategories } from '@/hooks/useCategories';

export default function CategoriesPage() {
  const { t } = useTranslation();
  const { data: categories, isLoading } = useCategories();

  const { data: storeName } = useQuery({
    queryKey: ['store-name'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'store_name').maybeSingle();
      return data?.value || 'SloutionsHub';
    },
    staleTime: 10 * 60 * 1000,
  });

  const displayName = storeName || 'SloutionsHub';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e27] via-[#1a1145] to-[#0d1440]" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px]" />

        <div className="container relative z-10">
          <AnimatedSection>
            <div className="text-center max-w-2xl mx-auto">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-violet-500/30">
                <Grid3X3 className="w-10 h-10 text-white" />
              </div>
              <h1 className="font-cairo font-black text-3xl md:text-4xl lg:text-5xl text-white mb-4">
                {t('categoriesPage.title')}
              </h1>
              <p className="text-violet-200/70 text-lg">
                {t('categoriesPage.subtitle')} {displayName}
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 md:py-24">
        <div className="container">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-card animate-pulse" />
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categories.map((cat, i) => (
                <AnimatedSection key={cat.name} delay={i * 60}>
                  <Link to={`/products?category=${encodeURIComponent(cat.name)}`}>
                    <div className="relative rounded-2xl overflow-hidden group cursor-pointer border border-border/40 hover:border-violet-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1 bg-card p-5">
                      {/* Shimmer overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                      <div className="relative z-10 flex items-start gap-4">
                        {/* Icon */}
                        <div className="shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 flex items-center justify-center group-hover:scale-110 group-hover:border-violet-500/40 transition-all duration-300">
                          {cat.image ? (
                            <img src={cat.image} alt={cat.name} className="w-8 h-8 object-contain" />
                          ) : (
                            <span className="text-2xl">📦</span>
                          )}
                        </div>

                        {/* Text content */}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-cairo font-bold text-lg text-foreground group-hover:text-violet-400 transition-colors mb-1 line-clamp-1">
                            {cat.name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {t('categoriesPage.cardFallbackDescription')}
                          </p>
                        </div>

                        {/* Arrow */}
                        <ChevronLeft className="w-5 h-5 text-muted-foreground/50 group-hover:text-violet-400 group-hover:-translate-x-1 transition-all shrink-0 mt-1" />
                      </div>
                    </div>
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border">
              <Package className="w-14 h-14 text-muted-foreground/30 mx-auto mb-5" />
              <p className="text-muted-foreground text-lg">{t('categoriesPage.empty.title')}</p>
              <p className="text-muted-foreground/60 text-sm mt-1">{t('categoriesPage.empty.description')}</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16">
        <div className="container text-center">
          <AnimatedSection>
            <h2 className="font-cairo font-bold text-2xl md:text-3xl text-foreground mb-4">
              {t('categoriesPage.cta.title')}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {t('categoriesPage.cta.description')}
            </p>
            <Link to="/products">
              <Button size="lg" className="font-bold h-14 px-10 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 shadow-xl shadow-violet-500/30 transition-all group">
                {t('categoriesPage.cta.button')}
                <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
