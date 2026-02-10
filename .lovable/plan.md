

## Plan: Complete All Pending Features + Responsive Dashboard

This plan covers all the features you requested. The database already has the necessary columns (`shipping_price_home`, `baladiyat` table, `delivery_type`, `baladiya` on orders), so no database changes are needed.

---

### 1. About Us Page (with animations)

**Create** `src/pages/AboutPage.tsx` -- a beautifully designed page with fade-in/slide-up animations, pulling store info (name, description, address, phone, email) from the `settings` table. Includes a hero section, mission cards, and contact info.

**Modify** `src/App.tsx` -- add `/about` route.
**Modify** `src/components/Navbar.tsx` -- add "من نحن" link.
**Modify** `src/components/Footer.tsx` -- add "من نحن" link.

---

### 2. Remove Cash on Delivery (COD) Payment Option

**Modify** `src/pages/CheckoutPage.tsx` -- remove the entire COD radio option (lines 276-289).
**Modify** `src/pages/SingleProductPage.tsx` -- ensure COD is not an option in the inline order form (it currently only shows baridimob/flexy, so this is already correct).

---

### 3. Receipt File Preview After Upload

**Modify** `src/pages/CheckoutPage.tsx` -- after `setReceiptFile`, show an image thumbnail preview (if image) or file name with a remove button below the file input.
**Modify** `src/pages/SingleProductPage.tsx` -- same receipt preview in both baridimob and flexy sections.

---

### 4. Wilayas + Baladiyat with Office/Home Delivery Prices

**Modify** `src/pages/admin/AdminWilayasPage.tsx`:
- Show two price columns: "توصيل للمكتب" (office = `shipping_price`) and "توصيل للمنزل" (home = `shipping_price_home`)
- Edit form: two price inputs instead of one
- Add "Import All" button that bulk-inserts all 58 wilayas + baladiyat using embedded JSON data
- Expandable rows to show baladiyat under each wilaya

---

### 5. Checkout + Product Page: Baladiya Selector + Delivery Type

**Modify** `src/pages/CheckoutPage.tsx`:
- After wilaya selection, fetch and show baladiya dropdown
- After baladiya, show delivery type radio cards (office/home) with prices
- Update shipping calculation to use the correct rate based on delivery type
- Store `baladiya` and `delivery_type` in the order on submit

**Modify** `src/pages/SingleProductPage.tsx`:
- Same baladiya + delivery type flow in the inline order form
- Store `baladiya` and `delivery_type` in the direct order

**Modify** `src/lib/shipping.ts`:
- Add `deliveryType` parameter to support office vs home pricing

---

### 6. Admin Orders: Receipt Preview + Confirm Button

**Modify** `src/pages/admin/AdminOrdersPage.tsx`:
- In order detail dialog: show `payment_receipt_url` as an embedded `<img>` with a download button
- Add a prominent "Confirm" button that advances the order to the next status step (New -> Processing -> Shipped -> Delivered)

---

### 7. Order Confirmation: Show Order Code + Track Button

**Modify** `src/pages/OrderConfirmationPage.tsx`:
- Add a "Track Order" button linking to `/track?order=ORDER_NUMBER`
- Fix payment method display to handle all methods properly (not just baridimob/flexy)

---

### 8. Fix: Quantity Changes Price on Product Page

**Modify** `src/pages/SingleProductPage.tsx`:
- Below the quantity selector, show total price: `effectivePrice * qty` so the price visually updates when quantity changes

---

### 9. Per-Product Shipping (Already Working)

The existing `src/lib/shipping.ts` already calculates per-product shipping multiplied by quantity. No changes needed except adding office/home support.

---

### 10. Require Variation Selection Before Cart

**Modify** `src/pages/SingleProductPage.tsx`:
- In `handleAdd`: if product has variations but none selected, show error toast and block
- In `handleDirectOrder`: same validation

**Modify** `src/components/ProductCard.tsx`:
- If product has variations, the "Add to Cart" and "Order" buttons navigate to the product page instead of directly adding

---

### 11. Responsive Dashboard (All Admin Pages)

For each admin page, add a mobile card layout that replaces tables on screens below `md` (768px). Desktop keeps the existing table.

**Files to modify:**
- `src/pages/admin/AdminOrdersPage.tsx` -- mobile card: order number + status, customer, total, actions
- `src/pages/admin/AdminProductsPage.tsx` -- mobile card: image + name + price, stock, actions
- `src/pages/admin/AdminLeadsPage.tsx` -- mobile card: name + status, phone, source, actions
- `src/pages/admin/AdminCouponsPage.tsx` -- mobile card: code + discount, expiry, actions
- `src/pages/admin/AdminWilayasPage.tsx` -- mobile card: name + prices + status, actions
- `src/pages/admin/AdminVariationsPage.tsx` -- always-visible action buttons (no hover-only)
- `src/pages/admin/AdminCategoriesPage.tsx` -- stack form inputs vertically on mobile
- `src/pages/admin/AdminDashboardPage.tsx` -- stack pie chart vertically, mobile card for latest orders

---

### Technical Details

**New files:**
| File | Purpose |
|------|---------|
| `src/pages/AboutPage.tsx` | About Us page with animations |

**Modified files:**
| File | Changes |
|------|---------|
| `src/App.tsx` | Add About route |
| `src/components/Navbar.tsx` | Add "من نحن" link |
| `src/components/Footer.tsx` | Add "من نحن" link |
| `src/pages/CheckoutPage.tsx` | Remove COD, add baladiya/delivery type, receipt preview |
| `src/pages/SingleProductPage.tsx` | Baladiya, delivery type, receipt preview, qty price, variation required |
| `src/pages/OrderConfirmationPage.tsx` | Track button, fix payment display |
| `src/pages/admin/AdminOrdersPage.tsx` | Receipt image, confirm button, responsive cards |
| `src/pages/admin/AdminWilayasPage.tsx` | Two prices, bulk import, baladiyat, responsive |
| `src/pages/admin/AdminProductsPage.tsx` | Responsive mobile cards |
| `src/pages/admin/AdminLeadsPage.tsx` | Responsive mobile cards |
| `src/pages/admin/AdminCouponsPage.tsx` | Responsive mobile cards |
| `src/pages/admin/AdminVariationsPage.tsx` | Always-visible actions on mobile |
| `src/pages/admin/AdminCategoriesPage.tsx` | Stack form on mobile |
| `src/pages/admin/AdminDashboardPage.tsx` | Responsive charts + mobile order cards |
| `src/components/ProductCard.tsx` | Redirect to product page if has variations |
| `src/lib/shipping.ts` | Support office/home delivery type |

**Approach for responsive admin pages:**

Each page will use this pattern:
```text
<div className="hidden md:block">  <!-- Desktop table -->
  <table>...</table>
</div>
<div className="md:hidden space-y-3">  <!-- Mobile cards -->
  {items.map(item => (
    <div className="bg-card border rounded-xl p-4">
      <!-- Card layout -->
    </div>
  ))}
</div>
```

**Wilayas bulk import:**
The Algeria cities data (58 wilayas with their baladiyat) will be embedded directly in the admin page as a JSON constant, with a button that batch-inserts all wilayas and their municipalities into the database.

