

## Plan: Separate Variations Management Page with Photo Association

### Overview

Move variation management out of the product form into its own dedicated admin page. Variations will be managed globally (e.g., define "اللون: أحمر", "المقاس: XL" once), then assigned to products. Each variation can have an associated photo.

---

### 1. Create New Admin Page: `src/pages/admin/AdminVariationsPage.tsx`

A full CRUD page for managing variations globally:
- List all variations grouped by `variation_type` (color, size, etc.)
- Add/edit/delete variations with fields:
  - **variation_type** (text input or select from existing types)
  - **variation_value** (e.g., "أحمر", "XL")
  - **price_adjustment** (numeric)
  - **stock** (numeric)
  - **image_url** (upload photo -- especially for colors)
  - **is_active** toggle
- Photo upload: use the existing `products` storage bucket to upload variation images
- Each variation still belongs to a `product_id`, so the page will show a product selector or group by product

**Alternative approach (better UX):** Since variations are per-product (they have `product_id` FK), the page will:
- Show all products in a list/select
- When a product is selected, show its variations
- Allow adding/editing/deleting variations for that product
- Each variation can have an uploaded image

### 2. Add Sidebar Item in `src/components/AdminLayout.tsx`

Add a new entry to `NAV_ITEMS` array (line 36-45):
```
{ href: '/admin/variations', label: 'المتغيرات', icon: Palette }
```
Place it after "المنتجات" for logical grouping. Use the `Palette` icon from lucide-react.

### 3. Add Route in `src/App.tsx`

Add route at line ~65:
```
<Route path="/admin/variations" element={<AdminLayout><AdminVariationsPage /></AdminLayout>} />
```

### 4. Simplify Product Form in `src/pages/admin/AdminProductsPage.tsx`

Remove the entire "المتغيرات" section (lines 779-853) from the `ProductForm` component. Replace with a read-only summary showing how many variations exist for this product, with a link to the variations page. Also remove the variation-related state and save logic from the form.

### 5. Fix Variation Selection on `src/pages/SingleProductPage.tsx`

**Current issue:** The variation buttons work but don't show the associated image when selected.

Changes:
- When a variation with `image_url` is selected, update the main gallery to show that image (prepend or switch to it)
- Ensure clicking a color/variation button properly toggles selection state
- Show a small color swatch or image preview next to each variation button if `image_url` exists

### 6. Update `product_variations` Table -- Add `image_url` Support

The `image_url` column already exists in the `product_variations` table from the previous migration, so no database changes needed. Just need to use it in the UI.

---

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/admin/AdminVariationsPage.tsx` | **Create** | New page for global variation management with photo upload |
| `src/components/AdminLayout.tsx` | Modify | Add "المتغيرات" to sidebar nav (line 39, add new item with Palette icon) |
| `src/App.tsx` | Modify | Add route for `/admin/variations` |
| `src/pages/admin/AdminProductsPage.tsx` | Modify | Remove variation CRUD from product form, replace with link |
| `src/pages/SingleProductPage.tsx` | Modify | Fix variation selection + show variation image in gallery |

### No database changes needed
The `product_variations` table already has `image_url` column.

