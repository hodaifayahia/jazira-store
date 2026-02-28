

# Fix Responsive Tables on Costs, Returns, and Supplier Pages

## Problem
The tables on the Costs and Returns pages use `w-full` on the `<table>` element, which causes columns to compress and overlap on mobile instead of triggering horizontal scroll. The `overflow-x-auto` wrapper is present but the table shrinks to fit rather than maintaining a usable minimum width.

## Solution
Add `min-w-[800px]` (or similar) to the `<table>` elements so they maintain their column widths on mobile, and the `overflow-x-auto` parent container enables horizontal scrolling.

## Changes

### 1. `src/pages/admin/AdminCostsPage.tsx` (line 145)
- Change `<table className="w-full text-sm">` to `<table className="w-full text-sm min-w-[800px]">`
- This ensures the 8-column table scrolls horizontally on narrow screens

### 2. `src/pages/admin/AdminReturnsPage.tsx` (line 192)
- Change `<table className="w-full text-sm">` to `<table className="w-full text-sm min-w-[700px]">`
- The returns table already hides some columns on mobile (`hidden md:table-cell`), but still needs a min-width for the visible columns

### 3. `src/pages/admin/AdminSuppliersPage.tsx`
- Check if supplier list uses a table or cards -- if table, apply same `min-w` fix

### 4. `src/components/admin/suppliers/SupplierProductsTab.tsx`
- Apply `min-w-[700px]` to the products table inside the supplier detail page

These are minimal CSS-only changes (adding one class per table) that fix the horizontal scroll behavior without restructuring any components.
