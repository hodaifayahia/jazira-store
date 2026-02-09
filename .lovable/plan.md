

## Final Polish Pass

This plan covers UX improvements across the entire application without changing any business logic or database schema.

### 1. SEO - Update index.html and Add Per-Page Titles

**index.html:** Update the default `<title>` and `<meta>` tags to Arabic:
- Title: "DZ Store - متجرك الإلكتروني في الجزائر"
- Description: "متجرك الإلكتروني الأول في الجزائر للأدوات المنزلية، منتجات الزينة والإكسسوارات"
- Update `lang="en"` to `lang="ar"` and add `dir="rtl"`

**Create `src/hooks/usePageTitle.ts`:** A small hook using `document.title` to set per-page titles:
- Home: "DZ Store - متجرك الإلكتروني في الجزائر"
- Products: "تصفح منتجاتنا - DZ Store"
- Single Product: "{product name} - DZ Store"
- Cart: "سلة التسوق - DZ Store"
- Checkout: "إتمام الطلب - DZ Store"
- Order Confirmation: "تأكيد الطلب - DZ Store"
- Track Order: "تتبع الطلب - DZ Store"

Apply the hook to each public page.

---

### 2. Error Handling

Add error handling to every Supabase query that currently silently ignores errors. The pattern: show a toast with "حدث خطأ، يرجى المحاولة مرة أخرى" on query failure.

**Affected files (queries missing error handling):**
- `AdminDashboardPage.tsx` - 3 queries have no error check
- `AdminProductsPage.tsx` - products query
- `AdminOrdersPage.tsx` - orders query, order items query
- `AdminWilayasPage.tsx` - wilayas query
- `AdminCouponsPage.tsx` - coupons query
- `AdminSettingsPage.tsx` - settings query
- `CheckoutPage.tsx` - wilayas and settings queries
- `OrderConfirmationPage.tsx` - order and orderItems queries
- `TrackOrderPage.tsx` - search query (partial)

**Approach:** Add `onError` callback via `useQuery`'s `meta` or a wrapper, or use TanStack Query's global `onError`. The simplest approach: add a `queryClient` default `onError` in `App.tsx` that shows the Arabic toast, plus ensure individual `queryFn` functions throw on error (most already do via `if (error) throw error`, but several just do `const { data } = ...` without checking).

---

### 3. Loading Skeletons

**Pages needing skeleton loading states (currently show nothing or just blank):**
- `AdminDashboardPage.tsx` - No loading state at all; add skeleton cards + skeleton table
- `AdminProductsPage.tsx` - No loading state; add skeleton table rows
- `AdminOrdersPage.tsx` - No loading state; add skeleton table rows
- `AdminWilayasPage.tsx` - No loading state; add skeleton table rows
- `AdminCouponsPage.tsx` - No loading state; add skeleton table rows
- `AdminSettingsPage.tsx` - Already has `isLoading` but shows Loader2 spinner; switch to skeleton cards
- `CheckoutPage.tsx` - No loading for wilayas/settings; minor, but add skeleton for the form area

**Pages already good:**
- `Index.tsx` - Uses `ProductGridSkeleton`
- `ProductsPage.tsx` - Uses `ProductGridSkeleton`
- `SingleProductPage.tsx` - Uses Skeleton components
- `OrderConfirmationPage.tsx` - Uses Skeleton

**Approach:** Add `isLoading` checks with Skeleton components to each admin page. Create a reusable `TableSkeleton` component in `LoadingSkeleton.tsx`.

---

### 4. Empty States

Most pages already handle empty states. Gaps to fill:
- `AdminProductsPage.tsx` - Add empty state with `Package` icon and "لا توجد منتجات بعد"
- `AdminOrdersPage.tsx` - Add empty state with `ShoppingCart` icon and "لا توجد طلبات بعد"
- `AdminCouponsPage.tsx` - Add empty state with `Tag` icon and "لا توجد كوبونات بعد"
- `AdminWilayasPage.tsx` - Will auto-seed, but add fallback empty state

Pages already good: Index (has empty state), ProductsPage (has "no results"), CartPage (has empty cart), Dashboard (has "لا توجد طلبات بعد"), TrackOrderPage (has not-found state).

---

### 5. Mobile Responsiveness

