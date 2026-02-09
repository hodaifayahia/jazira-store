

# QA Audit Report + Mobile App & Push Notifications Plan

---

## PART A: QA AUDIT REPORT

### 1) Storefront (Public Pages)

**1.1 Home `/`**
- Store name and hero section: **OK** -- Hero with glassmorphism, search bar, CTA buttons all present
- Category blocks: **OK** -- "ادوات منزلية", "منتجات زينة", "اكسسوارات" render from settings
- Category clicks navigate to `/products?category=...`: **OK** -- Link uses `encodeURIComponent`
- Featured/latest products: **OK** -- Newest, Premium (most expensive), Best products sections
- Facebook link in footer: **Warning** -- `facebook_url` is empty string in DB. No Facebook icon rendered in Footer even when URL is present (no social icons section)

**1.2 Products `/products`**
- Fetches active products: **OK** -- `is_active = true` filter applied
- Card shows image, name, price with "دج", category badge: **OK**
- Out-of-stock shows "غير متوفر" and disables buttons: **OK**
- Search by name: **Warning** -- Uses `p.name.includes(search)` which is case-sensitive Arabic exact match. No fuzzy/partial matching
- Category filters and sort: **OK** -- Checkboxes, price slider, sort dropdown all work
- URL `?category=` filter: **OK** -- `initialCategory` read from searchParams

**1.3 Single Product `/product/:id`**
- Main image and gallery: **OK** -- Vertical thumbnails on desktop, arrows, zoom, image counter
- Name, price, description, category: **OK**
- Stock status: **OK** -- Shows "متوفر في المخزون (X قطعة)" or "غير متوفر حاليا"
- Quantity selector: **OK** -- Respects `product.stock` as max
- Add to cart: **OK**
- Direct order "طلب مباشرة": **OK** -- Adds to cart then navigates to `/checkout`

---

### 2) Cart and Direct Order Flow

**2.1 Cart `/cart`**
- localStorage persistence: **OK** -- `CART_KEY = 'dz-store-cart'`
- Items with image, name, price, qty controls, line total, remove: **OK**
- Subtotal updates: **OK**
- Empty cart message with link to `/products`: **OK**
- Cart icon with count in header: **OK** -- Badge with `totalItems`

**2.2 Direct Order Flow**
- "طلب مباشرة" from product page: **OK** -- Adds item then navigates to `/checkout`
- Items removed after order completion: **OK** -- `clearCart()` called after successful order
- Cancel/back preserves cart: **OK** -- Cart uses localStorage, no cleanup on navigation

---

### 3) Checkout, Shipping, and Coupons

**3.1 Checkout `/checkout`**
- Empty cart redirect: **OK** -- `useEffect` redirects to `/cart`
- Form fields: **OK** -- Name (required), Phone (required, validated), Wilaya (dropdown), Address (optional)
- Phone validation: **OK** -- `/^0[567]\d{8}$/` regex
- Arabic error messages: **OK** -- Toast with Arabic text

**3.2 Per-Product Shipping Logic**
- **FAIL** -- Shipping is calculated as a **flat wilaya-based fee**, NOT per-product. `CheckoutPage.tsx` line 56: `shippingCost = selectedWilaya.shipping_price`. Products have `shipping_price` field in DB but it is completely ignored at checkout. The `src/lib/shipping.ts` file referenced in memory does NOT exist.
- `shipping_cost` in `orders` stores the wilaya flat rate, not per-product total
- No helper text in UI about shipping calculation method

**3.3 Coupons**
- No coupons exist in DB to test (table is empty)
- Code logic looks correct: percentage and fixed discount types handled
- Expiry check present
- Product-specific coupon support via `coupon_products` table: **OK** in code
- **Cannot fully verify** without test data

---

### 4) Payment (Baridimob and Flexy)

