import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
  shippingPrice: number;
}

export type CheckoutIntent =
  | { type: 'cart' }
  | { type: 'direct'; items: CartItem[] };

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  removeItems: (ids: string[]) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  ensureInCart: (items: CartItem[]) => void;
  totalItems: number;
  subtotal: number;
  checkoutIntent: CheckoutIntent;
  setCheckoutIntent: (intent: CheckoutIntent) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = 'dz-store-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [checkoutIntent, setCheckoutIntent] = useState<CheckoutIntent>({ type: 'cart' });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const removeItems = (ids: string[]) => setItems(prev => prev.filter(i => !ids.includes(i.id)));

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) return removeItem(id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.min(quantity, i.stock) } : i));
  };

  const clearCart = () => setItems([]);

  const ensureInCart = (newItems: CartItem[]) => {
    setItems(prev => {
      const updated = [...prev];
      for (const item of newItems) {
        const existing = updated.find(i => i.id === item.id);
        if (!existing) {
          updated.push(item);
        }
      }
      return updated;
    });
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, removeItems, updateQuantity, clearCart, ensureInCart, totalItems, subtotal, checkoutIntent, setCheckoutIntent }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
