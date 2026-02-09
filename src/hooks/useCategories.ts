import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  name: string;
  icon: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { name: 'أدوات منزلية', icon: 'Home' },
  { name: 'منتجات زينة', icon: 'Sparkles' },
  { name: 'إكسسوارات', icon: 'Watch' },
];

export function useCategories() {
  return useQuery({
    queryKey: ['categories-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'categories')
        .maybeSingle();
      if (error) throw error;
      if (data?.value) {
        try {
          return JSON.parse(data.value) as Category[];
        } catch {
          return DEFAULT_CATEGORIES;
        }
      }
      return DEFAULT_CATEGORIES;
    },
    staleTime: 5 * 60 * 1000,
  });
}
