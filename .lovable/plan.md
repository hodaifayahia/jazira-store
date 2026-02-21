
# Fix Supplier Modals/Dialogs Responsiveness

## Problem
All supplier-related modals, sheets, and dialogs break on small screens (mobile/tablet). Issues include fixed widths, grid layouts that don't stack, overflow problems, and the floating bulk actions bar getting cut off.

## Changes

### 1. SupplierDrawer.tsx (Sheet)
- Phone/email grid: change `grid-cols-2` to `grid-cols-1 sm:grid-cols-2` so fields stack on mobile

### 2. TransactionForm.tsx (Dialog)
- Date/type grid: change `grid-cols-2` to `grid-cols-1 sm:grid-cols-2` so fields stack on mobile
- Add `max-h-[90vh] overflow-y-auto` to DialogContent for small viewports

### 3. ProductBulkEntryForm.tsx (Sheet)
- Each product row's grids (`grid-cols-2`, `grid-cols-3`): change to `grid-cols-1 sm:grid-cols-2` and `grid-cols-1 sm:grid-cols-3` respectively
- The sheet already has `sm:max-w-2xl` which is fine; ensure full width on mobile via existing `w-full`

### 4. ProductCSVImportWizard.tsx (Dialog)
- Change `max-w-2xl` to `w-[95vw] sm:max-w-2xl` so it doesn't overflow on mobile
- Step 2 mapping rows: change `flex items-center gap-3` layout to stack vertically on mobile -- use `flex flex-col sm:flex-row` and make the select full width on mobile
- Add `max-h-[85vh]` to ensure it fits small screens

### 5. ProductBulkActions.tsx (Floating toolbar)
- The fixed bottom bar with `start-1/2 -translate-x-1/2`: make it full-width on mobile with `start-4 end-4 translate-x-0 sm:start-1/2 sm:end-auto sm:-translate-x-1/2`
- Wrap buttons with `flex-wrap` so they don't overflow
- Use smaller text/buttons on mobile

### 6. DocumentViewer.tsx (Dialog)
- Change `max-w-4xl h-[85vh]` to `w-[95vw] sm:max-w-4xl h-[80vh] sm:h-[85vh]` for mobile fit
- Toolbar buttons: ensure they wrap on small screens

### 7. SupplierProductsTab.tsx (Main tab content)
- Controls row: already uses `flex-wrap` which is good
- Table: already has `overflow-x-auto` which is good
- Summary cards: already use `grid-cols-2 sm:grid-cols-4` which is good

### 8. AdminSupplierDetailPage.tsx
- Stat cards: already `grid-cols-1 sm:grid-cols-3` which is fine
- Transaction table: already has `overflow-x-auto`

## Technical Details

All changes are CSS-only (Tailwind classes). No logic, routing, or data changes. The key patterns applied:
- Replace fixed `grid-cols-N` with responsive `grid-cols-1 sm:grid-cols-N`
- Add viewport-relative max dimensions (`max-h-[90vh]`, `w-[95vw]`)  
- Make floating elements full-width on mobile with edge insets instead of centered positioning
- Add `flex-wrap` and `overflow-y-auto` where content can overflow

Files to modify: 6 component files in `src/components/admin/suppliers/`
