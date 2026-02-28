import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const PRODUCTS_CACHE_KEY = 'dz-store-products-cache';
const CATEGORIES_CACHE_KEY = 'dz-store-categories-cache';
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

interface CachedData<T> {
  data: T;
  timestamp: number;
}

function setCache<T>(key: string, data: T) {
  try {
    const cached: CachedData<T> = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(cached));
  } catch {
    // localStorage full — clear old caches
    try {
      localStorage.removeItem(PRODUCTS_CACHE_KEY);
      localStorage.removeItem(CATEGORIES_CACHE_KEY);
    } catch {}
  }
}

function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const cached: CachedData<T> = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_EXPIRY && navigator.onLine) return null;
    return cached.data;
  } catch {
    return null;
  }
}

export function useOfflineProducts() {
  const query = useQuery({
    queryKey: ['offline-products-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: () => getCache<any[]>(PRODUCTS_CACHE_KEY) || undefined,
  });

  // Cache products whenever we get fresh data
  useEffect(() => {
    if (query.data && query.data.length > 0 && !query.isPlaceholderData) {
      setCache(PRODUCTS_CACHE_KEY, query.data);
    }
  }, [query.data, query.isPlaceholderData]);

  return query;
}

export function useOfflineCategories() {
  const query = useQuery({
    queryKey: ['offline-categories-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: () => getCache<any[]>(CATEGORIES_CACHE_KEY) || undefined,
  });

  useEffect(() => {
    if (query.data && query.data.length > 0 && !query.isPlaceholderData) {
      setCache(CATEGORIES_CACHE_KEY, query.data);
    }
  }, [query.data, query.isPlaceholderData]);

  return query;
}
