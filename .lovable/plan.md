

## Enhanced Product Management

Three major features to add: main image selection, multi-category support, and per-product shipping price.

---

### 1. Database Changes

Add a `shipping_price` column to the `products` table and change `category` from a single text to a text array for multi-category support. Add a `main_image_index` column to track which image is the primary one.

```text
Migration SQL:
- ALTER products ADD COLUMN shipping_price numeric DEFAULT 0
- ALTER products ADD COLUMN main_image_index integer DEFAULT 0
- ALTER products ALTER COLUMN category TYPE text[] USING ARRAY[category]
```

### 2. Admin Products Page (src/pages/admin/AdminProductsPage.tsx)

Overhaul the product create/edit form:

| Feature | Current | New |
|---------|---------|-----|
| Images | Upload multiple, first is main | Upload multiple + click any thumbnail to set as "main" (star icon overlay) |
| Category | Single select dropdown | Multi-select with checkboxes for all categories |
| Shipping price | Not present | New numeric input field for per-product delivery cost (دج) |
| Main image indicator | None | Gold star/border on the selected main image thumbnail |

**Form state changes:**
- `category` becomes `categories: string[]`
- Add `shippingPrice: string` field
- Add `mainImageIndex: number` to track which image is the main display image
- Image grid: clicking a thumbnail sets it as main (visually highlighted)

### 3. Product Display Updates

**ProductCard** (`src/components/ProductCard.tsx`):
- Use `main_image_index` to pick the correct image instead of always `images[0]`

**ProductsPage** (`src/pages/ProductsPage.tsx`):
- Filter by category now checks if the selected category is IN the product's category array (`.contains()` or client-side `.includes()`)
- Display the main image using `main_image_index`

**SingleProductPage** (`src/pages/SingleProductPage.tsx`):
- Default selected image to `main_image_index` instead of 0
- Show all categories as badges instead of single badge
- Display per-product shipping price info

### 4. Shipping Logic Update

**src/lib/shipping.ts**:
- Update `calculateShipping` to accept per-product shipping prices
- New formula: sum of each item's `shipping_price * quantity` (if product has its own price), falling back to wilaya base price for products without a custom shipping price

**CartContext** (`src/contexts/CartContext.tsx`):
- Add `shippingPrice` to `CartItem` interface so it flows through to checkout

**CheckoutPage** (`src/pages/CheckoutPage.tsx`):
- Update shipping calculation to use per-product shipping prices when available

### 5. Files to Modify

| File | Changes |
|------|---------|
| Database migration (new) | Add `shipping_price`, `main_image_index` columns; convert `category` to `text[]` |
| `src/pages/admin/AdminProductsPage.tsx` | Multi-category checkboxes, shipping price input, main image selector |
| `src/components/ProductCard.tsx` | Use `main_image_index` for display image; accept categories array |
| `src/pages/ProductsPage.tsx` | Filter using array contains; pass main image |
| `src/pages/SingleProductPage.tsx` | Show multiple categories; default to main image; show shipping price |
| `src/lib/shipping.ts` | Per-product shipping price support |
| `src/contexts/CartContext.tsx` | Add `shippingPrice` to CartItem |
| `src/pages/CheckoutPage.tsx` | Use per-product shipping in calculations |
| `src/components/ProductQuickView.tsx` | Update for multi-category and main image |
| `src/pages/Index.tsx` | Pass main image index to ProductCard |

### Technical Notes

- The `category` column type change from `text` to `text[]` uses `USING ARRAY[category]` to migrate existing data safely
- Multi-category selection in admin uses checkbox list from the categories settings
- Main image selection is purely UI -- clicking a thumbnail in the admin form highlights it and updates the `main_image_index` that gets saved
- Per-product shipping price of 0 means "use wilaya default price" as fallback

