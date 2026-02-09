

# Plan: Hero Redesign, Search Fix, Per-Product Shipping in Cart, and Dynamic Product Variations

---

## 1. Redesign Hero Section (Index.tsx)

**Current issue:** The hero uses a glassmorphism card over a carousel background. The search bar sits inside it but navigates to `/products?search=...` -- however the ProductsPage search uses `p.name.includes(search)` which is case-sensitive and doesn't handle Arabic well.

**Changes:**
- Replace the current hero with a cleaner, modern split-layout design:
  - Right side: Bold headline text, subtext, and CTA buttons (no glassmorphism card -- cleaner)
  - Left side: A high-quality product collage or featured product image grid (using actual product images from the DB)
- Use a gradient background (green-to-dark) instead of relying on `hero-banner.jpg`
- Move the search bar to be more prominent -- full-width below the hero or integrated into the Navbar
- Remove the separate "Product Images Carousel" section (redundant with the product grid below)

## 2. Fix Search Functionality (ProductsPage.tsx)

**Current bug (line 65):** `p.name.includes(search)` -- exact case-sensitive match.

**Fix:**
- Change to: `p.name.toLowerCase().includes(search.toLowerCase())` for basic case-insensitive matching
- Also add Arabic normalization: strip tashkeel (diacritics) from both search query and product names using a regex like `/[\u0610-\u061A\u064B-\u065F\u0670]/g`
- This ensures partial matching works for Arabic text

## 3. Per-Product Shipping Display in Cart Page (CartPage.tsx)

**Current issue:** The cart page shows only subtotal with no shipping info per product. Shipping is only calculated at checkout.

**Changes:**
- Fetch each product's `shipping_price` from the DB when rendering the cart
- Display shipping cost per item line (e.g., "التوصيل: 200 دج") next to each cart item
- Show a note: "سعر التوصيل يحسب لكل منتج على حدة"
- Update the order summary sidebar to show:
  - Subtotal
  - Estimated total shipping (sum of per-product shipping)
  - Note that final shipping depends on wilaya selection at checkout

## 4. Dynamic Product Variations (Colors, Sizes, etc.)

This requires database changes and UI updates across multiple files.

### 4.1 Database Migration
Create a new `product_variations` table:

```text
product_variations
  - id (uuid, PK, default gen_random_uuid())
  - product_id (uuid, FK -> products.id, ON DELETE CASCADE)
  - variation_type (text) -- e.g., "اللون", "المقاس", "النوع"
  - variation_value (text) -- e.g., "أحمر", "XL", "قطن"
  - price_adjustment (numeric, default 0) -- +/- from base price
  - stock (integer, default 0)
  - image_url (text, nullable) -- optional image for this variation
  - is_active (boolean, default true)
  - created_at (timestamptz, default now())
```

RLS policies:
- SELECT: public (true)
- ALL: admin only (has_role check)

### 4.2 SingleProductPage.tsx -- Variation Selector in Sidebar
- Fetch variations for the current product from `product_variations`
- Group variations by `variation_type` (e.g., all colors together, all sizes together)
- Render selection UI:
  - Colors: clickable color swatches or labeled buttons
  - Sizes/other: selectable buttons or dropdown
- When a variation is selected:
  - Adjust displayed price (base + price_adjustment)
  - Update stock display based on variation stock
  - If variation has `image_url`, show it in the gallery
- Pass selected variation info to the cart (update CartItem type to include `variation` field)

### 4.3 CartContext.tsx -- Support Variations
- Extend `CartItem` interface with optional `variation` field:
  ```
  variation?: { type: string; value: string; priceAdjustment: number }
  ```
- Update `addItem` to treat same product with different variations as separate cart items (use `id + variation_value` as composite key)

### 4.4 Admin Products Page -- Variation Management
- Add a "المتغيرات" (Variations) section in the product create/edit form
- Allow adding multiple variations with type, value, price adjustment, stock, and optional image
- CRUD operations on `product_variations` table

### 4.5 ProductCard.tsx -- Show Available Variations
- Fetch variation types for each product (or include in product query)
- Show small badges like "3 ألوان" or "4 مقاسات" on the card

---

## 5. Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/Index.tsx` | Modify | Redesign hero section with gradient + product collage |
| `src/pages/ProductsPage.tsx` | Modify | Fix search with Arabic normalization |
| `src/pages/CartPage.tsx` | Modify | Add per-product shipping display |
| `src/contexts/CartContext.tsx` | Modify | Add variation support to CartItem |
| `src/pages/SingleProductPage.tsx` | Modify | Add variation selector UI |
| `src/components/ProductCard.tsx` | Modify | Show variation badges |
| `src/pages/admin/AdminProductsPage.tsx` | Modify | Add variation management in product form |
| `supabase/migrations/xxx.sql` | Create | New `product_variations` table with RLS |

## 6. Migration SQL Summary

```text
CREATE TABLE product_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variation_type text NOT NULL,
  variation_value text NOT NULL,
  price_adjustment numeric DEFAULT 0,
  stock integer DEFAULT 0,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;
-- Public read
-- Admin manage (has_role)
```

