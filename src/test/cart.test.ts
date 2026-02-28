import { describe, it, expect, beforeEach } from 'vitest';

const CART_KEY = 'dz-store-cart';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
  shippingPrice?: number;
}

function getCartKey(item: { id: string; variation?: any; variantId?: string }) {
  if (item.variantId) return `${item.id}__variant:${item.variantId}`;
  if (item.variation) return `${item.id}__${item.variation.type}:${item.variation.value}`;
  return item.id;
}

function addItemToCart(items: CartItem[], newItem: Omit<CartItem, 'quantity'>): CartItem[] {
  const existing = items.find(i => getCartKey(i) === getCartKey(newItem));
  if (existing) {
    return items.map(i =>
      getCartKey(i) === getCartKey(newItem)
        ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) }
        : i
    );
  }
  return [...items, { ...newItem, quantity: 1 }];
}

function removeItemFromCart(items: CartItem[], id: string): CartItem[] {
  return items.filter(i => i.id !== id);
}

function calcSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

describe('Cart Logic', () => {
  let items: CartItem[];

  beforeEach(() => {
    items = [];
    localStorage.removeItem(CART_KEY);
  });

  it('should add item to empty cart', () => {
    items = addItemToCart(items, { id: '1', name: 'Product A', price: 1000, image: '', stock: 10 });
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(1);
  });

  it('should increment quantity for duplicate item', () => {
    items = addItemToCart(items, { id: '1', name: 'Product A', price: 1000, image: '', stock: 10 });
    items = addItemToCart(items, { id: '1', name: 'Product A', price: 1000, image: '', stock: 10 });
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it('should not exceed stock limit', () => {
    items = addItemToCart(items, { id: '1', name: 'Product A', price: 1000, image: '', stock: 2 });
    items = addItemToCart(items, { id: '1', name: 'Product A', price: 1000, image: '', stock: 2 });
    items = addItemToCart(items, { id: '1', name: 'Product A', price: 1000, image: '', stock: 2 });
    expect(items[0].quantity).toBe(2);
  });

  it('should add different items separately', () => {
    items = addItemToCart(items, { id: '1', name: 'Product A', price: 1000, image: '', stock: 10 });
    items = addItemToCart(items, { id: '2', name: 'Product B', price: 2000, image: '', stock: 5 });
    expect(items).toHaveLength(2);
  });

  it('should remove item from cart', () => {
    items = addItemToCart(items, { id: '1', name: 'Product A', price: 1000, image: '', stock: 10 });
    items = addItemToCart(items, { id: '2', name: 'Product B', price: 2000, image: '', stock: 5 });
    items = removeItemFromCart(items, '1');
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('2');
  });

  it('should calculate correct subtotal', () => {
    items = addItemToCart(items, { id: '1', name: 'Product A', price: 1000, image: '', stock: 10 });
    items = addItemToCart(items, { id: '1', name: 'Product A', price: 1000, image: '', stock: 10 });
    items = addItemToCart(items, { id: '2', name: 'Product B', price: 2500, image: '', stock: 5 });
    expect(calcSubtotal(items)).toBe(4500);
  });

  it('should persist to localStorage', () => {
    items = addItemToCart(items, { id: '1', name: 'Product A', price: 1000, image: '', stock: 10 });
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    const restored: CartItem[] = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    expect(restored).toHaveLength(1);
    expect(restored[0].name).toBe('Product A');
  });

  it('should handle variant keys correctly', () => {
    const item1 = { id: '1', variantId: 'v1' };
    const item2 = { id: '1', variantId: 'v2' };
    const item3 = { id: '1' };
    expect(getCartKey(item1)).toBe('1__variant:v1');
    expect(getCartKey(item2)).toBe('1__variant:v2');
    expect(getCartKey(item3)).toBe('1');
    expect(getCartKey(item1)).not.toBe(getCartKey(item2));
  });
});
