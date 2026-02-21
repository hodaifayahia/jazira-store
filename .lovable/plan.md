

# Bulk Product Management (Per Supplier)

## Overview

Add a Products/Stock tab to the Supplier Detail Page (`/admin/suppliers/:id`) that enables managing products linked to a specific supplier -- with inline multi-row entry, bulk actions, CSV import/export, and smart stock indicators.

## Database Changes

### New Table: `supplier_products`

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid (PK) | gen_random_uuid() | |
| supplier_id | uuid (FK -> suppliers) | NOT NULL | |
| product_name | text | NOT NULL | |
| reference_sku | text | nullable | Reference / SKU code |
| unit | text | 'pcs' | kg, pcs, box, etc. |
| quantity_received | numeric | 0 | |
| quantity_returned | numeric | 0 | Given back / returned |
| remaining_stock | numeric | GENERATED (received - returned) | Stored generated column |
| unit_price | numeric | 0 | |
| total_price | numeric | GENERATED (unit_price * quantity_received) | Stored generated column |
| date | date | CURRENT_DATE | |
| notes | text | nullable | |
| document_url | text | nullable | Bon de Reception file |
| document_name | text | nullable | |
| low_stock_threshold | integer | 5 | User-configurable per product |
| category | text | nullable | Optional category grouping |
| created_at | timestamptz | now() | |

- RLS: Admin-only (same pattern as `suppliers` and `supplier_transactions`)
- Enable realtime for live updates

## Implementation Steps

### Step 1: Database Migration
- Create `supplier_products` table with generated columns for `remaining_stock` and `total_price`
- Add RLS policy using `has_role(auth.uid(), 'admin')` for ALL operations
- Enable realtime

### Step 2: i18n Translation Keys (~40 new keys)
Add to `ar.ts`, `en.ts`, `fr.ts`:
- Product management labels (product name, SKU, unit, qty received, qty returned, remaining stock, unit price, total price, low stock threshold)
- Bulk action labels (bulk delete, bulk export, bulk edit, import products, download template)
- Stock status labels (in stock, low stock, out of stock)
- Summary bar labels (total products, total stock value, low stock alerts, last updated)
- CSV import wizard step labels

### Step 3: React Query Hook
**New file: `src/hooks/useSupplierProducts.ts`**
- `useSupplierProducts(supplierId)` -- fetch all products for a supplier
- `useCreateSupplierProducts()` -- bulk insert multiple product rows at once
- `useUpdateSupplierProduct()` -- update single product
- `useBulkUpdateSupplierProducts()` -- update multiple products (dates, category, quantities)
- `useDeleteSupplierProducts()` -- bulk delete by array of IDs
- `uploadSupplierProductDocument(file)` -- upload to `supplier-documents` bucket

### Step 4: Supplier Products Tab Component
**New file: `src/components/admin/suppliers/SupplierProductsTab.tsx`**

This is the main component added as a new tab on the Supplier Detail Page.

**Product Summary Bar (top)**
- 4 stat cards: Total Products | Total Stock Value | Low Stock Alerts | Last Updated
- Uses the same `hover-lift` and premium card styling

**Search, Filter, Sort Controls**
- Search by product name or SKU (live filtering)
- Filter by: stock status (all/in-stock/low/out), category, date range
- Sort by: date, quantity, price, remaining stock

**Product Table**
- Columns: Checkbox | Product Name | SKU | Unit | Qty Received | Qty Returned | Remaining | Unit Price | Total | Date | Stock Badge | Doc | Actions
- Stock badges:
  - Green "In Stock" when remaining > threshold
  - Yellow "Low Stock" when remaining <= threshold and > 0
  - Red "Out of Stock" when remaining = 0
- Each row has edit/delete action buttons
- Row hover uses existing `row-accent` CSS class
- Document icon opens the existing `DocumentViewer` component

### Step 5: Inline Multi-Row Form
**New file: `src/components/admin/suppliers/ProductBulkEntryForm.tsx`**

- Opens in a slide-in drawer (Sheet) when clicking "Add Products"
- Starts with one empty row; user clicks "+ Add Row" to append more
- Each row: Product Name, SKU, Unit (select), Qty Received, Qty Returned, Unit Price, Date, Notes, Upload icon
- Remaining Stock and Total Price shown as auto-calculated read-only fields
- "Save All" button saves all rows in a single batch insert
- Cancel clears and closes

### Step 6: Bulk Actions Toolbar
**New file: `src/components/admin/suppliers/ProductBulkActions.tsx`**

- Floating bar appears at the bottom when rows are selected via checkboxes
- Actions:
  - Bulk Delete: confirmation modal with shake animation, then deletes
  - Bulk Export CSV: generates CSV from selected rows and downloads
  - Bulk Edit: opens a small modal to set date/category for all selected
  - Bulk Update Stock: enables inline editing of qty fields on selected rows

### Step 7: CSV Import Wizard
**New file: `src/components/admin/suppliers/ProductCSVImportWizard.tsx`**

- 3-step dialog:
  1. Upload: drag-and-drop zone (reusing existing `upload-zone` CSS), accepts .csv files
  2. Map Columns: visual mapping of CSV headers to app fields via dropdowns
  3. Preview and Confirm: table preview, errors highlighted in red
- "Download Template" button generates a pre-filled CSV with correct headers
- Progress bar during import

### Step 8: Integrate into Supplier Detail Page

Modify `src/pages/admin/AdminSupplierDetailPage.tsx`:
- Add a Tabs component (from existing `@/components/ui/tabs`) with two tabs:
  - "Transactions" (existing ledger content)
  - "Products / Stock" (new `SupplierProductsTab`)
- Keep all existing transaction logic intact

## Files Summary

| File | Action |
|------|--------|
| Database migration | New `supplier_products` table + RLS |
| `src/i18n/locales/ar.ts` | Add ~40 translation keys |
| `src/i18n/locales/en.ts` | Add ~40 translation keys |
| `src/i18n/locales/fr.ts` | Add ~40 translation keys |
| `src/hooks/useSupplierProducts.ts` | New -- CRUD hooks |
| `src/components/admin/suppliers/SupplierProductsTab.tsx` | New -- main tab component |
| `src/components/admin/suppliers/ProductBulkEntryForm.tsx` | New -- multi-row inline form |
| `src/components/admin/suppliers/ProductBulkActions.tsx` | New -- floating bulk toolbar |
| `src/components/admin/suppliers/ProductCSVImportWizard.tsx` | New -- 3-step import wizard |
| `src/pages/admin/AdminSupplierDetailPage.tsx` | Modified -- add Tabs with Products tab |

## Design Notes

- Follows the existing premium SaaS aesthetic (glassmorphism, hover-lift, glow-focus, row-accent)
- Stock badges use the same pill-shaped badge pattern: green/yellow/red with `/10` opacity backgrounds
- Auto-calculated fields (remaining stock, total price) update in real-time as user types
- All destructive actions use confirmation dialogs with the existing `AlertDialog` component
- Skeleton loaders for all loading states
- Empty state with illustrated placeholder when no products exist
- Toast notifications for all CRUD actions
- Fully RTL-compatible using existing `dir` from `useTranslation`
- Reuses `DocumentViewer` component for viewing uploaded documents

