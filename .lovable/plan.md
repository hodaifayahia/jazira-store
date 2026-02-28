

# Plan: Fix Orders, Multiple Pixels, Stock Management & UI Enhancements

This is a large set of changes across multiple areas. Here's the breakdown:

---

## 1. Fix Manual Order Creation (Broken Stock Deduction)

**Problem**: The order creation dialog has broken stock deduction code -- it uses `supabase.rpc('has_role', ...)` in a `.then()` chain that never properly awaits, meaning stock is never actually deducted.

**Fix**: Rewrite the stock deduction in `ManualOrderDialog.tsx` to properly `await` each stock update using a simple loop with `await supabase.from('products').update(...)`.

---

## 2. Move Order Creation to Full Page

**What changes**:
- Create `src/pages/admin/AdminCreateOrderPage.tsx` -- a full-page order creation form with a modern step-based layout (Customer Info -> Products -> Summary)
- Better UI with clear sections, larger product cards, live order summary sidebar
- Add route `/admin/orders/create` in `App.tsx`
- Update `AdminOrdersPage.tsx` button to navigate to the new page instead of opening the dialog
- Keep `ManualOrderDialog.tsx` as-is for backward compatibility but it won't be used from the orders page

---

## 3. Multiple Facebook Pixels Support

**What changes**:
- Create a new database table `facebook_pixels` with columns: `id`, `pixel_id` (text), `name` (text), `is_active` (boolean), `created_at`
- Update `useFacebookPixel.ts` to query from the new `facebook_pixels` table, initialize ALL active pixels, and fire events on all of them
- Add a "Facebook Pixels" settings card in `AdminSettingsPage.tsx` or a new settings sub-page where admins can add/remove/toggle multiple pixel IDs
- Create `src/pages/admin/settings/AdminPixelsPage.tsx` for managing pixels
- Add route and sidebar entry

---

## 4. Stock Management on Order Status Change

**Problem**: When an order is confirmed ("تم التسليم") stock should be deducted. When cancelled ("ملغي"), stock should be restored.

**What changes**:
- Modify the `updateStatus` mutation in `AdminOrdersPage.tsx` to:
  - When status changes TO "تم التسليم": deduct stock from products based on order items
  - When status changes TO "ملغي": restore stock to products based on order items
  - When status changes FROM "تم التسليم" to something else: restore stock
  - When status changes FROM "ملغي" back: deduct stock again
- Also apply the same logic to `bulkUpdateStatus`
- Fetch order items when updating status to perform stock adjustments

---

## 5. UI/UX Enhancements

### Dashboard (`AdminDashboardPage.tsx`):
- Add gradient backgrounds to stat cards with subtle animations
- Improve chart styling with better colors and tooltips
- Add a "conversion rate" stat (delivered / total orders)
- Add a profit calculation card
- Better mobile responsiveness

### Store Landing Page (`Index.tsx`):
- Enhance hero section with better typography and spacing
- Improve product card hover effects
- Add smooth scroll animations
- Better category navigation styling

### Product Page (`SingleProductPage.tsx`):
- Improve image gallery with better zoom/lightbox
- Better offer countdown styling
- Enhance the inline order form with clearer step indicators
- Better review section design

---

## Technical Details

### Files to Create:
1. `src/pages/admin/AdminCreateOrderPage.tsx` -- Full-page order creation
2. `src/pages/admin/settings/AdminPixelsPage.tsx` -- Facebook Pixels management

### Files to Modify:
1. `src/pages/admin/AdminOrdersPage.tsx` -- Navigate to create page, add stock logic on status change
2. `src/hooks/useFacebookPixel.ts` -- Support multiple pixels
3. `src/App.tsx` -- Add new routes
4. `src/components/AdminLayout.tsx` -- Add Pixels settings nav
5. `src/pages/admin/AdminSettingsPage.tsx` -- Add Pixels card
6. `src/pages/admin/AdminDashboardPage.tsx` -- UI enhancements
7. `src/pages/Index.tsx` -- UI polish
8. `src/pages/SingleProductPage.tsx` -- UI polish
9. `src/i18n/locales/ar.ts` -- New translations
10. `src/i18n/locales/fr.ts` -- New translations
11. `src/i18n/locales/en.ts` -- New translations

### Database Migration:
- Create `facebook_pixels` table with RLS (admin-only management, public read for active pixels)

