

## Fix: Admin Pages Not Displaying Data

### What's Actually Happening

After investigating, the RLS policies are now correctly set to PERMISSIVE and the backend is connected. The real issues are:

1. **Coupons page bug**: The query orders by `created_at` column which does NOT exist on the `coupons` table. This causes a silent database error, making the page appear broken.

2. **Products and orders tables are empty**: These tables have zero rows, so the pages correctly show "no data" messages. This is expected behavior -- you need to add products via the admin panel.

3. **Settings and categories work**: The `settings` table has 10 rows and categories are stored there.

### Fix Required

| File | Change |
|------|--------|
| `src/pages/admin/AdminCouponsPage.tsx` | Remove `.order('created_at' as any, ...)` since the coupons table has no `created_at` column. Order by `code` instead. |

### What Will Work After the Fix

- **Coupons page**: Will load correctly and allow adding/editing/deleting coupons
- **Products page**: Already works -- shows "no products yet" because the table is empty. You can add products using the "add product" button.
- **Categories page**: Already works -- reads/writes from settings table
- **Settings page**: Already works -- all payment and store settings load and save
- **Dashboard**: Already works -- shows stats (all zeros because no orders yet)

### Next Steps After Fix

Once the coupons query is fixed, you can start adding data through the admin panel:
1. Add categories (if not already done)
2. Add products with images
3. Test the storefront to verify products appear
4. Create test coupons

