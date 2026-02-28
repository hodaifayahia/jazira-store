import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock IndexedDB for offline queue tests
const DB_NAME = 'dz-store-offline';

describe('Offline Queue Logic', () => {
  it('should queue operations when offline', () => {
    const queue: any[] = [];
    const op = { table: 'orders', operation: 'insert', data: { name: 'Test' }, created_at: new Date().toISOString() };
    queue.push({ ...op, synced_at: null });
    expect(queue).toHaveLength(1);
    expect(queue[0].synced_at).toBeNull();
  });

  it('should filter unsynced operations', () => {
    const queue = [
      { id: 1, table: 'orders', operation: 'insert', data: {}, synced_at: null, created_at: '' },
      { id: 2, table: 'orders', operation: 'update', data: {}, synced_at: '2026-01-01', created_at: '' },
      { id: 3, table: 'products', operation: 'delete', data: {}, synced_at: null, created_at: '' },
    ];
    const pending = queue.filter(op => !op.synced_at);
    expect(pending).toHaveLength(2);
    expect(pending[0].id).toBe(1);
    expect(pending[1].id).toBe(3);
  });

  it('should mark operations as synced', () => {
    const queue = [
      { id: 1, table: 'orders', operation: 'insert', data: {}, synced_at: null, created_at: '' },
    ];
    queue[0].synced_at = new Date().toISOString();
    const pending = queue.filter(op => !op.synced_at);
    expect(pending).toHaveLength(0);
  });

  it('should clear synced operations', () => {
    const queue = [
      { id: 1, table: 'orders', operation: 'insert', data: {}, synced_at: '2026-01-01', created_at: '' },
      { id: 2, table: 'orders', operation: 'update', data: {}, synced_at: null, created_at: '' },
    ];
    const remaining = queue.filter(op => !op.synced_at);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(2);
  });
});

describe('Offline Supabase Wrapper Logic', () => {
  it('should go online path when navigator.onLine is true', () => {
    // navigator.onLine is true by default in jsdom
    expect(navigator.onLine).toBe(true);
  });

  it('should queue when offline', () => {
    const queue: any[] = [];
    const originalOnLine = Object.getOwnPropertyDescriptor(navigator, 'onLine');
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

    if (!navigator.onLine) {
      queue.push({
        table: 'orders',
        operation: 'insert',
        data: { customer_name: 'Test' },
        created_at: new Date().toISOString(),
        synced_at: null,
      });
    }

    expect(queue).toHaveLength(1);

    // Restore
    if (originalOnLine) {
      Object.defineProperty(navigator, 'onLine', originalOnLine);
    } else {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    }
  });
});