**Changes needed:**
- Admin tables: Wrap all `<table>` elements in `<div className="overflow-x-auto">` (some already have it, verify all)
- `CheckoutPage.tsx`: The `md:grid-cols-5` layout works, but ensure the summary card is full-width on mobile (already is via grid fallback)
- `AdminLayout.tsx`: Already has hamburger menu and collapsible sidebar - looks good
- Product grids: Already use `grid-cols-1 sm:grid-cols-2` - good
- Navbar: Already has hamburger menu - good

**Minor fixes:**
- Admin sidebar overlay z-index check
- Ensure all admin table action buttons don't wrap awkwardly on small screens

---

### 6. RTL Fixes

**Issues to address:**
- `AdminLayout.tsx` sidebar: Uses `right-0` and `translate-x-full` which is correct for RTL. The `border-l` should be `border-l` (left border = inner border in RTL). Looks correct.
- `NotFound.tsx`: Currently in English - translate to Arabic
- Product card badge position `right-2` is correct for RTL
- Cart badge on navbar: Uses `-left-1` which puts badge on the left (correct for RTL layout since cart icon is on left side)
- Breadcrumb chevrons: Uses `rotate-180` on `ChevronRight` which is correct for RTL

No major RTL issues found. Minor: ensure admin sidebar `border-l` is semantically correct (it is - sidebar is on the right, border is on the left/inner edge).

---

### 7. Performance

- Product images already use `loading="lazy"` on `ProductCard.tsx` - good
- Add `loading="lazy"` to images in `SingleProductPage.tsx` gallery thumbnails
- `CartContext.tsx`: Uses functional state updates which is good; no unnecessary re-renders detected. The `useMemo` for `totalItems`/`subtotal` could help but impact is minimal since they're simple calculations.

---

### 8. Footer Update

The footer already exists with store name and copyright. Changes:
- Add Facebook icon link (fetch from settings `facebook_url` or use a placeholder `#`)
- The copyright year already uses `new Date().getFullYear()` - currently renders 2026, correct
- Add the Facebook icon from lucide-react (or use a simple SVG)

Since settings may have `facebook_url`, fetch it from settings and display a Facebook link icon.

---

### 9. NotFound Page - Arabic Translation

Currently shows English text. Update to Arabic with proper styling:
- "الصفحة غير موجودة" instead of "Oops! Page not found"
- "العودة إلى الرئيسية" instead of "Return to Home"
- Add an icon (e.g., `SearchX` from lucide)

---

### Files Modified (summary)

| File | Changes |
|------|---------|
| `index.html` | Arabic title, description, lang="ar", dir="rtl" |
| `src/hooks/usePageTitle.ts` | New hook for per-page document titles |
| `src/components/LoadingSkeleton.tsx` | Add `TableSkeleton` component |
| `src/App.tsx` | Add global query error handler on queryClient |
| `src/pages/Index.tsx` | Add usePageTitle |
| `src/pages/ProductsPage.tsx` | Add usePageTitle |
| `src/pages/SingleProductPage.tsx` | Add usePageTitle, lazy loading on thumbnails |
| `src/pages/CartPage.tsx` | Add usePageTitle |
| `src/pages/CheckoutPage.tsx` | Add usePageTitle, error handling on queries |
| `src/pages/OrderConfirmationPage.tsx` | Add usePageTitle, error handling on queries |
| `src/pages/TrackOrderPage.tsx` | Add usePageTitle |
| `src/pages/NotFound.tsx` | Arabic translation, icon, proper styling |
| `src/pages/admin/AdminDashboardPage.tsx` | Loading skeletons, error handling |
| `src/pages/admin/AdminProductsPage.tsx` | Loading skeleton, empty state, error handling |
| `src/pages/admin/AdminOrdersPage.tsx` | Loading skeleton, empty state, error handling |
| `src/pages/admin/AdminWilayasPage.tsx` | Loading skeleton, empty state, error handling |
| `src/pages/admin/AdminCouponsPage.tsx` | Loading skeleton, empty state, error handling |
| `src/pages/admin/AdminSettingsPage.tsx` | Skeleton instead of spinner, error handling |
| `src/components/Footer.tsx` | Add Facebook link icon |

No business logic, database schema, or routing changes.

