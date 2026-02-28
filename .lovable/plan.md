
# Plan: Abandoned Cart on Landing Pages, Delivery in Sidebar, and Responsive Fixes

## 1. Abandoned Cart Capture on Landing Page

**Problem**: The CheckoutPage already saves abandoned orders when users fill in their info but don't complete the order. However, the Landing Page (single-product order form) does NOT capture abandoned carts at all.

**Solution**: Add the same debounced abandoned cart capture logic from `CheckoutPage.tsx` to `LandingPage.tsx`. When a user fills in their name and phone on the landing page form but doesn't submit, save/update an `abandoned_orders` record after 5 seconds of inactivity.

### File to Modify
- `src/pages/LandingPage.tsx` -- Add a `useEffect` that watches `orderName`, `orderPhone`, and the product data. After a 5-second debounce (once name >= 2 chars and phone >= 10 digits), upsert an abandoned order with the product info as cart items and `landing_page_id` context.

---

## 2. Delivery Companies Already in Sidebar

The delivery companies management page is already accessible at `/admin/settings/delivery` and is listed in the settings sub-navigation (`SETTINGS_SUB_KEYS` in `AdminLayout.tsx`). No further changes needed here.

---

## 3. Fix Responsive Tables (Overflow-Y Instead of Full Page Scroll)

**Problem**: Tables on the Returns, Costs, Suppliers, and Supplier Detail pages expand the entire page width on mobile. The tables should scroll horizontally within a constrained container rather than stretching the whole page.

**Solution**: Wrap all table containers in a `max-h` scroll area or ensure the existing `overflow-x-auto` wrapper is inside a properly constrained parent. The main issue is that the parent `div` in `AdminLayout` content area doesn't constrain overflow. We need to add `overflow-hidden` or `overflow-x-hidden` to the main content wrapper and ensure table wrappers have `overflow-x-auto` with `min-w-0`.

### Files to Modify

1. **`src/pages/admin/AdminCostsPage.tsx`** -- The table wrapper at line 144 has `overflow-x-auto` but the parent space doesn't constrain. Add `min-w-0` to the root div.

2. **`src/pages/admin/AdminReturnsPage.tsx`** -- Similar fix: ensure the root container has `min-w-0` and table wrapper constrains overflow.

3. **`src/pages/admin/AdminSuppliersPage.tsx`** -- Add `min-w-0` to root and ensure table wrapper constrains properly.

4. **`src/pages/admin/AdminSupplierDetailPage.tsx`** -- Add `min-w-0` to root div and ensure both the transactions table and products tab tables scroll horizontally within their container.

5. **`src/components/admin/suppliers/SupplierProductsTab.tsx`** -- Already has `overflow-x-auto` on the table wrapper (line 233). Add `min-w-0` to the root div to prevent it from expanding beyond its parent.

6. **`src/components/AdminLayout.tsx`** -- Add `overflow-x-hidden min-w-0` to the main content area `<main>` tag so child tables cannot expand the layout.

---

## Technical Summary

| File | Change |
|------|--------|
| `src/pages/LandingPage.tsx` | Add abandoned cart capture `useEffect` with 5s debounce |
| `src/components/AdminLayout.tsx` | Add `overflow-x-hidden min-w-0` to main content wrapper |
| `src/pages/admin/AdminCostsPage.tsx` | Add `min-w-0` to root container |
| `src/pages/admin/AdminReturnsPage.tsx` | Add `min-w-0` to root container |
| `src/pages/admin/AdminSuppliersPage.tsx` | Add `min-w-0` to root container |
| `src/pages/admin/AdminSupplierDetailPage.tsx` | Add `min-w-0` to root container |
| `src/components/admin/suppliers/SupplierProductsTab.tsx` | Add `min-w-0` to root container |

No database changes needed -- the `abandoned_orders` table already supports all required fields.
