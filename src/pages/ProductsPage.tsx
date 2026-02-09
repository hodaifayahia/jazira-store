import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ProductCard from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/LoadingSkeleton';
import { useCategories } from '@/hooks/useCategories';
import { formatPrice } from '@/lib/format';

const SORT_OPTIONS = [
  { value: 'newest', label: 'الأحدث' },
  { value: 'cheapest', label: 'الأرخص' },
  { value: 'expensive', label: 'الأغلى' },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategory ? [initialCategory] : []);
  const [sort, setSort] = useState('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { data: categoriesData } = useCategories();
  const categoryNames = categoriesData?.map(c => c.name) || [];

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', sort],
    queryFn: async () => {
      let query = supabase.from('products').select('*').eq('is_active', true);
      if (sort === 'newest') query = query.order('created_at', { ascending: false });
      else if (sort === 'cheapest') query = query.order('price', { ascending: true });
      else if (sort === 'expensive') query = query.order('price', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Compute max price for slider
  const maxPrice = useMemo(() => {
    if (!products) return 100000;
    return Math.max(...products.map(p => Number(p.price)), 10000);
  }, [products]);

  // Client-side filtering
  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      if (search && !p.name.includes(search)) return false;
      if (selectedCategories.length > 0) {
        const pCats = p.category || [];
        if (!selectedCategories.some(sc => pCats.includes(sc))) return false;
      }
      const price = Number(p.price);
      if (price < priceRange[0] || price > priceRange[1]) return false;
      if (inStockOnly && (p.stock ?? 0) <= 0) return false;
      return true;
    });
  }, [products, search, selectedCategories, priceRange, inStockOnly]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategories([]);
    setPriceRange([0, maxPrice]);
    setInStockOnly(false);
    setSort('newest');
    searchParams.delete('category');
    setSearchParams(searchParams);
  };

  const activeFilterCount = [
    selectedCategories.length > 0,
    priceRange[0] > 0 || priceRange[1] < maxPrice,
    inStockOnly,
    search.length > 0,
  ].filter(Boolean).length;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <Label className="font-cairo font-semibold text-sm mb-2 block">البحث</Label>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن منتج..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-10 font-cairo"
          />
        </div>
      </div>

      {/* Categories */}
      {categoryNames.length > 0 && (
        <div>
          <Label className="font-cairo font-semibold text-sm mb-3 block">الفئات</Label>
          <div className="space-y-2.5">
            {categoryNames.map(cat => (
              <label key={cat} className="flex items-center gap-2.5 cursor-pointer">
                <Checkbox
                  checked={selectedCategories.includes(cat)}
                  onCheckedChange={() => toggleCategory(cat)}
                />
                <span className="font-cairo text-sm">{cat}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <Label className="font-cairo font-semibold text-sm mb-3 block">نطاق السعر</Label>
        <Slider
          min={0}
          max={maxPrice}
          step={100}
          value={priceRange}
          onValueChange={(v) => setPriceRange(v as [number, number])}
          className="mb-3"
        />
        <div className="flex items-center justify-between text-xs font-roboto text-muted-foreground">
          <span>{formatPrice(priceRange[0])}</span>
          <span>{formatPrice(priceRange[1])}</span>
        </div>
      </div>

      {/* In Stock */}
      <div className="flex items-center justify-between">
        <Label className="font-cairo font-semibold text-sm">متوفر فقط</Label>
        <Switch checked={inStockOnly} onCheckedChange={setInStockOnly} />
      </div>

      {/* Sort */}
      <div>
        <Label className="font-cairo font-semibold text-sm mb-2 block">الترتيب</Label>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="font-cairo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value} className="font-cairo">{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear */}
      {activeFilterCount > 0 && (
        <Button variant="outline" onClick={clearFilters} className="w-full font-cairo gap-2 rounded-xl">
          <X className="w-4 h-4" />
          مسح الكل
        </Button>
      )}
    </div>
  );

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-cairo font-bold text-3xl">المنتجات</h1>
        {/* Mobile filter trigger */}
        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="lg:hidden font-cairo gap-2 rounded-xl">
              <SlidersHorizontal className="w-4 h-4" />
              الفلاتر
              {activeFilterCount > 0 && (
                <Badge className="font-roboto text-[10px] h-5 w-5 p-0 flex items-center justify-center">{activeFilterCount}</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="font-cairo">الفلاتر</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active filters badges */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {selectedCategories.map(cat => (
            <Badge key={cat} variant="secondary" className="font-cairo gap-1 cursor-pointer hover:bg-destructive/10" onClick={() => toggleCategory(cat)}>
              {cat}
              <X className="w-3 h-3" />
            </Badge>
          ))}
          {inStockOnly && (
            <Badge variant="secondary" className="font-cairo gap-1 cursor-pointer hover:bg-destructive/10" onClick={() => setInStockOnly(false)}>
              متوفر فقط
              <X className="w-3 h-3" />
            </Badge>
          )}
          {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
            <Badge variant="secondary" className="font-cairo gap-1 cursor-pointer hover:bg-destructive/10" onClick={() => setPriceRange([0, maxPrice])}>
              {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
              <X className="w-3 h-3" />
            </Badge>
          )}
          {search && (
            <Badge variant="secondary" className="font-cairo gap-1 cursor-pointer hover:bg-destructive/10" onClick={() => setSearch('')}>
              "{search}"
              <X className="w-3 h-3" />
            </Badge>
          )}
        </div>
      )}

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20 bg-card border rounded-2xl p-5">
            <h2 className="font-cairo font-bold text-lg mb-5 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              الفلاتر
            </h2>
            <FilterContent />
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1 min-w-0">
          <p className="font-cairo text-sm text-muted-foreground mb-4">
            {filtered.length} منتج
          </p>
          {isLoading ? (
            <ProductGridSkeleton />
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(p => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  price={Number(p.price)}
                  image={p.images?.[p.main_image_index ?? 0] || p.images?.[0] || ''}
                  images={p.images || []}
                  mainImageIndex={p.main_image_index ?? 0}
                  category={p.category || []}
                  stock={p.stock ?? 0}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="font-cairo text-muted-foreground text-lg">لا توجد منتجات مطابقة لبحثك</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
