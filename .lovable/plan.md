

## Fix: RLS Policies Blocking All Access

### Root Cause

Every RLS policy on `products`, `coupons`, `settings`, `wilayas`, `orders`, and `order_items` is created as **RESTRICTIVE** (using `AS RESTRICTIVE`). PostgreSQL requires at least one **PERMISSIVE** policy to grant initial access. Restrictive policies can only further narrow that access. Since there are no permissive policies, all queries return empty results for everyone -- including admins.

### Solution

Drop all existing RESTRICTIVE policies on these tables and recreate them as PERMISSIVE (the default). No code changes are needed -- the frontend code is correct and already wired to the backend. Only the database policies need fixing.

### Database Migration

A single migration will:

1. Drop all existing restrictive policies on these 6 tables:
   - `products`, `coupons`, `settings`, `wilayas`, `orders`, `order_items`

2. Recreate them as PERMISSIVE with the same logic:

| Table | Policy | Command | Rule |
|-------|--------|---------|------|
| products | Public can read | SELECT | `true` |
| products | Admin can manage | ALL | `has_role(auth.uid(), 'admin')` |
| coupons | Public can read | SELECT | `true` |
| coupons | Admin can manage | ALL | `has_role(auth.uid(), 'admin')` |
| settings | Public can read | SELECT | `true` |
| settings | Admin can manage | ALL | `has_role(auth.uid(), 'admin')` |
| wilayas | Public can read | SELECT | `true` |
| wilayas | Admin can manage | ALL | `has_role(auth.uid(), 'admin')` |
| orders | Public can read | SELECT | `true` |
| orders | Anyone can insert | INSERT | `true` (with check) |
| orders | Admin can update | UPDATE | `has_role(auth.uid(), 'admin')` |
| orders | Admin can delete | DELETE | `has_role(auth.uid(), 'admin')` |
| order_items | Public can read | SELECT | `true` |
| order_items | Anyone can insert | INSERT | `true` (with check) |
| order_items | Admin can manage | ALL | `has_role(auth.uid(), 'admin')` |
| user_roles | User reads own | SELECT | `auth.uid() = user_id` |

Also add a unique constraint on `settings.key` (needed for the upsert `ON CONFLICT` used in the settings page).

### Files Changed

| File | Change |
|------|--------|
| Database migration only | Drop restrictive policies, recreate as permissive, add unique constraint on `settings.key` |

No frontend code changes needed.

### What This Fixes

- Admin products page will load and display products
- Admin coupons page will load and allow CRUD
- Admin categories page will load and save (reads/writes `settings` table)
- Admin settings page will load and save all payment/store settings
- Public storefront will also be able to read products, settings, and wilayas

