
# Digital Products Support + New Payment Methods

## Overview
Make the shop flexible enough to sell both physical and digital products. This involves adding a product type flag, skipping shipping-related fields for digital products, adding a new storefront template optimized for digital products, and adding three new international payment methods (Binance, Vodafone Cash, Redotpay).

---

## 1. Database: Add `product_type` Column

Add a new column to the `products` table:
- `product_type` (text, default `'physical'`, not null) -- values: `'physical'` or `'digital'`

No new tables needed. Digital products will use the same `products` table with this type distinction.

---

## 2. Admin Product Form (AdminProductsPage.tsx)

In the `ProductForm` component:
- Add a "Product Type" toggle/selector at the top (Physical / Digital) using two styled buttons
- When `digital` is selected:
  - Hide shipping-related fields (free shipping toggle, shipping price)
  - Hide stock/quantity field (digital products have unlimited stock, or set stock to a very high default)
  - Show an optional "Download Link / Access Instructions" textarea field (stored in `description` or a new setting -- we'll use `short_description` for delivery instructions)
- Save `product_type` in the payload

---

## 3. Checkout Adaptations (CheckoutPage.tsx + SingleProductPage.tsx)

When the cart contains **only digital products**:
- Hide wilaya, baladiya, delivery type, and address fields entirely
- Set shipping cost to 0
- Skip abandoned cart wilaya tracking
- Skip the Algerian phone validation (allow international format) -- actually keep phone for contact but relax the 05/06/07 prefix requirement for digital-only carts
- In the order summary, hide the shipping line

When the cart is **mixed** (physical + digital):
- Show shipping fields as normal (physical items need shipping)
- Digital items contribute 0 to shipping

---

## 4. New Payment Methods

### Settings (AdminPaymentPage.tsx)
Add three new payment method toggles with their config fields:

- **Binance Pay**: toggle + wallet address/Pay ID field
- **Vodafone Cash**: toggle + phone number field  
- **Redotpay**: toggle + wallet/account field

Settings keys: `binance_enabled`, `binance_address`, `vodafone_enabled`, `vodafone_number`, `redotpay_enabled`, `redotpay_address`

### Checkout (CheckoutPage.tsx + SingleProductPage.tsx)
- Show new payment options when enabled
- All three require receipt upload (like Baridimob/Flexy)
- Display the relevant account info when selected

### RLS
The new settings keys are non-sensitive (wallet addresses for customers to send payment to), so they pass through the existing public read policy.

---

## 5. Digital Products Storefront Template

### New Template: "Digital" (رقمي)
Add a fifth template option in `AppearanceTab.tsx`:
- ID: `digital`
- Icon: `Monitor` from lucide-react
- Name: رقمي (Digital)
- Description: optimized layout for digital products -- no shipping badges, prominent "instant delivery" messaging, clean card design

### New Component: `src/components/templates/DigitalTemplate.tsx`
- Hero section emphasizing instant digital delivery
- Product grid with badges like "تسليم فوري" (Instant Delivery)
- No shipping-related trust badges
- Clean, modern card layout focused on digital goods

---

## 6. Translation Keys

Add new keys to `ar.ts`, `en.ts`, `fr.ts` for:
- Product type labels (physical/digital)
- New payment method names
- Digital template description
- Delivery instructions label

---

## Files Modified

| File | Change |
|------|--------|
| `supabase/migrations/` | Add `product_type` column to `products` |
| `src/pages/admin/AdminProductsPage.tsx` | Product type selector in form, conditional field visibility |
| `src/pages/CheckoutPage.tsx` | Skip shipping for digital-only carts, add new payment methods |
| `src/pages/SingleProductPage.tsx` | Skip shipping UI for digital products, add new payment methods |
| `src/pages/admin/settings/AdminPaymentPage.tsx` | Add Binance/Vodafone/Redotpay toggles + config |
| `src/components/admin/AppearanceTab.tsx` | Add Digital template option |
| `src/components/templates/DigitalTemplate.tsx` | New file -- digital storefront template |
| `src/pages/Index.tsx` | Import and render DigitalTemplate when selected |
| `src/i18n/locales/ar.ts` | New translation keys |
| `src/i18n/locales/en.ts` | New translation keys |
| `src/i18n/locales/fr.ts` | New translation keys |
