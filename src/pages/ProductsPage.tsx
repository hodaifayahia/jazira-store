import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, SlidersHorizontal } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProductCard from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/LoadingSkeleton';
import { useCategories } from '@/hooks/useCategories';

const SORT_OPTIONS = [
  { value: 'newest', label: 'الأحدث' },
  { value: 'cheapest', label: 'الأرخص' },
  { value: 'expensive', label: 'الأغلى' },
];

export default function ProductsPage() {
  usePageTitle('تصفح منتجاتنا - DZ Store');
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'الكل';
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState('newest');

  const { data: categoriesSettings } = useCategories();
  const categoryNames = ['الكل', ...(categoriesSettings?.map(c => c.name) || [])];

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', category, sort],
    queryFn: async () => {
      let query = supabase.from('products').select('*').eq('is_active', true);
      if (category !== 'الكل') query = query.contains('category', [category]);
      if (sort === 'newest') query = query.order('created_at', { ascending: false });
      else if (sort === 'cheapest') query = query.order('price', { ascending: true });
      else if (sort === 'expensive') query = query.order('price', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filtered = products?.filter(p => p.name.includes(search)) || [];

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    if (val === 'الكل') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', val);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="container py-8">
      <h1 className="font-cairo font-bold text-3xl mb-6">المنتجات</h1>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن منتج..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-10 font-cairo"
          />
        </div>
        <Select value={category} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full sm:w-44 font-cairo">
            <SlidersHorizontal className="w-4 h-4 ml-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categoryNames.map(c => (
              <SelectItem key={c} value={c} className="font-cairo">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full sm:w-36 font-cairo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value} className="font-cairo">{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <ProductGridSkeleton />
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => {
            const mainIdx = p.main_image_index ?? 0;
            const cats = Array.isArray(p.category) ? p.category : [p.category];
            return (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                price={Number(p.price)}
                image={p.images?.[mainIdx] || p.images?.[0] || ''}
                category={cats.join('، ')}
                stock={p.stock ?? 0}
                shippingPrice={Number(p.shipping_price ?? 0)}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="font-cairo text-muted-foreground text-lg">لا توجد منتجات مطابقة لبحثك</p>
        </div>
      )}
    </div>
  );
}
