import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function hexToHsl(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function useStoreTheme() {
  const { data: colors } = useQuery({
    queryKey: ['store-theme-colors'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('*').in('key', ['primary_color', 'secondary_color']);
      const map: Record<string, string> = {};
      data?.forEach(s => { map[s.key] = s.value || ''; });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!colors) return;
    const primary = colors.primary_color;
    const secondary = colors.secondary_color;
    if (primary) {
      const hsl = hexToHsl(primary);
      if (hsl) {
        document.documentElement.style.setProperty('--primary', hsl);
        document.documentElement.style.setProperty('--ring', hsl);
        document.documentElement.style.setProperty('--sidebar-primary', hsl);
        document.documentElement.style.setProperty('--sidebar-ring', hsl);
        // Accent derived from primary
        const result = /^(\d+)\s/.exec(hsl);
        if (result) {
          document.documentElement.style.setProperty('--accent', `${result[1]} 63% 95%`);
          document.documentElement.style.setProperty('--accent-foreground', `${result[1]} 63% 30%`);
        }
      }
    }
    if (secondary) {
      const hsl = hexToHsl(secondary);
      if (hsl) {
        document.documentElement.style.setProperty('--secondary', hsl);
      }
    }
  }, [colors]);
}
