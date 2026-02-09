import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  name: string;
  icon: string;
  image?: string;
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'categories')
        .maybeSingle();
      if (error) throw error;
      if (!data?.value) return [];
      return JSON.parse(data.value) as Category[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
