

## Fix: Dashboard Display Issues

### Problem Identified

There are two issues:

1. **Home page (/)**: Shows "no products" message because the products table is empty. This is correct behavior -- you need to add products first via the admin panel.

2. **Admin Layout race condition**: The `AdminLayout` component has a bug where both `onAuthStateChange` and `getSession` run simultaneously and can interfere with each other, potentially causing a blank screen or redirect loop when navigating to `/admin`.

### Fix: AdminLayout Authentication (src/components/AdminLayout.tsx)

The current code has both `onAuthStateChange` and `getSession` running at the same time, both setting `loading`, `user`, and `isAdmin`. This creates a race condition. The fix separates initial load from ongoing auth changes:

| Issue | Current | Fixed |
|-------|---------|-------|
| Initial load | Both `onAuthStateChange` and `getSession` control `loading` state | Only `getSession` controls initial `loading` state |
| Auth listener | Sets `loading` to false, can cause premature render | Does NOT touch `loading`, only updates user/admin state |
| Cleanup | No `isMounted` guard | Uses `isMounted` flag to prevent state updates after unmount |

### What Changes

**File: `src/components/AdminLayout.tsx`**
- Restructure the `useEffect` to separate initial auth check from ongoing listener
- The `onAuthStateChange` listener updates user/admin state but does NOT set `loading = false`
- The `getSession` call handles initial load and sets `loading = false` only after role check completes
- Add `isMounted` cleanup flag to prevent React state updates on unmounted component

### After the Fix

- Navigate to `/admin/login`, log in with admin credentials, and the dashboard will display correctly
- The home page will still show "no products" until you add products via `/admin/products`
- All admin pages (dashboard, products, orders, coupons, settings, categories, wilayas) will load without blank screens

