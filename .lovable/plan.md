
# Manual Order Creation + Product Seeding with AI Images

## Overview
Add a "Create Order" button to the admin orders page with a full-featured dialog for manually creating orders. Also seed the database with wilayas, product variations, and generate AI product images.

## Step 1: Seed Wilayas Table
Insert all 58 Algerian wilayas with shipping rates into the `wilayas` table (currently empty). This is required for both the manual order dialog and the checkout flow.
- Office delivery: 400-900 DZD based on distance
- Home delivery: +200 DZD premium

## Step 2: Seed Product Variations
Add variations to the 6 existing products:
- Medjool dates: Weight (500g, 1kg, 2kg)
- Sidr honey: Size (250g, 500g, 1kg)
- Deglet Noor: Weight (500g, 1kg)
- Wild flower honey: Size (250g, 500g)
- Gift box: Type (Classic, Premium)
- Date paste: Size (350g, 700g)

## Step 3: AI Product Image Generation
Create an edge function `generate-product-images` that:
1. Calls Lovable AI (google/gemini-3-pro-image-preview) with tailored prompts for each product
2. Uploads the generated images to the `products` storage bucket
3. Updates each product's `images` array with the public URLs

Update `supabase/config.toml` to register the new function.

## Step 4: Create ManualOrderDialog Component
New file: `src/components/admin/ManualOrderDialog.tsx`

A responsive dialog with:

**Customer Section**
- Name (required), Phone (required, validated), Wilaya (searchable select from DB), Baladiya (filtered by wilaya using `algeria-wilayas.ts`), Delivery type (office/home radio), Address (shown for home), Payment method (COD/BaridiMob/Flexy)

**Product Selection Section**
- Searchable product list with images, prices, stock
- Variation/variant selection when applicable
- Quantity input, add/remove items

**Order Summary (live-calculated)**
- Subtotal, shipping (from wilaya rates + delivery type), coupon input with validation, discount, total

**Submit Logic**
- Insert into `orders` and `order_items` tables
- Deduct stock from `products`
- Show success toast with order number
- Refresh orders list

**Responsive**: 2-column grid on desktop, single column on mobile, `max-h-[90vh] overflow-y-auto`

## Step 5: Update AdminOrdersPage
Add a "Create Order" button (Plus icon) to the filter bar and integrate the `ManualOrderDialog` component.

## Technical Details

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/admin/ManualOrderDialog.tsx` | Manual order creation dialog |
| `supabase/functions/generate-product-images/index.ts` | AI image generation edge function |

### Files to Modify
| File | Change |
|------|--------|
| `src/pages/admin/AdminOrdersPage.tsx` | Add "Create Order" button + dialog |
| `supabase/config.toml` | Register new edge function |

### Database Operations
| Table | Operation |
|-------|-----------|
| `wilayas` | Insert 58 rows with shipping rates |
| `product_variations` | Insert ~14 variation rows |
| `products` | Update images array after AI generation |

### Implementation Sequence
1. Seed wilayas (dependency for order creation)
2. Seed product variations
3. Create + deploy image generation edge function
4. Generate and assign product images
5. Create ManualOrderDialog component
6. Update AdminOrdersPage with button + dialog
