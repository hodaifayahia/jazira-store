import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowLeft, Star, ShoppingCart, TrendingUp, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/format';

interface SmartSearchProps {
  onClose: () => void;
}

export default function SmartSearch({ onClose }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Get recent searches from localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('recent_searches') || '[]');
    } catch { return []; }
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Search products from Supabase
  const { data: results, isLoading } = useQuery({
    queryKey: ['smart-search', query],
    queryFn: async () => {
      if (query.length < 2) return [];
      const { data } = await supabase
        .from('products')
        .select('id, name, price, old_price, images, main_image_index, category, stock')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(8);
      return data || [];
    },
    enabled: query.length >= 2,
    staleTime: 30000,
  });

  // Trending products (bestsellers)
  const { data: trending } = useQuery({
    queryKey: ['trending-products-search'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, price, images, main_image_index')
        .order('created_at', { ascending: false })
        .limit(4);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const saveSearch = useCallback((term: string) => {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  }, [recentSearches]);

  const handleSelect = (productId: string, productName: string) => {
    saveSearch(productName);
    navigate(`/product/${productId}`);
    onClose();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveSearch(query.trim());
      navigate(`/products?search=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent_searches');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-foreground/50 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="max-w-2xl mx-auto mt-4 md:mt-20 mx-4 md:mx-auto bg-card rounded-3xl shadow-2xl border border-border/30 overflow-hidden animate-in slide-in-from-top-4 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 p-4 border-b border-border/30">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ابحث عن منتج..."
            className="flex-1 bg-transparent border-none outline-none font-cairo text-base text-foreground placeholder:text-muted-foreground/50"
            dir="rtl"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="p-1 rounded-full hover:bg-muted transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
        </form>

        {/* Results area */}
        <div className="max-h-[60vh] overflow-y-auto p-3">
          {/* Loading */}
          {isLoading && query.length >= 2 && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Search results */}
          {results && results.length > 0 && (
            <div className="space-y-1">
              <p className="font-cairo text-xs text-muted-foreground font-medium px-2 py-1">
                {results.length} نتيجة
              </p>
              {results.map(product => {
                const img = product.images?.[product.main_image_index ?? 0] || product.images?.[0];
                const discount = product.old_price && product.old_price > product.price
                  ? Math.round((1 - product.price / product.old_price) * 100)
                  : 0;
                return (
                  <button
                    key={product.id}
                    onClick={() => handleSelect(product.id, product.name)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-muted/60 transition-colors group text-right"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0">
                      {img && <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-cairo font-bold text-sm text-foreground truncate">{product.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-roboto font-extrabold text-primary text-sm">{formatPrice(product.price)}</span>
                        {discount > 0 && (
                          <span className="text-[10px] bg-red-500/10 text-red-500 font-cairo font-bold px-1.5 py-0.5 rounded-full">-{discount}%</span>
                        )}
                      </div>
                      {Array.isArray(product.category) && (
                        <p className="font-cairo text-[10px] text-muted-foreground mt-0.5">{product.category.join(' · ')}</p>
                      )}
                    </div>
                    {(product.stock ?? 0) <= 0 && (
                      <span className="font-cairo text-[10px] text-destructive font-bold">نفذ</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* No results */}
          {query.length >= 2 && results && results.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <ShoppingCart className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="font-cairo text-sm text-muted-foreground">لا توجد نتائج لـ "{query}"</p>
              <button
                onClick={() => { navigate('/products'); onClose(); }}
                className="font-cairo text-xs text-primary hover:underline mt-2 inline-block"
              >
                تصفح جميع المنتجات
              </button>
            </div>
          )}

          {/* Empty state: recent searches + trending */}
          {query.length < 2 && (
            <div className="space-y-4">
              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-2 py-1">
                    <p className="font-cairo text-xs text-muted-foreground font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> عمليات البحث الأخيرة
                    </p>
                    <button onClick={clearRecent} className="font-cairo text-[10px] text-muted-foreground hover:text-destructive">
                      مسح
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-2 mt-1">
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => setQuery(term)}
                        className="font-cairo text-xs bg-muted/50 hover:bg-muted text-muted-foreground px-3 py-1.5 rounded-full border border-border/30 transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending */}
              {trending && trending.length > 0 && (
                <div>
                  <p className="font-cairo text-xs text-muted-foreground font-bold px-2 py-1 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> الأكثر رواجاً
                  </p>
                  <div className="space-y-0.5 mt-1">
                    {trending.map(product => {
                      const img = product.images?.[product.main_image_index ?? 0] || product.images?.[0];
                      return (
                        <button
                          key={product.id}
                          onClick={() => handleSelect(product.id, product.name)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/60 transition-colors group text-right"
                        >
                          <div className="w-11 h-11 rounded-lg overflow-hidden bg-muted shrink-0">
                            {img && <img src={img} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-cairo font-medium text-sm text-foreground truncate">{product.name}</p>
                            <span className="font-roboto font-bold text-primary text-xs">{formatPrice(product.price)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
