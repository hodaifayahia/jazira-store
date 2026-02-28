import { describe, it, expect, beforeEach } from 'vitest';

const RECENTLY_VIEWED_KEY = 'dz-store-recently-viewed';
const MAX_RECENT = 12;

interface RecentlyViewedItem {
  id: string;
  name: string;
  price: number;
  image: string;
  viewedAt: string;
}

function addRecentlyViewed(items: RecentlyViewedItem[], item: Omit<RecentlyViewedItem, 'viewedAt'>): RecentlyViewedItem[] {
  const filtered = items.filter(i => i.id !== item.id);
  return [{ ...item, viewedAt: new Date().toISOString() }, ...filtered].slice(0, MAX_RECENT);
}

describe('Recently Viewed Logic', () => {
  let items: RecentlyViewedItem[];

  beforeEach(() => {
    items = [];
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
  });

  it('should add item to recently viewed', () => {
    items = addRecentlyViewed(items, { id: '1', name: 'Product A', price: 1000, image: '' });
    expect(items).toHaveLength(1);
  });

  it('should move duplicate to front instead of duplicating', () => {
    items = addRecentlyViewed(items, { id: '1', name: 'Product A', price: 1000, image: '' });
    items = addRecentlyViewed(items, { id: '2', name: 'Product B', price: 2000, image: '' });
    items = addRecentlyViewed(items, { id: '1', name: 'Product A', price: 1000, image: '' });
    expect(items).toHaveLength(2);
    expect(items[0].id).toBe('1');
    expect(items[1].id).toBe('2');
  });

  it('should cap at MAX_RECENT items', () => {
    for (let i = 0; i < 20; i++) {
      items = addRecentlyViewed(items, { id: String(i), name: `P${i}`, price: 100, image: '' });
    }
    expect(items.length).toBeLessThanOrEqual(MAX_RECENT);
  });

  it('should keep most recent items', () => {
    for (let i = 0; i < 15; i++) {
      items = addRecentlyViewed(items, { id: String(i), name: `P${i}`, price: 100, image: '' });
    }
    // Most recent should be at index 0
    expect(items[0].id).toBe('14');
  });

  it('should persist to localStorage', () => {
    items = addRecentlyViewed(items, { id: '1', name: 'Product A', price: 1000, image: '' });
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(items));
    const restored: RecentlyViewedItem[] = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
    expect(restored).toHaveLength(1);
    expect(restored[0].name).toBe('Product A');
  });
});
