

# Premium Supplier Management Module

## Overview

Build a full-featured Supplier Management module integrated into the existing admin panel, following the project's established patterns (RTL support, i18n, Supabase queries, AdminLayout, Cairo/Roboto fonts). The design will be elevated to a premium SaaS aesthetic with refined micro-interactions and data-rich layouts.

## Database Design

### New Tables

**`suppliers`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | default gen_random_uuid() |
| name | text | NOT NULL |
| category | text | nullable |
| contact_name | text | nullable |
| contact_phone | text | nullable |
| contact_email | text | nullable |
| notes | text | nullable |
| status | text | default 'active' (active/pending/inactive) |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

**`supplier_transactions`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | default gen_random_uuid() |
| supplier_id | uuid (FK -> suppliers) | NOT NULL |
| date | date | NOT NULL, default CURRENT_DATE |
| description | text | nullable |
| items_received | numeric | default 0 (value of goods received from supplier) |
| items_given | numeric | default 0 (value of goods/payments given to supplier) |
| transaction_type | text | default 'receipt' (receipt/payment/return/adjustment) |
| notes | text | nullable |
| document_url | text | nullable (uploaded bon de reception) |
| document_name | text | nullable |
| created_at | timestamptz | default now() |

RLS policies: Authenticated users with admin role can SELECT, INSERT, UPDATE, DELETE on both tables.

Enable realtime on `supplier_transactions` for live balance updates.

## File Changes

### 1. Database Migration
- Create `suppliers` and `supplier_transactions` tables
- Add RLS policies for admin access
- Add a database function `get_supplier_balance(supplier_uuid)` that returns total_received, total_given, balance

### 2. New Files

| File | Purpose |
|------|---------|
| `src/pages/admin/AdminSuppliersPage.tsx` | Main supplier directory with table/grid views, search, filters, KPI dashboard |
| `src/pages/admin/AdminSupplierDetailPage.tsx` | Per-supplier ledger, transaction history, document viewer |
| `src/components/admin/suppliers/SupplierDrawer.tsx` | Slide-in drawer for add/edit supplier |
| `src/components/admin/suppliers/TransactionForm.tsx` | Add/edit transaction with document upload |
| `src/components/admin/suppliers/SupplierKPICards.tsx` | 4 KPI stat cards with sparkline-style indicators |
| `src/components/admin/suppliers/SupplierCard.tsx` | Grid-view card for a single supplier |
| `src/components/admin/suppliers/DocumentViewer.tsx` | Fullscreen modal for viewing uploaded documents (zoom + download) |
| `src/components/admin/suppliers/BulkActions.tsx` | Floating toolbar for multi-select bulk operations |
| `src/components/admin/suppliers/CSVImportWizard.tsx` | 3-step guided CSV import modal |
| `src/hooks/useSuppliers.ts` | React Query hooks for suppliers CRUD |
| `src/hooks/useSupplierTransactions.ts` | React Query hooks for transactions CRUD |

### 3. Modified Files

| File | Change |
|------|--------|
| `src/App.tsx` | Add routes: `/admin/suppliers` and `/admin/suppliers/:id` |
| `src/components/AdminLayout.tsx` | Add "Suppliers" nav item with `Truck` icon |
| `src/i18n/locales/ar.ts` | Add ~60 supplier-related translation keys |
| `src/i18n/locales/en.ts` | Add ~60 supplier-related translation keys |
| `src/i18n/locales/fr.ts` | Add ~60 supplier-related translation keys |
| `src/index.css` | Add premium micro-interaction utilities (glassmorphism, hover-lift, glow-focus, pulse-dash, shake) |
| `tailwind.config.ts` | Add new keyframes for shake, pulse-border, check-pulse animations |

## Feature Breakdown

### Supplier Directory Page (`/admin/suppliers`)

**Top Section: KPI Dashboard**
- 4 cards: Total Suppliers / Total Balance Owed / Total Received This Month / Overdue count
- Each card has an icon, value, and subtle background gradient
- Skeleton loaders while data fetches

**View Toggle**
- Table view (default) and grid card view, toggled with icon buttons
- Persisted in localStorage

**Search + Filters**
- Live search input with magnifying glass icon
- Category filter chips (All, custom categories from data)
- Status filter dropdown

