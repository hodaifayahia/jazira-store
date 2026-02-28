import { useState, useEffect, useCallback } from 'react';

const RECENTLY_VIEWED_KEY = 'dz-store-recently-viewed';
const MAX_RECENT = 12;

export interface RecentlyViewedItem {
  id: string;
  name: string;
  price: number;
  image: string;
  viewedAt: string;
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>(() => {
    try {
      const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: Omit<RecentlyViewedItem, 'viewedAt'>) => {
    setItems(prev => {
      const filtered = prev.filter(i => i.id !== item.id);
      return [{ ...item, viewedAt: new Date().toISOString() }, ...filtered].slice(0, MAX_RECENT);
    });
  }, []);

  const clearHistory = useCallback(() => setItems([]), []);

  return { items, addItem, clearHistory };
}