**4.1 Baridimob / CCP**
- Appears only if `baridimob_enabled` = true: **OK** -- Currently enabled
- CCP number from settings: **OK** -- Shows `002670098836`
- Account name shown: **OK** -- Shows "اسم صاحب الحساب"
- Copy-to-clipboard: **OK** -- `navigator.clipboard.writeText` with toast
- Receipt upload: **OK** -- Accepts `image/*,.pdf`, uploads to `receipts` bucket, saves URL
- **Warning**: No "الدفع عند التسليم" (Cash on delivery) option exists. Only Baridimob and Flexy are available. If both are disabled, there is no payment method to select at all.

**4.2 Flexy**
- Appears only if `flexy_enabled` = true: **OK** -- Currently enabled
- Phone number: **OK** -- Shows `0657761559`
- Deposit amount: **OK** -- Shows 500 DZD
- Remaining amount calculation: **OK** -- `total - deposit`
- Screenshot upload: **OK**

---

### 5) Admin Settings `/admin/settings`

- Page exists and protected: **OK**
- Baridimob section (ccp_number, ccp_name, baridimob_enabled): **OK**
- Flexy section (flexy_number, flexy_deposit_amount, flexy_enabled): **OK**
- Store settings (store_name, facebook_url): **OK**
- Logo upload: **OK** -- Uploads to `store` bucket
- Hero banner upload: **OK**
- Read/pre-fill on load: **OK**
- Save with upsert logic: **OK**
- **Warning**: `store_logo` vs `store_logo_url` key mismatch -- Settings page saves to `store_logo` key but the favicon code in `main.tsx` reads `store_logo`. Footer/Navbar use `useStoreLogo` hook (need to verify which key it reads).

---

### 6) Admin Core Pages

**6.1 Auth**
- `/admin/login` exists: **OK**
- Auth redirect for unauthenticated users: **OK** -- `AdminLayout` checks session
- **Warning**: No role-based check -- any authenticated user can access admin pages (the `has_role` function exists in DB but is not checked in `AdminLayout`)

**6.2 Dashboard `/admin`**
- Orders today/week/month: **OK** (today and month shown, no explicit "this week")
- Revenue for current month: **OK**
- Latest orders list: **OK**
- Top products: **OK** -- From `order_items` join
- Top wilayas: **OK**
- Low stock alerts: **OK** -- Alert banner + dedicated card
- Risky wilayas (high cancellation): **OK**

**6.3 Products `/admin/products`**
- List with image, name, price, category, stock, status: **OK**
- CRUD operations: **OK**
- Bulk actions (price, category, delete): **OK**
- Pagination (10 per page): **OK**

**6.4 Wilayas `/admin/wilayas`**
- List with name, shipping_price, status: **OK**
- CRUD + toggle: **OK**
- Used in checkout dropdown: **OK** -- Same `wilayas` table queried

**6.5 Orders `/admin/orders`**
- List columns: **OK**
- Search: **OK**
- Status filter: **OK**
- Advanced filters (wilaya, payment, date, price): **OK**
- Status update via dropdown: **OK**
- Bulk status update: **OK**
- Realtime notifications: **OK** -- Channel subscription in AdminLayout
- **Warning**: No dedicated order detail view -- status changes happen inline in the table

---

### 7) UX, RTL, and Responsiveness

- Mobile-friendly: **OK** -- Grid adapts, mobile menu, Sheet for filters
- Admin sidebar collapses on mobile: **OK** -- Transform-based toggle
- RTL: **OK** -- `dir="rtl"` in `index.html`, `lang="ar"`
- Loading states: **OK** -- Skeletons used
- Error handling: **OK** -- Arabic toast messages
- Footer: **OK** -- Store name, copyright 2026, quick links
- **Warning**: Footer has no social media icons section. Facebook URL field exists in settings but is not rendered as a link/icon in the footer.

---

## SUMMARY OF ISSUES

