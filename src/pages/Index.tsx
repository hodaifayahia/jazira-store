import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Search, ChevronLeft, ShoppingBag, Play, Zap, Shield,
  Headphones, CheckCircle, Sparkles, ExternalLink, Youtube, MessageCircle, Instagram
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/LoadingSkeleton';
import AnimatedSection from '@/components/AnimatedSection';
import { useTranslation } from '@/i18n';

export default function IndexPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: whatsappNumber } = useQuery({
    queryKey: ['whatsapp-number'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'footer_phone').maybeSingle();
      return data?.value || '';
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: instagramUrl } = useQuery({
    queryKey: ['instagram-url'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'instagram_url').maybeSingle();
      return data?.value || '';
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: facebookUrl } = useQuery({
    queryKey: ['facebook-url'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'facebook_url').maybeSingle();
      return data?.value || '';
    },
    staleTime: 10 * 60 * 1000,
  });

  const newestProducts = allProducts?.slice(0, 8) || [];
  const contactUrl = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}` : '/about';
  const followUrl = instagramUrl || facebookUrl || '/about';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const trustBadges = [
    { icon: CheckCircle, label: t('home.badge.trusted'), color: 'text-emerald-400' },
    { icon: Shield, label: t('home.badge.secure'), color: 'text-blue-400' },
    { icon: Headphones, label: t('home.badge.support'), color: 'text-violet-400' },
    { icon: Zap, label: t('home.badge.instant'), color: 'text-amber-400' },
  ];

  const renderProductGrid = (products: typeof newestProducts) => (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {products.map((p, i) => (
        <div key={p.id} style={{ animationDelay: `${i * 0.08}s` }} className="animate-fade-in opacity-0 [animation-fill-mode:forwards]">
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
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ─── Hero Section ─── */}
      <section className="relative isolate overflow-hidden min-h-[85vh] flex items-center">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e27] via-[#1a1145] to-[#0d1440]" />

        {/* Animated orbs */}
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] animate-float-slow" />

        {/* Large background text */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
          <span className="hero-bg-text whitespace-nowrap opacity-60">SloutionsHub</span>
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />

        <div className="container relative z-10 py-20 md:py-28">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="animate-fade-in">
                <span className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-wide text-violet-200 bg-violet-900/40 backdrop-blur-md rounded-full px-6 py-2.5 border border-violet-400/20 shadow-lg shadow-violet-500/10">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-400" />
                  </span>
                  {t('home.hero.badge')}
                </span>
            </div>

            {/* Main heading */}
            <h1 className="font-cairo font-black text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.2] tracking-tight animate-fade-in" style={{ animationDelay: '0.15s' }}>
              {t('home.hero.title.before')}{' '}
              <span className="gradient-text">{t('home.hero.title.highlight')}</span>{' '}
              {t('home.hero.title.after')}
            </h1>

            {/* Decorative line */}
            <div className="flex items-center gap-3 justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="h-[2px] w-16 bg-gradient-to-l from-violet-500 to-transparent" />
              <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
              <div className="h-[2px] w-16 bg-gradient-to-r from-blue-500 to-transparent" />
            </div>

            {/* Subtitle */}
            <p className="text-violet-200/70 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.25s' }}>
              {t('home.hero.subtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Link to="/products">
                <Button size="lg" className="font-semibold text-base px-8 h-14 gap-2.5 rounded-2xl shadow-xl shadow-violet-500/25 hover:shadow-2xl hover:shadow-violet-500/35 hover:scale-[1.03] transition-all duration-300 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 group">
                  {t('home.hero.cta.products')}
                  <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/products">
                <Button size="lg" variant="outline" className="font-semibold text-base px-8 h-14 rounded-2xl border-violet-400/25 text-violet-200 hover:bg-violet-500/10 hover:text-white hover:border-violet-400/50 backdrop-blur-md bg-white/5 transition-all duration-300">
                  {t('home.hero.cta.categories')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust Platform Banner ─── */}
      <AnimatedSection>
        <section className="relative -mt-16 z-20 pb-8">
          <div className="container">
            <div className="bg-gradient-to-br from-violet-600/90 via-purple-600/85 to-indigo-700/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-violet-500/20 p-8 md:p-10 border border-violet-400/20">
              <div className="text-center space-y-4">
                <h2 className="font-cairo font-bold text-2xl md:text-3xl text-white">
                  {t('home.trust.title')}
                </h2>
                <p className="text-violet-100/80 text-base md:text-lg max-w-2xl mx-auto">
                  {t('home.trust.subtitle')}
                </p>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {trustBadges.map((badge, i) => (
                  <div key={i} className="flex items-center justify-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-all duration-300">
                    <badge.icon className={`w-5 h-5 ${badge.color}`} />
                    <span className="text-white font-medium text-sm">{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ─── Announcement Section ─── */}
      <AnimatedSection>
        <section className="py-8">
          <div className="container">
            <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-6 md:p-8 shadow-xl">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0">
                  <span className="text-3xl">🎉</span>
                </div>
                <div className="flex-1 text-center md:text-right">
                  <h3 className="font-cairo font-bold text-xl text-foreground mb-2">
                    {t('home.announcement.title')}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('home.announcement.subtitle')}
                  </p>
                </div>
                <div className="shrink-0">
                  <Link to="/products">
                    <Button className="font-semibold gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500">
                      {t('home.announcement.cta')}
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ─── How to Buy Video Section ─── */}
      <AnimatedSection>
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="text-center mb-8">
              <span className="text-sm font-semibold text-violet-400 bg-violet-500/10 rounded-full px-5 py-2 inline-block mb-4">
                🎬 {t('home.video.badge')}
              </span>
              <h2 className="font-cairo font-bold text-2xl md:text-3xl text-foreground">
                {t('home.video.title')}
              </h2>
            </div>

            <div className="max-w-3xl mx-auto">
              <div className="relative rounded-3xl overflow-hidden border border-border/50 shadow-2xl shadow-violet-500/10 group cursor-pointer bg-gradient-to-br from-violet-900/30 to-blue-900/30">
                <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-[#1a1145]/80 to-[#0d1440]/80">
                  {/* Video thumbnail placeholder */}
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-blue-600/5" />
                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-2xl shadow-red-500/30 group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-8 h-8 text-white fill-white mr-[-4px]" />
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <Youtube className="w-5 h-5 text-red-500" />
                      <span className="text-sm font-medium">{t('home.video.watch')}</span>
                    </div>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-white/80 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    {t('home.video.tag')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ─── Search Section ─── */}
      <AnimatedSection>
        <section className="py-8">
          <div className="container">
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('home.search.placeholder')}
                    className="w-full pr-12 pl-4 py-4 rounded-2xl bg-card border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all duration-300"
                  />
                  <Button type="submit" size="sm" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500">
                    {t('home.search.button')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ─── Categories Section ─── */}
      <section className="py-12 md:py-16">
        <div className="container">
          <AnimatedSection>
            <div className="text-center mb-10">
              <span className="text-sm font-semibold text-violet-400 bg-violet-500/10 rounded-full px-5 py-2 inline-block mb-4">
                📂 {t('home.categories.badge')}
              </span>
              <h2 className="font-cairo font-bold text-2xl md:text-3xl text-foreground">
                {t('home.categories.title')}
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {categories?.slice(0, 12).map((cat, i) => (
              <AnimatedSection key={cat.id} delay={i * 80}>
                <Link to={`/products?category=${encodeURIComponent(cat.name)}`}>
                  <div className="relative rounded-2xl overflow-hidden h-32 group cursor-pointer border border-border/30 hover:border-violet-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1 bg-gradient-to-br from-violet-600/20 via-purple-600/15 to-blue-600/20">
                    {/* Shimmer overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-12 h-12 object-contain mb-2 group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
                          <span className="text-2xl">📦</span>
                        </div>
                      )}
                      <h3 className="font-cairo font-bold text-sm text-foreground line-clamp-2">{cat.name}</h3>
                    </div>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/products">
              <Button variant="outline" className="font-semibold gap-2 rounded-xl border-violet-500/20 hover:border-violet-500/40 hover:bg-violet-500/5 text-violet-400">
                {t('home.categories.viewAll')}
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Featured Products ─── */}
      <section className="py-12 md:py-20 bg-muted/30 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,hsl(263_70%_50%/0.05),transparent)]" />
        <div className="container relative">
          <AnimatedSection>
            <div className="flex items-end justify-between gap-4 mb-10">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-md shadow-violet-500/20">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-violet-400 bg-violet-500/10 rounded-full px-3 py-1">⭐ {t('home.featured.badge')}</span>
                </div>
                <h2 className="font-cairo font-bold text-2xl md:text-3xl text-foreground">{t('home.featured.title')}</h2>
                <p className="text-muted-foreground mt-1.5 text-sm md:text-base">{t('home.featured.subtitle')}</p>
                <div className="h-[3px] w-20 bg-gradient-to-l from-violet-500 to-blue-500 rounded-full mt-3" />
              </div>
              <Link to="/products" className="shrink-0">
                <Button variant="outline" className="font-semibold gap-1.5 text-violet-400 border-violet-500/20 hover:border-violet-500/40 hover:bg-violet-500/5 rounded-xl group">
                  {t('home.featured.viewAll')}
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={100}>
            {isLoading ? <ProductGridSkeleton /> : newestProducts.length > 0 ? renderProductGrid(newestProducts) : (
              <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border">
                <ShoppingBag className="w-14 h-14 text-muted-foreground/30 mx-auto mb-5" />
                <p className="text-muted-foreground text-lg">{t('home.featured.emptyTitle')}</p>
                <p className="text-muted-foreground/60 text-sm mt-1">{t('home.featured.emptySubtitle')}</p>
              </div>
            )}
          </AnimatedSection>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="relative overflow-hidden grain-texture">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 animated-gradient" />
        {/* Decorative shapes */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-sm" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3 blur-sm" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5" />

        <div className="container relative z-10 py-16 md:py-24 text-center">
          <AnimatedSection>
            <span className="inline-block mb-5 text-4xl">💬</span>
            <h2 className="font-cairo font-bold text-3xl md:text-4xl text-white mb-4">
              {t('home.cta.title')}
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
              {t('home.cta.subtitle')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href={contactUrl} target={contactUrl.startsWith('http') ? '_blank' : undefined} rel={contactUrl.startsWith('http') ? 'noopener noreferrer' : undefined}>
                <Button size="lg" className="font-semibold text-lg px-9 h-14 rounded-2xl gap-2.5 bg-white text-violet-700 hover:bg-white/90 shadow-xl shadow-black/20 hover:shadow-2xl hover:scale-[1.04] transition-all duration-300 group">
                  {t('home.cta.contact')}
                  <MessageCircle className="w-5 h-5" />
                </Button>
              </a>

              <a href={followUrl} target={followUrl.startsWith('http') ? '_blank' : undefined} rel={followUrl.startsWith('http') ? 'noopener noreferrer' : undefined}>
                <Button size="lg" variant="outline" className="font-semibold text-lg px-9 h-14 rounded-2xl gap-2.5 border-white/35 text-white hover:bg-white/10 hover:border-white/55 transition-all duration-300">
                  {t('home.cta.follow')}
                  <Instagram className="w-5 h-5" />
                </Button>
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
