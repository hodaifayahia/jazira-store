import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

const WISHLIST_KEY = 'dz-store-wishlist';
const MAX_WISHLIST = 50;

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
  addedAt: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  addItem: (item: Omit<WishlistItem, 'addedAt'>) => void;
  removeItem: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  toggleWishlist: (item: Omit<WishlistItem, 'addedAt'>) => void;
  totalItems: number;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: Omit<WishlistItem, 'addedAt'>) => {
    setItems(prev => {
      if (prev.some(i => i.id === item.id)) return prev;
      const newItems = [{ ...item, addedAt: new Date().toISOString() }, ...prev];
      return newItems.slice(0, MAX_WISHLIST);
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const isInWishlist = useCallback((id: string) => {
    return items.some(i => i.id === id);
  }, [items]);

  const toggleWishlist = useCallback((item: Omit<WishlistItem, 'addedAt'>) => {
    if (items.some(i => i.id === item.id)) {
      removeItem(item.id);
    } else {
      addItem(item);
    }
  }, [items, addItem, removeItem]);

  const clearWishlist = useCallback(() => setItems([]), []);

  return (
    <WishlistContext.Provider value={{
      items,
      addItem,
      removeItem,
      isInWishlist,
      toggleWishlist,
      totalItems: items.length,
      clearWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
