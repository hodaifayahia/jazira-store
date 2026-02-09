

## Checkout Flow Enhancements

### 1. "Direct Order" (طلب مباشرة) Feature

**How it works:**

- Add a `checkoutIntent` state to `CartContext` to store a temporary direct-order session
- New type: `{ type: 'direct', items: CartItem[] }` or `{ type: 'cart' }` (default)
- Add "طلب مباشرة" button on `SingleProductPage` and `ProductCard`
- When clicked: set the checkout intent with the selected product/quantity, then navigate to `/checkout`
- `CheckoutPage` reads from `checkoutIntent` -- if present, uses those items; otherwise uses full cart
- On order completion: clear the intent, and remove ordered items from the cart if they exist
- On leaving checkout without ordering: add the direct-order items to the cart (so user can find them later), then clear the intent

**Files changed:**
- `src/contexts/CartContext.tsx` -- add `checkoutIntent`, `setCheckoutIntent`, `removeItems` methods
- `src/pages/SingleProductPage.tsx` -- add "طلب مباشرة" button
- `src/components/ProductCard.tsx` -- add "طلب مباشرة" button
- `src/pages/CheckoutPage.tsx` -- read from intent or cart, handle cleanup

### 2. Shipping Per Product

**Formula:** Total shipping = wilaya base price x total number of items in the order (extra per additional item = 0 DA).

**Implementation:**
- Create a helper function in `src/lib/shipping.ts`:

```text
calculateShipping(items, wilayaShippingPrice):
  totalQty = sum of all item quantities
  return wilayaShippingPrice * totalQty
```

- This single function is the only place to change the formula later
- Update `CheckoutPage` to use this function instead of flat `selectedWilaya.shipping_price`
- In the order summary, show a note: "سعر التوصيل يحسب على كل منتج على حدة"
- Optionally show per-item shipping breakdown
- The `shipping_cost` stored in the orders table = total calculated shipping

**Files changed:**
- `src/lib/shipping.ts` (new) -- shipping calculation helper
- `src/pages/CheckoutPage.tsx` -- use new shipping calculation, update summary UI

### 3. Real Payment Details

Update the settings in the database to use real values:
- `ccp_number` = "002670098836"
- `flexy_number` = "0657761559"

The checkout page already reads these from the settings table dynamically, so no code changes needed for display -- just a database update. The copy buttons already exist on both payment methods.

**Action:** Update the 2 settings values in the database via SQL.

### 4. Files Modified (Summary)

| File | Changes |
|------|---------|
| `src/contexts/CartContext.tsx` | Add checkoutIntent state, setCheckoutIntent, removeItems, ensureInCart |
| `src/lib/shipping.ts` | New file -- shipping calculation helper |
| `src/pages/CheckoutPage.tsx` | Use checkout intent, per-product shipping, cleanup logic |
| `src/pages/SingleProductPage.tsx` | Add "طلب مباشرة" button |
| `src/components/ProductCard.tsx` | Add "طلب مباشرة" button |
| Database (settings table) | Update ccp_number and flexy_number values |

No changes to: database schema, admin pages, cart page, products page, routing, or auth.

