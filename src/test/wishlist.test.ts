import { describe, it, expect, beforeEach } from 'vitest';

const WISHLIST_KEY = 'dz-store-wishlist';
const MAX_WISHLIST = 50;

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
  addedAt: string;
}

function addToWishlist(items: WishlistItem[], item: Omit<WishlistItem, 'addedAt'>): WishlistItem[] {
  if (items.some(i => i.id === item.id)) return items;
  return [{ ...item, addedAt: new Date().toISOString() }, ...items].slice(0, MAX_WISHLIST);
}

function removeFromWishlist(items: WishlistItem[], id: string): WishlistItem[] {
  return items.filter(i => i.id !== id);
}

function isInWishlist(items: WishlistItem[], id: string): boolean {
  return items.some(i => i.id === id);
}

describe('Wishlist Logic', () => {
  let items: WishlistItem[];

  beforeEach(() => {
    items = [];
    localStorage.removeItem(WISHLIST_KEY);
  });

  it('should add item to wishlist', () => {
    items = addToWishlist(items, { id: '1', name: 'Product A', price: 1000, image: '' });
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('1');
  });

  it('should not add duplicate items', () => {
    items = addToWishlist(items, { id: '1', name: 'Product A', price: 1000, image: '' });
    items = addToWishlist(items, { id: '1', name: 'Product A', price: 1000, image: '' });
    expect(items).toHaveLength(1);
  });

  it('should remove item from wishlist', () => {
    items = addToWishlist(items, { id: '1', name: 'Product A', price: 1000, image: '' });
    items = addToWishlist(items, { id: '2', name: 'Product B', price: 2000, image: '' });
    items = removeFromWishlist(items, '1');
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('2');
  });

  it('should check if item is in wishlist', () => {
    items = addToWishlist(items, { id: '1', name: 'Product A', price: 1000, image: '' });
    expect(isInWishlist(items, '1')).toBe(true);
    expect(isInWishlist(items, '2')).toBe(false);
  });

  it('should add items at the beginning (newest first)', () => {
    items = addToWishlist(items, { id: '1', name: 'First', price: 1000, image: '' });
    items = addToWishlist(items, { id: '2', name: 'Second', price: 2000, image: '' });
    expect(items[0].id).toBe('2');
    expect(items[1].id).toBe('1');
  });

  it('should cap at MAX_WISHLIST items', () => {
    for (let i = 0; i < 55; i++) {
      items = addToWishlist(items, { id: String(i), name: `P${i}`, price: 100, image: '' });
    }
    expect(items.length).toBeLessThanOrEqual(MAX_WISHLIST);
  });

  it('should persist to localStorage', () => {
    items = addToWishlist(items, { id: '1', name: 'Product A', price: 1000, image: '' });
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
    const restored: WishlistItem[] = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
    expect(restored).toHaveLength(1);
    expect(restored[0].name).toBe('Product A');
  });
});
