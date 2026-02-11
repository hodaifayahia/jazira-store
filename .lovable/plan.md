

# Seed All Tables with Fake Test Data

## Overview
Insert comprehensive fake data across all empty tables to populate the entire admin dashboard for testing. The data will include realistic Algerian names, phone numbers, and Arabic content.

## Data Insertion Order (respecting foreign keys)

Since RLS policies restrict inserts to admin users, and we don't have an admin session from the migration tool, we'll use a database migration with raw SQL to bypass RLS. The migration will insert data in the correct dependency order.

## Seed Data Summary

### 1. Settings (store configuration)
- Store name, logo URL, currency, announcements, categories, and other global settings (~15 rows)

### 2. Products (10 products)
- Mix of clothing, electronics, accessories, and home goods
- Arabic names and descriptions
- Varying prices (500 - 15,000 DZD), stock levels, categories
- Some with `has_variants = true`

### 3. Product Variants (for 3 products with variants)
- Size/color combinations with different prices and stock
- ~12 variant rows

### 4. Product Costs (for all 10 products)
- Realistic purchase costs (40-60% of selling price)
- Packaging costs (30-100 DZD)
- Some with storage and other costs

### 5. Coupons (3 coupons)
- Percentage and fixed discount types
- Active and expired examples

### 6. Confirmers (3 confirmers)
- Mix of per_order and monthly payment modes
- Arabic names, Algerian phone numbers (05xx, 06xx, 07xx)

### 7. Orders (25 orders)
- Various statuses: جديد, مؤكد, قيد التوصيل, تم التوصيل, ملغي, مرتجع
- Spread across different wilayas
- Different delivery types (office/home)
- Dates spread over the last 30 days

### 8. Order Items (40+ items across the 25 orders)
- 1-3 items per order
- Linked to real product IDs and prices

### 9. Leads (8 leads)
- Various statuses and sources
- Algerian names and phone numbers

### 10. Reviews (15 reviews)
- Ratings 1-5, Arabic comments
- Linked to products

### 11. Abandoned Orders (5 abandoned carts)
- With cart_items JSON, customer info

### 12. Return Requests (4 returns)
- Against delivered orders
- Various statuses: requested, approved, completed, rejected
- Linked to return_reasons

### 13. Return Items (linked to return requests)
- Specific products being returned with quantities

### 14. Return Status History (audit trail for returns)
- Status transitions for each return request

### 15. Product Offers (bundle deals for 2 products)
- "Buy 2 get discount" type offers

## Technical Approach

A single SQL migration file that:
1. Uses `DO $$ ... $$` block with variables for generated UUIDs
2. Inserts in FK-dependency order
3. The `order_number` trigger fires automatically (we pass empty string)
4. The `return_number` trigger fires automatically
5. Uses `gen_random_uuid()` inline for IDs, storing them in variables for FK references
6. Dates spread across the last 30 days using `now() - interval 'X days'`

## Files
- One new database migration file (SQL) -- no code changes needed

## What You'll See After Seeding
- Products page populated with 10 products
- Orders page with 25 orders in various statuses
- Costs page showing margins for all products
- Returns page with 4 return requests
- Leads page with 8 leads
- Abandoned orders page with 5 carts
- Settings populated with store configuration
