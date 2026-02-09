

## Plan: Limit Coupons to Specific Products

### Overview
Add the ability to restrict a coupon so it only applies to selected products. When creating or editing a coupon, the admin can optionally pick specific products. If products are selected, the coupon discount only applies to those products in the cart (not the full subtotal).

---

### 1. Database: New Junction Table

Create a `coupon_products` table to link coupons to specific products (many-to-many):

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| coupon_id | uuid | FK to coupons.id (ON DELETE CASCADE) |
| product_id | uuid | FK to products.id (ON DELETE CASCADE) |

RLS policies:
- Public SELECT (same as coupons -- needed at checkout to validate)
- Admin ALL (same pattern as other admin tables)

---

### 2. Admin Coupons Page (`AdminCouponsPage.tsx`)

- Fetch the products list to display as selectable options.
- Add a multi-select section in the coupon dialog where admin can pick products. If none are selected, the coupon applies to all products (current behavior).
- When saving, insert/delete rows in `coupon_products` to match the selection.
- Show a "products limited" badge in the coupons table when a coupon has product restrictions.
- When editing, pre-load the selected products from `coupon_products`.

---

### 3. Checkout Page (`CheckoutPage.tsx`)

- When applying a coupon, also fetch its linked products from `coupon_products`.
- If the coupon has linked products, calculate the discount only on cart items that match those product IDs (not the full subtotal).
- If no linked products exist, apply to full subtotal (current behavior).

---

### Technical Details

**Database migration:**
```sql
CREATE TABLE public.coupon_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  UNIQUE(coupon_id, product_id)
);

ALTER TABLE public.coupon_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coupon products publicly readable"
  ON public.coupon_products FOR SELECT USING (true);

CREATE POLICY "Admin can manage coupon products"
  ON public.coupon_products FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

**AdminCouponsPage.tsx changes:**
- Add a `useQuery` to fetch all products (id, name).
- Add `selectedProductIds: string[]` to form state.
- Render a scrollable checkbox list of products inside the dialog.
- On save: after upserting the coupon, delete existing `coupon_products` for that coupon, then insert new rows for selected product IDs.
- In the table, show product count badge per coupon.

**CheckoutPage.tsx changes:**
- In `applyCoupon()`, after fetching the coupon, also query `coupon_products` for that coupon ID.
- If results exist, sum only the matching cart items' subtotal and apply the discount to that sum instead of the full subtotal.

