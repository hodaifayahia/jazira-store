

## Plan: WooCommerce-Style Variations System

Apply WooCommerce's proven variation patterns to both admin and customer-facing sides.

---

### What WooCommerce Does (and what we'll apply)

WooCommerce uses a two-level system:
1. **Global Attributes** (e.g., "Color" with values Red, Blue, Green) -- managed centrally
2. **Product Variations** -- each product picks from global attributes, and each combination gets its own price, stock, and image

Key UX patterns:
- **Color swatches**: Round circles showing actual colors (not text buttons)
- **Size buttons**: Clean bordered buttons for non-color attributes
- **Selected state**: Bold ring/border around selected swatch
- **Out-of-stock variations**: Crossed out or grayed with strikethrough
- **Image switching**: Clicking a color swatch changes the product gallery image
- **Price update**: Price updates dynamically when a variation is selected

---

### Changes

#### 1. Customer-Facing Product Page (`SingleProductPage.tsx`)

**Current state:** Variations show as text buttons with optional small image thumbnails. Color swatches are NOT shown even though `color_code` exists in the `variation_options` table.

**WooCommerce-style changes:**
- Fetch `variation_options` data alongside `product_variations` to get `color_code` for each variation
- For **color-type variations**: Render as round color circles (w-8 h-8 rounded-full) with the actual color from `color_code`. Selected state shows a ring around the circle. Tooltip/label shows the color name on hover.
- For **non-color variations** (size, material, etc.): Render as clean bordered rectangular buttons (like WooCommerce size selectors)
- Out-of-stock variations: Show with reduced opacity and a diagonal line through the swatch
- When selecting a color, if it has an `image_url` on `product_variations`, switch the gallery to that image (already partially implemented)

#### 2. Admin Variations Page (`AdminVariationsPage.tsx`)

**Current state:** Works well as an abstract template manager. Minor improvements:
- Show color swatch circles inline in the list (larger, more prominent) -- already done
- No structural changes needed, this page is already WooCommerce-like (global attributes)

#### 3. Admin Product Form (`AdminProductsPage.tsx` -- ProductForm)

**Current state:** Variation picker uses checkboxes with small color dots. Price/stock per variation is shown in a sub-panel.

**WooCommerce-style changes:**
- For color-type variations: Show actual color circles instead of small dots in checkbox buttons
- Add an image upload per selected variation (WooCommerce lets you set a gallery image per variation). Store in `product_variations.image_url`
- Better layout: Show selected variations in a table-like layout (Value | Color Preview | Price Adjustment | Stock | Image) instead of inline inputs

---

### Technical Details

**Files to modify:**

| File | Changes |
|------|---------|
| `src/pages/SingleProductPage.tsx` | Fetch `variation_options` to get `color_code`, render color swatches as circles, size as bordered buttons, handle out-of-stock with strikethrough |
| `src/pages/admin/AdminProductsPage.tsx` | Improve variation picker with larger color circles, add image upload per variation, table layout for selected variations |

**No database changes needed** -- `variation_options.color_code` and `product_variations.image_url` already exist.

**SingleProductPage variation rendering logic:**
- Join `product_variations` with `variation_options` by matching `variation_type` + `variation_value` to get `color_code`
- Render color types: `<button className="w-9 h-9 rounded-full border-2 ring-2 ring-offset-2" style={{ backgroundColor: colorCode }} />`
- Render non-color types: `<button className="px-4 py-2 rounded-lg border-2 font-medium">{value}</button>`
- Selected state: `ring-primary` for colors, `border-primary bg-primary/10` for text buttons
- Disabled state: `opacity-30 cursor-not-allowed relative` with a diagonal CSS line

**ProductForm variation section:**
- Replace inline inputs with a clean card for each selected variation showing: color preview (if color), value name, price adjustment input, stock input, image upload button
- Image upload uses the existing `products` storage bucket

