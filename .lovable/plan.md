

# Streamline Product Variations: Use Pre-defined Templates

## Overview
Instead of manually typing option group names and values every time you create a product, the form will let you **pick from your existing variation library** (the ones managed in the Variations page). Select "اللون" and all your pre-defined colors auto-populate. You just fill in the variant matrix (Image, SKU, Price, Stock, Active).

## How It Will Work

### Current Flow (tedious)
1. Type "اللون" as option name
2. Choose display type "ألوان"
3. Manually type "أحمر" + Enter, "أزرق" + Enter, etc.
4. Fill variant matrix

### New Flow (fast)
1. Click "إضافة خيار" → a dropdown shows your saved variation types (اللون, المقاس, etc.)
2. Select "اللون" → all saved color values auto-load with their color codes, display type auto-sets to "color_swatch"
3. You can toggle on/off individual values you don't need for this product
4. Variant matrix generates automatically — just fill in Image, SKU, Price, Stock, Active
5. You can still manually add custom values if needed

## Technical Details

### File: `src/pages/admin/AdminProductsPage.tsx`

**Changes to the Option Groups Builder section (lines ~1380-1516):**

1. **Fetch `variation_options`** from the database (already available as a query pattern from AdminVariationsPage)

2. **Replace the free-text option name input** with a `Select` dropdown that lists unique variation types from `variation_options` (e.g., اللون, المقاس, المادة)
   - Keep an "Other" / custom option for manual entry

3. **Auto-populate values** when a type is selected:
   - Query `variation_options` filtered by that type
   - Auto-set `displayType` based on whether it's a color type (using the existing `isColorType` helper)
   - Pre-fill the values array with all active options of that type (label + colorHex from `color_code`)
   - Each value gets a checkbox/toggle so the user can deselect values they don't need for this specific product

4. **Auto-set display type**: If the selected type is color-related, auto-set to `color_swatch`; otherwise default to `button`

5. **Keep manual add capability**: The existing "add value + Enter" input stays at the bottom for adding product-specific custom values not in the library

### No Database Changes
The `variation_options` table already has everything needed (variation_type, variation_value, color_code, is_active). We just read from it.

### No New Files
All changes are within the existing ProductForm component in `AdminProductsPage.tsx`.

### Translation Keys
Add a few new keys to `ar.ts`, `en.ts`, `fr.ts`:
- `selectVariationType` — "اختر نوع الخيار"
- `customOption` — "خيار مخصص"
- `loadFromLibrary` — "تحميل من المكتبة"

