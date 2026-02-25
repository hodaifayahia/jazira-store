

# Plan: Fix Coupon, Add Coupon to Product Page, Supplier-Product Sync, and Transaction Improvements

## 1. Fix 100% Coupon Code Issue

**Problem**: When a percentage coupon is set to 100%, the discount equals the full subtotal, which can cause the total to become 0 or negative when shipping is factored in incorrectly, or the discount isn't properly capped.

**Fix**:
- In `src/pages/CheckoutPage.tsx` (line ~250-253): Cap the percentage discount so it never exceeds `eligibleSubtotal`. Add `Math.round()` for clean values.
- In `src/components/admin/ManualOrderDialog.tsx` (line ~106-111): Same cap logic.
- In `src/pages/SingleProductPage.tsx`: Will be addressed in item #2.

## 2. Add Coupon Code Input to SingleProductPage

**Problem**: The inline order form on the product page has no coupon code field.

**Changes in `src/pages/SingleProductPage.tsx`**:
- Add state variables: `couponCode`, `couponApplied`, `discount`, `couponLoading`
- Add an `applyCoupon` function (similar to CheckoutPage) that validates the coupon, checks product eligibility, and calculates the discount
- Add a coupon input UI section between the payment step and order summary (a text input + apply button with Tag icon)
- Update `orderTotal` calculation to subtract the discount
- Include `coupon_code` and `discount_amount` in the order insert payload

## 3. Auto-Create Product in Products Table When Adding Supplier Product

**Problem**: When a product is added via the supplier products tab, it should also be created in the main `products` table as inactive (`is_active: false`) so the admin can later complete the listing.

**Changes in `src/hooks/useSupplierProducts.ts`**:
- In `useCreateSupplierProducts` mutation, after inserting into `supplier_products`, also insert into the `products` table with:
  - `name`: from `product_name`
  - `price`: from `unit_price`
  - `sku`: from `reference_sku`
  - `stock`: from `quantity_received - quantity_returned`
  - `is_active`: `false`
  - `category`: `['general']` (default)
  - `product_type`: `'physical'`

## 4. Remove "Quantity Returned" Field from Supplier Product Entry

**Problem**: The user does not need the "مرتجع" (quantity returned) field in the supplier product bulk entry form.

**Changes**:
- `src/components/admin/suppliers/ProductBulkEntryForm.tsx`: Remove the `quantity_returned` input field. Set it to 0 by default. Update remaining stock calculation to just use `quantity_received`.
- `src/components/admin/suppliers/ProductCSVImportWizard.tsx`: Remove `quantity_returned` from `APP_FIELDS`.
- `src/components/admin/suppliers/SupplierProductsTab.tsx`: Remove the "Qty Returned" column from the table header and rows. Remove it from the inline edit fields.

## 5. Improve Transaction Form (Best Practices)

**Changes in `src/components/admin/suppliers/TransactionForm.tsx`**:
- Add proper form validation with error messages (required fields highlighted)
- Add a description field that auto-suggests based on transaction type
- Separate "items_received" and "items_given" into explicit labeled fields instead of a single "amount" that flips based on type
- Add a running balance preview showing current balance and projected balance after the transaction
- Reset form properly after successful save
- Add confirmation for large amounts
- Improve the transaction type labels and add icons for clarity

### Technical Details

**Files to modify**:
1. `src/pages/CheckoutPage.tsx` - Cap discount at subtotal for 100% coupons
2. `src/pages/SingleProductPage.tsx` - Add coupon code section to inline order form
3. `src/components/admin/ManualOrderDialog.tsx` - Cap discount at subtotal
4. `src/hooks/useSupplierProducts.ts` - Auto-create inactive product in products table
5. `src/components/admin/suppliers/ProductBulkEntryForm.tsx` - Remove quantity_returned field
6. `src/components/admin/suppliers/ProductCSVImportWizard.tsx` - Remove quantity_returned from fields
7. `src/components/admin/suppliers/SupplierProductsTab.tsx` - Remove quantity_returned column
8. `src/components/admin/suppliers/TransactionForm.tsx` - Improve with best practices

**No database changes needed** - all existing tables support the required functionality.