**Data Table (Table View)**
- Sticky header, full-width
- Columns: Checkbox | Supplier Name | Category | Contact | Total Received | Total Given | Balance | Status Badge | Actions
- Sortable by clicking column headers
- Hover effect: subtle left border accent + row highlight
- Empty state with illustrated placeholder

**Grid View**
- Card layout with supplier info, balance, status badge
- Hover lift animation on cards

**Add Supplier CTA**
- Opens a right-side slide-in drawer (Sheet component)
- Form: Name, Category, Contact Name, Phone, Email, Notes, Status
- Animated focus rings on inputs
- Save button with checkmark pulse on success

**Bulk Actions**
- Checkbox multi-select on table rows
- Floating action bar appears at bottom when items selected
- Actions: Delete (with shake + red confirmation), Export CSV, Update Status

### Supplier Detail Page (`/admin/suppliers/:id`)

**Header**
- Breadcrumb: Suppliers > Supplier Name
- Supplier info summary with status badge
- Edit button to open drawer

**Stat Cards**
- 3 summary cards: Total Received / Total Given / Outstanding Balance
- Color-coded (green for received, red for given, blue/amber for balance)

**Transaction Ledger**
- Full table with columns: Date | Description | Type | Items Received | Items Given | Running Balance | Document
- Running balance computed and displayed per row
- Each row expandable (accordion) to show notes and document thumbnail
- Filter by date range (date picker), transaction type, amount range

**Add Transaction**
- Button opens a dialog/drawer
- Fields: Date, Description, Type (receipt/payment/return/adjustment), Amount, Notes
- Drag-and-drop document upload zone with animated dashed border
- Supports PDF, JPG, PNG -- uploaded to Supabase storage bucket `supplier-documents`

**Document Viewer**
- Click on document thumbnail opens fullscreen modal
- Zoom controls, download button
- File metadata displayed

### CSV Import Wizard
- Step 1: Upload CSV file (drag-and-drop zone)
- Step 2: Map CSV columns to supplier fields
- Step 3: Preview and confirm
- Progress bar animation during import

## Design Details

### Premium Utilities (added to index.css)

```css
/* Glassmorphism for drawers/modals */
.glass { backdrop-filter: blur(12px); background: hsl(var(--card) / 0.85); }

/* Button hover lift */
.hover-lift { transition: transform 0.2s ease, box-shadow 0.2s ease; }
.hover-lift:hover { transform: translateY(-2px); box-shadow: 0 8px 25px -5px rgb(0 0 0 / 0.1); }

/* Animated focus ring */
.glow-focus:focus-within { box-shadow: 0 0 0 3px hsl(var(--ring) / 0.3); }

/* Table row accent border on hover */
.row-accent:hover { border-left: 3px solid hsl(var(--primary)); }
```

### Micro-Interactions (via tailwind keyframes)

- `check-pulse`: checkmark scale pulse for success feedback
- `shake`: horizontal shake for destructive action confirmation
- `pulse-dash`: animated dashed border for upload zones

### Color System
Uses the existing theme variables (primary green, secondary blue) plus semantic colors for supplier statuses:
- Active: `bg-green-500/10 text-green-700`
- Pending: `bg-yellow-500/10 text-yellow-700`
- Inactive: `bg-gray-500/10 text-gray-500`

### Typography
- Follows existing pattern: `font-cairo` for UI text, `font-roboto` for numbers/prices
- Large bold titles (text-2xl font-bold), medium subheadings, small body text

### Responsive
- Desktop: full table with all columns
- Tablet: horizontally scrollable table or card view auto-switch
- Mobile: card view default, drawer becomes full-screen sheet

### Accessibility
- All interactive elements have ARIA labels
- Keyboard navigation with visible focus indicators
- Tooltips on icon-only buttons
- High contrast text throughout

## Implementation Sequence

1. Database migration (tables + RLS + storage bucket)
2. i18n translation keys (ar, en, fr)
3. CSS utilities + tailwind keyframes
4. React Query hooks (useSuppliers, useSupplierTransactions)
5. Supplier components (KPI cards, drawer, card, document viewer, bulk actions)
6. AdminSuppliersPage (directory)
7. AdminSupplierDetailPage (ledger)
8. CSV Import Wizard
9. Route registration + sidebar nav item
10. Testing all interactions

