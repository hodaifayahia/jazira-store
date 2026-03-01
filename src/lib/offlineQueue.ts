const DB_NAME = 'dz-store-offline';
const DB_VERSION = 2;
const STORE_NAME = 'pending_operations';
const CACHE_STORE = 'data_cache';

export const MAX_RETRIES = 5;

export interface PendingOperation {
  id?: number;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  match?: Record<string, any>;
  created_at: string;
  synced_at: string | null;
  retry_count: number;
  last_error: string | null;
  priority: number; // lower = higher priority
}

export interface CachedRecord {
  key: string;         // e.g. "products", "categories", "store_settings"
  data: any;
  timestamp: number;
  expiry_ms: number;
}

// ── Sync progress event bus ──
export type SyncProgress = {
  total: number;
  done: number;
  failed: number;
  status: 'idle' | 'syncing' | 'done' | 'error';
};
type SyncListener = (p: SyncProgress) => void;
const syncListeners = new Set<SyncListener>();
let _syncProgress: SyncProgress = { total: 0, done: 0, failed: 0, status: 'idle' };

export function subscribeSyncProgress(fn: SyncListener) {
  syncListeners.add(fn);
  fn(_syncProgress); // emit current
  return () => { syncListeners.delete(fn); };
}
export function emitSyncProgress(p: Partial<SyncProgress>) {
  _syncProgress = { ..._syncProgress, ...p };
  syncListeners.forEach(fn => fn(_syncProgress));
}

// ── IndexedDB ──
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = req.result;
      const oldVersion = event.oldVersion;
      if (oldVersion < 1) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
      if (oldVersion < 2) {
        // Add cache store
        if (!db.objectStoreNames.contains(CACHE_STORE)) {
          db.createObjectStore(CACHE_STORE, { keyPath: 'key' });
        }
        // Migrate old operations: add new fields
        // (existing records get defaults on read)
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ── Queue operations ──
export async function addToQueue(
  op: Omit<PendingOperation, 'id' | 'synced_at' | 'retry_count' | 'last_error' | 'priority'> & { priority?: number }
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add({
      ...op,
      synced_at: null,
      retry_count: 0,
      last_error: null,
      priority: op.priority ?? 10,
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingOps(): Promise<PendingOperation[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => {
      const ops = (req.result as PendingOperation[])
        .filter(op => !op.synced_at && (op.retry_count ?? 0) < MAX_RETRIES)
        .map(op => ({ ...op, retry_count: op.retry_count ?? 0, last_error: op.last_error ?? null, priority: op.priority ?? 10 }))
        .sort((a, b) => a.priority - b.priority || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      resolve(ops);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getFailedOps(): Promise<PendingOperation[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => {
      resolve((req.result as PendingOperation[]).filter(op => !op.synced_at && (op.retry_count ?? 0) >= MAX_RETRIES));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function markSynced(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const record = getReq.result;
      if (record) {
        record.synced_at = new Date().toISOString();
        store.put(record);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function markRetry(id: number, error: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const record = getReq.result;
      if (record) {
        record.retry_count = (record.retry_count ?? 0) + 1;
        record.last_error = error;
        store.put(record);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearSynced(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      for (const record of req.result) {
        if (record.synced_at) store.delete(record.id);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearFailedOps(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      for (const record of req.result) {
        if (!record.synced_at && (record.retry_count ?? 0) >= MAX_RETRIES) {
          store.delete(record.id);
        }
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingCount(): Promise<number> {
  const ops = await getPendingOps();
  return ops.length;
}

// ── IndexedDB data cache (replaces localStorage for larger capacity) ──
export async function setCacheIDB(key: string, data: any, expiryMs = 30 * 60 * 1000): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CACHE_STORE, 'readwrite');
    tx.objectStore(CACHE_STORE).put({ key, data, timestamp: Date.now(), expiry_ms: expiryMs } as CachedRecord);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCacheIDB<T>(key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CACHE_STORE, 'readonly');
    const req = tx.objectStore(CACHE_STORE).get(key);
    req.onsuccess = () => {
      const record = req.result as CachedRecord | undefined;
      if (!record) return resolve(null);
      // If online and expired, return null (will fetch fresh)
      if (navigator.onLine && Date.now() - record.timestamp > record.expiry_ms) return resolve(null);
      // If offline, always return cached data regardless of expiry
      resolve(record.data as T);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function clearCacheIDB(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CACHE_STORE, 'readwrite');
    tx.objectStore(CACHE_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Exponential backoff delay ──
export function getBackoffDelay(retryCount: number): number {
  // 1s, 2s, 4s, 8s, 16s — capped at 30s
  return Math.min(1000 * Math.pow(2, retryCount), 30_000);
}
