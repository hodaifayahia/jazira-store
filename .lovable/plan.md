

## Single Product Page Improvements

The page at `/product/:id` already exists with most functionality. Here are the specific changes needed to fully match your requirements:

### Changes to `src/pages/SingleProductPage.tsx`

1. **Fix data fetching**: Replace `.single()` with `.maybeSingle()` to gracefully handle missing products instead of throwing an error.

2. **Add back link**: Add a "العودة إلى المنتجات" link with an arrow icon at the top of the page (above the breadcrumb).

3. **Update toast message**: Change the success toast to show "تمت الإضافة إلى السلة" with a checkmark emoji.

4. **Improve 404 state**: Add a link back to `/products` in the "product not found" message so users can navigate back easily.

5. **Fix add-to-cart logic**: Currently calls `addItem` in a loop (once per quantity). Will simplify to pass the full quantity properly via the cart context.

### Technical Details

- Only `src/pages/SingleProductPage.tsx` will be modified
- No changes to the cart context, home page, products page, or any other files
- All existing features (image gallery with thumbnails, quantity selector, category badge, stock indicator, loading skeleton, breadcrumb) are preserved

