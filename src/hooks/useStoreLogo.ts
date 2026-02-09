import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useStoreLogo() {
  return useQuery({
    queryKey: ['store-logo'],
    queryFn: async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'store_logo')
        .maybeSingle();
      return data?.value || null;
    },
    staleTime: 10 * 60 * 1000,
  });
}
