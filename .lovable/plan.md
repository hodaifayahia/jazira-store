

# Plan: Fix Scroll, Fix Order Creation, Add Offline Support

## 1. Fix Scroll Position on Navigation

**Problem**: When scrolling down on any admin page and clicking a sidebar link or navigating, the page stays scrolled down.

**Root Cause**: The sidebar scroll-to-top fix exists (line 91-93 in AdminLayout), but the **main content area** scrolls via the browser window, not the sidebar. Need to also call `window.scrollTo(0, 0)` on route change.

**Fix**: Add `window.scrollTo(0, 0)` to the existing `useEffect` in `AdminLayout.tsx` that watches `location.pathname`.

---

## 2. Fix Order Creation Foreign Key Error

**Problem**: Screenshot shows error: `insert or update on table "order_items" violates foreign key constraint "order_items_variant_id_fkey"`

**Root Cause**: The `order_items.variant_id` column has a foreign key to the `product_variants` table, but the order creation page queries `product_variations` (a different table) and sends those IDs. The IDs from `product_variations` don't exist in `product_variants`, causing the FK violation.

**Fix**: In `AdminCreateOrderPage.tsx`, change the `variant_id` in the order items insert to `null` since the product_variations system uses price adjustments directly (not variant tracking). The variation info is already captured in the product name and price. This ensures no FK violation occurs.

### Files Modified
- `src/components/AdminLayout.tsx` -- add window.scrollTo
- `src/pages/admin/AdminCreateOrderPage.tsx` -- set variant_id to null always (variations are from a different table)

---

## 3. Full Offline Support

### Architecture Overview

The app already uses `vite-plugin-pwa` with Workbox for basic service worker caching. This plan extends it with:

```text
+------------------+     +-------------------+     +------------------+
|   User Action    | --> | Offline Detector  | --> | Online? Send to  |
|   (form submit)  |     | (navigator.online)|     | Supabase directly|
+------------------+     +-------------------+     +------------------+
                                |                          
                           Offline?                        
                                |                          
                    +-----------v-----------+              
                    | Save to IndexedDB     |              
                    | (pending_operations)  |              
                    +-----------+-----------+              
                                |                          
                    On 'online' event                      
                                |                          
                    +-----------v-----------+              
                    | SyncManager: replay   |              
                    | pending ops to        |              
                    | Supabase in order     |              
                    +---+-------------------+              
                        |                                  
                    Success? Clear from IndexedDB          
                    Show success toast                     
```

### 3a. Enhanced Service Worker Config (`vite.config.ts`)

Update the VitePWA config to:
- Cache all static assets aggressively (CacheFirst for images/fonts)
- Use NetworkFirst for API calls with longer cache duration
- Add offline fallback page

### 3b. Offline Queue System

**New file: `src/lib/offlineQueue.ts`**

- Uses IndexedDB (via a lightweight wrapper) to store pending operations
- Each record has: `id`, `table`, `operation` (insert/update/delete), `data`, `created_at`, `synced_at`
- Provides functions: `addToQueue()`, `getPendingOps()`, `markSynced()`, `clearSynced()`

### 3c. Online/Offline Detection

**New file: `src/components/OfflineBanner.tsx`**

- Listens to `window.addEventListener('online'/'offline')`
- Shows a fixed banner at the top: "You're offline -- your changes will be saved locally"
- Animate in/out smoothly
- Shows pending operation count

### 3d. Supabase Wrapper for Offline-Aware Operations

**New file: `src/lib/offlineSupabase.ts`**

- Wraps common Supabase operations (insert, update, delete)
- When online: execute normally
- When offline: save to IndexedDB queue, show offline toast
- Used in critical forms: order creation, checkout, etc.

### 3e. Auto-Sync on Reconnect

**New file: `src/hooks/useOfflineSync.ts`**

- Hook that listens for `online` event
- When back online: reads all pending ops from IndexedDB
- Replays them sequentially to Supabase
- Shows progress ("Syncing 3 pending operations...")
- On success: shows "All data synced successfully!" toast
- On failure: keeps failed ops in queue, shows error

### 3f. Integration Points

- Mount `<OfflineBanner />` in `App.tsx` (visible on all pages)
- Add `useOfflineSync()` hook in `App.tsx`
- Wrap order creation (`AdminCreateOrderPage.tsx`) and checkout (`CheckoutPage.tsx`) forms to use the offline-aware Supabase wrapper

### Files to Create
1. `src/lib/offlineQueue.ts` -- IndexedDB queue manager
2. `src/lib/offlineSupabase.ts` -- offline-aware Supabase wrapper
3. `src/hooks/useOfflineSync.ts` -- auto-sync hook
4. `src/components/OfflineBanner.tsx` -- offline indicator UI

### Files to Modify
1. `src/components/AdminLayout.tsx` -- window.scrollTo fix
2. `src/pages/admin/AdminCreateOrderPage.tsx` -- fix variant_id FK, integrate offline support
3. `src/App.tsx` -- mount OfflineBanner and useOfflineSync
4. `src/pages/CheckoutPage.tsx` -- integrate offline support for customer orders
5. `vite.config.ts` -- enhance PWA caching strategy

