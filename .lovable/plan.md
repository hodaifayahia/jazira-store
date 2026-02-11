
# Fix Payment Methods + Add COD + Complete Translations

## Problems Identified

### 1. Payment methods not showing in checkout
The checkout page only renders payment options when `baridimob_enabled` or `flexy_enabled` is `'true'` in settings. Since no payment settings exist in the database, **zero payment options appear** -- the customer sees an empty payment section and cannot place an order.

### 2. Missing "Cash on Delivery" (COD) option
The user wants "توصيل عن الاستلام" (Cash on Delivery / الدفع عند الاستلام) as a payment method. Currently only BaridiMob and Flexy exist.

### 3. Remaining pages still have hardcoded Arabic
Products, Settings, Confirmers, and Returns pages still use hardcoded Arabic strings instead of translation keys.

---

## Solution

### A. Add COD Payment Method + Fix Payment Visibility

**Settings Page (`AdminSettingsPage.tsx`)** -- Payment tab:
- Add a COD toggle: `cod_enabled` setting with switch to enable/disable
- Keep existing BaridiMob and Flexy toggles
- All three payment methods controllable from settings

**Checkout Page (`CheckoutPage.tsx`)**:
- Add COD option: when `cod_enabled === 'true'`, show a "الدفع عند الاستلام" radio button (no receipt upload needed)
- COD does not require receipt -- just selects `paymentMethod = 'cod'`
- Skip receipt validation when payment method is COD
- If no payment methods are enabled at all, show a message like "لا توجد طرق دفع متاحة"

**Locale files** -- Add keys for COD:
- `orders.cod` already exists as "Cash on Delivery" / "Paiement a la livraison" / "الدفع عند الاستلام"

### B. Translate Remaining Admin Pages

Replace all hardcoded Arabic text with `t()` calls in:

1. **AdminProductsPage.tsx** (~1648 lines) -- page header, KPI cards, tabs, search/filter, table headers, bulk actions, delete dialogs, pagination, and the `ProductForm` sub-component (form labels, image section, offers, variants)

2. **AdminSettingsPage.tsx** (~865 lines) -- all 5 tab labels, store identity section, payment section (including new COD), telegram section, returns section, security section, footer settings

3. **AdminConfirmersPage.tsx** (~740 lines) -- header, 3 tab labels, add form labels, team table headers, filter options, edit dialog, settings tab, toast messages

4. **AdminReturnsPage.tsx** (~728 lines) -- KPI cards, status labels, resolution labels, table headers, detail dialog, action buttons, status history

---

## Files Changed

- `src/i18n/locales/ar.ts` -- add COD and missing product form keys
- `src/i18n/locales/en.ts` -- add COD and missing product form keys
- `src/i18n/locales/fr.ts` -- add COD and missing product form keys
- `src/pages/CheckoutPage.tsx` -- add COD payment option, handle empty state
- `src/pages/admin/AdminSettingsPage.tsx` -- add COD toggle in payment tab, apply translations
- `src/pages/admin/AdminProductsPage.tsx` -- apply translations to all hardcoded text
- `src/pages/admin/AdminConfirmersPage.tsx` -- apply translations
- `src/pages/admin/AdminReturnsPage.tsx` -- apply translations

## Technical Details

### COD in Checkout
```text
- Read `settings.cod_enabled`
- If 'true', render a simple radio button for COD
- COD skips receipt validation in handleSubmit
- Payment method value stored as 'cod' in orders table
```

### Payment Settings Section (Admin)
```text
Add before BaridiMob section:
- Switch for "الدفع عند الاستلام" (cod_enabled)
- Simple toggle, no extra fields needed

All 3 methods (COD, BaridiMob, Flexy) independently toggleable
```

### Translation Pattern
Each page: import `useTranslation`, call `const { t } = useTranslation()`, replace Arabic strings with `t('key')`. Dynamic values use `.replace('{n}', String(value))`.