| # | Issue | Severity |
|---|-------|----------|
| 1 | Shipping is flat per-wilaya, NOT per-product as intended | FAIL |
| 2 | No `src/lib/shipping.ts` helper exists (referenced in memory) | FAIL |
| 3 | No "Cash on Delivery" payment option | Warning |
| 4 | Facebook URL not rendered in footer | Warning |
| 5 | No admin role check in AdminLayout (any logged-in user = admin) | Warning |
| 6 | No dedicated order detail view in admin | Warning |
| 7 | No coupons in DB to test coupon flow | Info |
| 8 | Search is exact Arabic match, no fuzzy search | Minor |

---

## TOP 5 RECOMMENDED IMPROVEMENTS

**1. Fix Per-Product Shipping Calculation (Critical)**
Create `src/lib/shipping.ts` with a `calculateShipping(cartItems)` function that sums each item's `shipping_price * quantity`. Update `CheckoutPage.tsx` to use this instead of the flat wilaya fee. Update the order summary UI to show per-product shipping breakdown.

**2. Add Admin Role Check (Security)**
In `AdminLayout.tsx`, after confirming the user is authenticated, query `user_roles` table to verify the user has the `admin` role. Redirect non-admin users to the homepage with an error message. This prevents any registered customer from accessing the admin panel.

**3. Add Facebook Link to Footer**
In `Footer.tsx`, add a Facebook icon link that reads `facebook_url` from the settings query (already fetched). Only render it when the URL is not empty. Use the Lucide `Facebook` icon or an SVG.

**4. Add Cash on Delivery Payment Option**
In `CheckoutPage.tsx`, add a "الدفع عند التسليم" radio option that is always visible (no settings toggle needed). When selected, skip the receipt upload section. Store `payment_method: 'cod'` in the order.

**5. Add Order Detail Modal in Admin Orders**
In `AdminOrdersPage.tsx`, add a dialog/sheet that opens when clicking an order row. Show full order details: all items with quantities and prices, shipping breakdown, payment method, receipt image/link, customer info, and status timeline.

---

## PART B: MOBILE APP + PUSH NOTIFICATIONS PLAN

### Approach: PWA (Progressive Web App)

Since the app is already a responsive React SPA, the fastest and most practical approach is converting it to an installable PWA. This gives:
- Install to home screen on any phone
- Offline support
- Push notifications via the Web Push API
- No app store submission needed

### Implementation Steps

**Step 1: Install and configure `vite-plugin-pwa`**
- Add the `vite-plugin-pwa` package
- Configure it in `vite.config.ts` with manifest (name: "DZ Store", icons, theme color, etc.)
- Generate PWA icons in `/public` (192x192, 512x512)

**Step 2: Add mobile meta tags to `index.html`**
- `<meta name="apple-mobile-web-app-capable">` and related iOS tags
- Theme color meta tag
- Splash screen configuration

**Step 3: Create service worker for offline caching**
- Cache static assets and API responses
- Show offline fallback page

**Step 4: Push Notifications**
- Create a backend function to handle push subscription registration
- Add a `push_subscriptions` table in the database to store subscriber endpoints
- Implement Web Push API in the service worker
- Trigger notifications from admin actions (new order confirmation, status update)
- Admin receives push when new order arrives

**Step 5: Responsive polish**
- Review all pages at 375px, 390px, 414px widths
- Ensure sticky bars, modals, and floating elements work on mobile
- Test touch interactions (swipe on carousels, tap targets)

**Step 6: Install prompt page**
- Create `/install` page with instructions for iOS (Share > Add to Home Screen) and Android (browser menu)
- Add "Install App" link in the navbar or footer

### Technical Details

| Component | Technology |
|-----------|-----------|
| PWA Plugin | `vite-plugin-pwa` with `workbox` |
| Push API | Web Push API + backend function |
| Subscription Storage | New `push_subscriptions` DB table |
| Notification Trigger | Backend function called on order insert/update |
| Icons | Generated from store logo or default DZ Store branding |

### Database Changes Required
- New table: `push_subscriptions` (id, user_id, endpoint, p256dh, auth, created_at)
- New backend function: `send-push-notification` to send notifications via Web Push protocol

