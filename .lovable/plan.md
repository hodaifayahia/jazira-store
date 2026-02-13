

# Website Settings: Form Customization and Store Templates

## Overview
Two new admin settings sections will be added:
1. **Checkout Form Customizer** -- Control which fields appear on the checkout form, which are required, and which are hidden.
2. **Store Templates / Appearance** -- Choose from ready-made visual templates that change the homepage layout and style.

Both will be implemented as new tabs inside the existing Admin Settings page (`/admin/settings`), storing configuration in the existing `settings` table as JSON values.

---

## Part 1: Checkout Form Customizer

### What it does
A new "Form Settings" tab in admin settings where you can configure each checkout field:
- **Full Name** -- visible/hidden, required/optional
- **Phone** -- always required (cannot be hidden)
- **Wilaya** -- visible/hidden, required/optional
- **Baladiya** -- visible/hidden, required/optional
- **Delivery Type** -- visible/hidden, required/optional
- **Address** -- visible/hidden, required/optional
- **Coupon Code** -- show/hide the coupon section entirely
- **Payment Receipt** -- show/hide

Each field will have a toggle for "Visible" and a toggle for "Required". Some fields like Phone will be locked as always required.

### Technical Details
- Store a single JSON setting with key `checkout_form_config` in the `settings` table
- JSON structure example:
```text
{
  "name": { "visible": true, "required": true },
  "phone": { "visible": true, "required": true, "locked": true },
  "wilaya": { "visible": true, "required": true },
  "baladiya": { "visible": true, "required": false },
  "delivery_type": { "visible": true, "required": true },
  "address": { "visible": true, "required": false },
  "coupon": { "visible": true, "required": false },
  "payment_receipt": { "visible": true, "required": false }
}
```
- Add a new tab "Form" with a table/list of fields, each with Visible and Required toggles
- Update `CheckoutPage.tsx` to read this config and conditionally render/validate fields

### Files to modify
- `src/pages/admin/AdminSettingsPage.tsx` -- add "Form" tab with field configuration UI
- `src/pages/CheckoutPage.tsx` -- read `checkout_form_config` from settings and conditionally show/require fields

---

## Part 2: Store Templates / Appearance

### What it does
A new "Appearance" tab in admin settings with 3 ready-made homepage templates the admin can choose from:

1. **Classic** (current layout) -- Hero slider, trust bar, categories grid, product sections
2. **Minimal** -- Clean layout, no hero slider, simple product grid with large search bar
3. **Bold** -- Full-width hero with overlay text, large category cards, featured product spotlight

### Technical Details
- Store a setting with key `store_template` in the `settings` table (values: `classic`, `minimal`, `bold`)
- The "Appearance" tab shows visual previews (simple card mockups) for each template
- The homepage (`Index.tsx`) reads the template setting and renders the chosen layout
- Each template reuses existing components (ProductCard, categories, etc.) but arranges them differently
- The existing hero slides, colors, and announcements continue to work across all templates

### Files to modify/create
- `src/pages/admin/AdminSettingsPage.tsx` -- add "Appearance" tab with template selector cards
- `src/pages/Index.tsx` -- read `store_template` setting, render layout based on selection
- Optionally extract template layouts into separate components under `src/components/templates/` for cleanliness:
  - `src/components/templates/ClassicTemplate.tsx`
  - `src/components/templates/MinimalTemplate.tsx`
  - `src/components/templates/BoldTemplate.tsx`

---

## Settings Tab Layout Update
The current settings page has 5 tabs. Two new ones will be added, making 7 total. The tab bar will be updated from `grid-cols-5` to `grid-cols-7` (or a scrollable horizontal layout for mobile).

New tab order:
1. Store Identity
2. Payment/Delivery
3. Telegram
4. Returns
5. **Form** (new)
6. **Appearance** (new)
7. Security

---

## No Database Migration Needed
Both features store their data as JSON strings in the existing `settings` table using new keys (`checkout_form_config` and `store_template`). No schema changes are required.

