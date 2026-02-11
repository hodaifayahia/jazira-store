

# Product Variation System Overhaul -- Phased Plan

## Current State Analysis

The existing system uses a **flat variation model**: each product has independent `product_variations` rows (type: "Color", value: "Red") that are selected individually. There is NO Cartesian product logic -- a product with 3 colors and 4 sizes shows 7 selectors, not 12 variant combinations.

The requested system is a **combinatorial variant model** where Color:Red + Size:XL = 1 unique variant with its own SKU, price, and stock. This is a fundamentally different architecture.

**This is NOT multi-tenant** (no `store_id` in the current schema), so I will omit `store_id` from all table designs to match the existing single-store architecture.

---

## Phase 1: Database Schema + Option Group Builder (This Implementation)

### 1. Database Migration

Create new tables while keeping old ones temporarily for backward compatibility:

```sql
-- Option groups per product (replaces global variation_options concept)
CREATE TABLE product_option_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  display_type text NOT NULL DEFAULT 'button',  -- 'dropdown', 'color_swatch', 'button', 'radio'
  position integer DEFAULT 0,
  UNIQUE(product_id, name)
);

-- Option values per group
CREATE TABLE product_option_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option_group_id uuid NOT NULL REFERENCES product_option_groups(id) ON DELETE CASCADE,
  label varchar(100) NOT NULL,
  color_hex varchar(7),
  position integer DEFAULT 0,
  UNIQUE(option_group_id, label)
);

-- Combinatorial variants (each row = one unique combination)
CREATE TABLE product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku varchar(100),
  price numeric NOT NULL,
  compare_at_price numeric,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  weight_grams integer,
  barcode varchar(100),
  image_url text,
  is_active boolean DEFAULT true,
  option_values jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Join table for relational integrity
CREATE TABLE product_variant_options (
  variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
  option_value_id uuid REFERENCES product_option_values(id) ON DELETE CASCADE,
  PRIMARY KEY (variant_id, option_value_id)
);
```

Add `has_variants boolean DEFAULT false` to the `products` table.

RLS policies: public read + admin write (matching existing patterns).

### 2. Admin UI: Option Group Builder

Replace the current "Variations Picker" section in the ProductForm with a new **Option Group Builder**:

- "Add Option" button (max 3 groups) opens an inline form:
  - Option name (text input with datalist suggestions like "اللون", "المقاس")
  - Display type selector (dropdown / color_swatch / button / radio)
  - Values: tag/chip input -- type a value + press Enter to add chips. Removable chips.
  - For `color_swatch` type: show a color picker next to each value chip.
- Each option group is collapsible and deletable.
- Max 3 groups enforced -- hide "Add Option" when limit reached.

### 3. Admin UI: Variant Matrix Table

After option groups are defined, auto-generate a Cartesian product table:

```text
| Variant        | SKU       | Price (DZD) | Stock | Image | Active |
|----------------|-----------|-------------|-------|-------|--------|
| أحمر / S       | TS-RED-S  | 1500        | 25    | [img] | toggle |
| أحمر / M       | TS-RED-M  | 1500        | 30    | [img] | toggle |
| أزرق / S       | TS-BLU-S  | 1500        | 15    | [img] | toggle |
```

Features:
- Inline editing for SKU, price, stock
- Image picker from product gallery
- Active/inactive toggle per variant
- Validation: max 100 total variants
- Auto-generate SKU button (pattern: `{product_sku}-{value1}-{value2}`)
- Variants are computed client-side from option groups and synced to DB on save

### 4. Save Logic (Variant Generation Algorithm)

On product save:
1. Compute Cartesian product of all option group values.
2. Match existing variants by option_values JSONB to preserve SKU/price/stock edits.
3. Create new variants for new combinations (inheriting product.price, quantity=0).
4. Remove variants whose combinations no longer exist (if no associated orders, hard delete; otherwise soft-disable).
5. Set `product.has_variants = (option_groups.length > 0)`.
6. If no option groups, ensure 1 "default" variant exists.

### 5. Storefront: Variant Selector

Update `SingleProductPage.tsx`:
- Fetch `product_option_groups` + `product_option_values` + `product_variants` for the product.
- Render selectors based on `display_type` (color swatches, buttons, dropdowns, radio).
- On selection: find the matching variant by option_values, update price/stock/image.
- Cross-disable: dim unavailable combinations (e.g., if Red+XXL is out of stock, dim XXL when Red is selected).
- "Out of Stock" badge on unavailable variants.

### 6. Cart + Checkout Integration

Update `CartContext.tsx`:
- Change `CartItem` to reference `variant_id` instead of product variations.
- Store variant snapshot (sku, price, option_values) in cart item.
- Update `CheckoutPage` and `SingleProductPage` inline order form to use variant_id in order_items.

### 7. Bundle Offers Display on Storefront

Update `SingleProductPage.tsx` to show bundle offers below the price:
- "Buy 2 for 5,000 DZD (Save 1,000 DZD!)" with computed savings.
- Clicking a bundle auto-sets the quantity.

---

## Technical Details

### Files to Create
- None (all changes are within existing files + migrations)

### Files to Modify
- `src/pages/admin/AdminProductsPage.tsx` -- Replace variations picker with Option Group Builder + Variant Matrix Table
- `src/pages/SingleProductPage.tsx` -- New variant selector with cross-disable logic + bundle offers display
- `src/contexts/CartContext.tsx` -- Update CartItem to use variant_id
- `src/pages/CheckoutPage.tsx` -- Update order_items to include variant data
- `src/pages/admin/AdminVariationsPage.tsx` -- Keep as a legacy global template page (not removed yet)

### Database Migration
1. Create 4 new tables (product_option_groups, product_option_values, product_variants, product_variant_options)
2. Add `has_variants` column to products
3. Add `variant_id` column to order_items (nullable, for backward compatibility)
4. Enable RLS on all new tables

### Backward Compatibility
- Old `product_variations` and `variation_options` tables are NOT removed yet
- Products without option groups continue to work as before (single default variant)
- Existing orders are unaffected (variant_id is nullable in order_items)

### Validation Rules
- Max 3 option groups per product
- Max 20 values per option group
- Max 100 total variants (Cartesian product limit)
- Variant quantity >= 0
- Bundle price should be less than qty x unit_price (warning only)

### What is NOT included in this phase
- CSV import with variants
- Inventory deduction with row-level locking (SELECT FOR UPDATE)
- Low-stock alerts and notifications
- Variant weight/barcode fields in the UI (DB columns exist but UI deferred)
- Drag-and-drop reordering of option groups/values
- Multi-tenant store_id scoping

