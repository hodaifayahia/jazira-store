

# Plan: Sticky Columns in Costs Table, Delivery in Sidebar, and Push Orders Button

## 1. Sticky First Columns in Costs Table (Product Name + Selling Price)

**File**: `src/pages/admin/AdminCostsPage.tsx`

Make the first two columns (Product Name and Selling Price) sticky during horizontal scrolling on mobile:
- Add `sticky left-0 z-10 bg-white` (or `bg-muted/30` for header) to the first two `<th>` and `<td>` elements
- The product name column gets `sticky left-0` and the selling price column gets `sticky left-[calculated-width]`
- This ensures these key columns stay visible while scrolling through cost/margin data

## 2. Add Delivery Companies as a Direct Sidebar Item

**File**: `src/components/AdminLayout.tsx`

Currently, the delivery page is buried under Settings > Delivery. The user wants it as a top-level sidebar item:
- Add `{ href: '/admin/delivery', key: 'delivery.title', icon: Truck }` to `NAV_KEYS` array (after suppliers or orders)

**File**: `src/App.tsx`
- Add route: `/admin/delivery` pointing to `AdminDeliveryPage`

## 3. Add "Push All Orders to Delivery" Button on Orders Page

**File**: `src/pages/admin/AdminOrdersPage.tsx`

Add a prominent button at the top of the orders page (not just in bulk selection bar) that:
- Shows a "Push to Delivery" button next to the "Create Order" button
- Opens the delivery company selection dialog
- Exports ALL filtered orders (not just selected) to the chosen delivery company via the existing `delivery-export` edge function
- Uses the same `handleExportToDelivery` logic already in the page

This will add a top-level button so users don't need to manually select orders first.

---

## Technical Summary

| File | Change |
|------|--------|
| `src/pages/admin/AdminCostsPage.tsx` | Add `sticky left-0` to product name and selling price columns in both `thead` and `tbody` |
| `src/components/AdminLayout.tsx` | Add delivery to `NAV_KEYS` sidebar array |
| `src/App.tsx` | Add `/admin/delivery` route |
| `src/pages/admin/AdminOrdersPage.tsx` | Add top-level "Push to Delivery" button that exports all filtered orders |

No database changes needed.

