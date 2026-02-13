

# Fix Coupons + Product Timer + Product Page Conversion Redesign

## 1. Fix Coupon Listing Bug

**Problem**: The `coupons` table has no `created_at` column, but the query orders by `created_at`, causing a 400 error and no coupons showing.

**Fix in `src/pages/admin/AdminCouponsPage.tsx` (line 30)**:
- Change `.order('created_at' as any, { ascending: false })` to `.order('code')` (or simply remove the order clause)

This is the only change needed -- coupons will immediately start showing.

---

## 2. Product Timer (Limited-Time Offer)

Add two new columns to the `products` table to support a countdown timer:

**Database migration**:
```sql
ALTER TABLE public.products
  ADD COLUMN offer_title text,
  ADD COLUMN offer_ends_at timestamptz;
```

- `offer_title`: e.g. "عرض خاص - خصم 30%" (displayed above the countdown)
- `offer_ends_at`: the date/time after which the product is no longer on offer

**Admin side** (`src/pages/admin/AdminProductsPage.tsx`):
- Add two fields in the product form: a text input for "عنوان العرض" and a datetime-local input for "ينتهي في"
- Both optional -- if empty, no timer shows

**Storefront** (`src/pages/SingleProductPage.tsx`):
- If `offer_ends_at` is in the future, show an attractive countdown banner with the `offer_title`
- Countdown displays days, hours, minutes, seconds (auto-updating every second)
- When the timer reaches zero, the banner hides
- Styled with urgency colors (amber/red gradient background, pulsing animation)

---

## 3. Product Page Conversion Redesign

### A. Sticky Bottom Buy Bar
When the user scrolls past the "Add to Cart" section, a fixed bottom bar appears with:
- Product name (truncated)
- Price (bold, primary color)
- "اطلب الآن" button
- Smooth slide-up animation, disappears when scrolling back up to the form

Implementation: Use an `IntersectionObserver` on the order form section. When it leaves the viewport, show the sticky bar.

### B. UI/UX Improvements for Conversion
- **Trust signals section**: Add a row of icons below the price showing: free delivery badge, secure payment, fast shipping, return guarantee
- **Urgency indicators**: Stock count with warning color when low (less than 5: "بقي 3 فقط!")
- **Better CTA hierarchy**: Make "تأكيد الطلب" button larger with a pulse animation, add a secondary "إضافة إلى السلة" outline button
- **Social proof**: Move reviews count + star rating more prominently near the price
- **Image gallery**: Add touch swipe support on mobile for product images

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/AdminCouponsPage.tsx` | Fix `.order('created_at')` to `.order('code')` |
| `src/pages/admin/AdminProductsPage.tsx` | Add offer_title + offer_ends_at fields in product form |
| `src/pages/SingleProductPage.tsx` | Add countdown timer, sticky bottom bar, trust signals, urgency UI, better CTA design |
| `src/i18n/locales/ar.ts` | New keys for timer/trust signals |
| `src/i18n/locales/en.ts` | New keys for timer/trust signals |
| `src/i18n/locales/fr.ts` | New keys for timer/trust signals |

## Database Migration
```sql
ALTER TABLE public.products
  ADD COLUMN offer_title text,
  ADD COLUMN offer_ends_at timestamptz;
```

No RLS changes needed -- products table already has public read + admin write policies.

