

# Manual Order Creation + Product Seeding with AI Images

## Overview

Add a comprehensive "Create Order" dialog to the admin orders page, seed the wilayas table with shipping data, add product variants/variations, and generate AI product images for all seeded products.

## Part 1: Manual Order Creation Dialog

### New Component: `src/components/admin/ManualOrderDialog.tsx`

A responsive dialog with these sections:

**Customer Information**
- Name (required, text input)
- Phone (required, validated with `05/06/07` prefix pattern)
- Wilaya (searchable select from `wilayas` table)
- Baladiya (filtered by selected wilaya, using `algeria-wilayas.ts` data)
- Delivery type (office / home radio buttons)
- Address (textarea, shown for home delivery)
- Payment method (COD / BaridiMob / Flexy select)

**Product Selection**
- Searchable product list from `products` table
- Each product shows name, price, available stock, and image thumbnail
- Quantity input per selected product
- Support for product variations/variants if applicable
- "Add product" button to add items to the order
- Running list of added items with remove button

**Order Summary (live-calculated)**
- Subtotal (sum of item prices x quantities)
- Shipping cost (calculated from selected wilaya's shipping rate + delivery type)
- Coupon code input with "Apply" button (validates against `coupons` table)
- Discount amount display
- Total amount (bold)

**Submit Logic**
- Insert into `orders` table with all customer/order fields
- Insert into `order_items` table for each product
- Deduct stock from `products` table (and variant stock if applicable)
- Show success toast with generated order number
- Invalidate orders query to refresh the list

### Changes to `AdminOrdersPage.tsx`

- Add a "+" or "Add Order" button next to the search/filter bar
- State for controlling the dialog open/close
- Import and render `ManualOrderDialog`

## Part 2: Database Seeding -- Wilayas

Insert all 58 Algerian wilayas into the `wilayas` table with realistic shipping prices:
- Office delivery (shipping_price): 400-900 DZD depending on distance from Algiers
- Home delivery (shipping_price_home): +200 DZD premium over office rate
- All wilayas set to `is_active: true`

This is critical because the wilayas table is currently empty, which breaks both checkout and manual order creation.

## Part 3: Product Variants & Variations Seeding

Add variations to existing products to cover different cases:

| Product | Variation Type | Values |
|---------|---------------|--------|
| تمر المجهول الفاخر | الوزن (Weight) | 500g, 1kg, 2kg |
| عسل السدر الطبيعي | الحجم (Size) | 250g, 500g, 1kg |
| تمر دقلة نور | الوزن | 500g, 1kg |
| عسل الزهور البرية | الحجم | 250g, 500g |
| علبة هدايا فاخرة | النوع (Type) | كلاسيك, بريميوم |
| معجون التمر الطبيعي | الحجم | 350g, 700g |

Each variation includes a price adjustment and stock value.

## Part 4: AI Product Image Generation

Create a new edge function `generate-product-images` that:

1. Takes a product name and description
2. Calls the Lovable AI Gateway (google/gemini-3-pro-image-preview) to generate a professional product photo
3. Uploads to the `products` storage bucket
4. Returns the public URL

Then invoke it for each of the 6 products with tailored prompts:
- Premium Medjool dates: "Luxury Medjool dates in a premium wooden box, warm lighting, editorial food photography, dark background"
- Sidr honey: "Natural golden Sidr honey in a glass jar with honeycomb, warm amber lighting, food photography"
- Deglet Noor dates: "Deglet Noor dates arranged elegantly on a plate, natural lighting, editorial style"
- Wild flower honey: "Wild flower honey in a rustic jar with wildflowers, natural soft lighting"
- Gift box: "Premium gift box with assorted dates and honey jars, red ribbon, luxury packaging photography"
- Date paste: "Natural date paste in a glass jar, dates around it, warm tones, food photography"

After generation, update each product's `images` array in the `products` table with the generated URLs.

## Part 5: Responsive Design

The ManualOrderDialog will be fully responsive:
- Desktop: `max-w-2xl` dialog with 2-column grid for customer fields
- Mobile: Full-width single column, `max-h-[90vh] overflow-y-auto`
- Product selection uses a scrollable list
- Order summary sticky at bottom on mobile

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/admin/ManualOrderDialog.tsx` | Create | Full manual order creation dialog |
| `src/pages/admin/AdminOrdersPage.tsx` | Modify | Add "Create Order" button + dialog integration |
| `supabase/functions/generate-product-images/index.ts` | Create | Batch AI image generation for products |
| Database | Insert | 58 wilayas with shipping rates |
| Database | Insert | Product variations for all 6 products |
| Database | Update | Product images after AI generation |

## Implementation Sequence

1. Seed wilayas table (needed for order creation to work)
2. Seed product variations
3. Create and deploy `generate-product-images` edge function
4. Generate and assign product images
5. Create `ManualOrderDialog.tsx` component
6. Update `AdminOrdersPage.tsx` with the create button and dialog
7. Test end-to-end

