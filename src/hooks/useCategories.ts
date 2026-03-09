import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  name: string;
  icon: string;
  image?: string;
}

const normalizeCategories = (raw: unknown): Category[] => {
  if (!raw) return [];

  const parsed = typeof raw === 'string'
    ? (() => {
        try {
          return JSON.parse(raw);
        } catch {
          return [];
        }
      })()
    : raw;

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item: unknown) => {
      if (typeof item === 'string') {
        const name = item.trim();
        return name ? { name, icon: 'Tag' } : null;
      }

      if (!item || typeof item !== 'object') return null;

      const rec = item as Record<string, unknown>;
      const name = typeof rec.name === 'string' ? rec.name.trim() : '';
      if (!name) return null;

      return {
        name,
        icon: typeof rec.icon === 'string' && rec.icon.trim() ? rec.icon : 'Tag',
        image: typeof rec.image === 'string' ? rec.image : undefined,
      } satisfies Category;
    })
    .filter((cat): cat is Category => Boolean(cat));
};

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
      return normalizeCategories(data?.value);
    },
    staleTime: 5 * 60 * 1000,
  });
}
