import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItemVariation {
  type: string;
  value: string;
  priceAdjustment: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
  shippingPrice?: number;
  variation?: CartItemVariation;
  // New variant system
  variantId?: string;
  variantSku?: string;
  variantOptionValues?: Record<string, string>;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string, variation?: CartItemVariation, variantId?: string) => void;
  updateQuantity: (id: string, quantity: number, variation?: CartItemVariation, variantId?: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = 'dz-store-cart';

function getCartKey(item: { id: string; variation?: CartItemVariation; variantId?: string }) {
  if (item.variantId) return `${item.id}__variant:${item.variantId}`;
  if (item.variation) return `${item.id}__${item.variation.type}:${item.variation.value}`;
  return item.id;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => getCartKey(i) === getCartKey(item));
      if (existing) {
        return prev.map(i => getCartKey(i) === getCartKey(item) ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id: string, variation?: CartItemVariation, variantId?: string) => {
    const key = getCartKey({ id, variation, variantId });
    setItems(prev => prev.filter(i => getCartKey(i) !== key));
  };

  const updateQuantity = (id: string, quantity: number, variation?: CartItemVariation, variantId?: string) => {
    const key = getCartKey({ id, variation, variantId });
    if (quantity <= 0) return removeItem(id, variation, variantId);
    setItems(prev => prev.map(i => getCartKey(i) === key ? { ...i, quantity: Math.min(quantity, i.stock) } : i));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + (i.price + (i.variation?.priceAdjustment || 0)) * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
