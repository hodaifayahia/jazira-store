
# Plan: Fix Sidebar Scroll & Add Client/Reseller Management

## 1. Fix Sidebar Scroll Position on Navigation

**Problem**: When you scroll down in the sidebar and click a link (e.g., "View Products" or a product), the sidebar stays scrolled down instead of scrolling back to the top.

**Fix**: In `src/components/AdminLayout.tsx`, add a `useEffect` that watches `location.pathname` and scrolls the sidebar `<nav>` element to the top whenever the route changes. This requires adding a `ref` to the `<nav>` element.

## 2. Add Client/Reseller Management Module

**Concept**: Clients are resellers who receive products from you to sell on your behalf. They owe you money for the products they sell. This is a consignment model:
- You give a client X units of a product
- They sell some, keep some, return some
- They pay you back for what they sold

### Database Tables

**Table: `clients`**
- `id` (uuid, PK)
- `name` (text, required)
- `phone` (text)
- `address` (text)
- `wilaya` (text)
- `notes` (text)
- `status` (text, default 'active') -- active / inactive
- `created_at`, `updated_at`

**Table: `client_transactions`**
- `id` (uuid, PK)
- `client_id` (uuid, FK to clients)
- `transaction_type` (text) -- 'product_given' | 'product_returned' | 'payment_received'
- `product_id` (uuid, nullable) -- for product_given / product_returned
- `product_name` (text, nullable) -- stored for reference
- `quantity` (integer, default 0) -- for product transactions
- `unit_price` (numeric, default 0) -- price per unit
- `amount` (numeric, default 0) -- total amount (qty x price, or payment amount)
- `date` (date, default CURRENT_DATE)
- `notes` (text)
- `created_at` (timestamp)

Both tables with RLS: admin-only management.

### Admin Pages & Components

1. **`src/pages/admin/AdminClientsPage.tsx`** -- Main listing page with:
   - KPI cards: total clients, total owed, collected this month
   - Client cards/table with search and status filter
   - Add/edit client dialog

2. **`src/pages/admin/AdminClientDetailPage.tsx`** -- Detail page for a single client:
   - Client info header with balance summary
   - Two tabs: "Product Handoffs" and "Payments"
   - Forms to: give products, record returned products, record payments
   - Transaction history table
   - Running balance display

3. **`src/hooks/useClients.ts`** -- CRUD hooks for clients
4. **`src/hooks/useClientTransactions.ts`** -- CRUD hooks for client_transactions

### Sidebar & Routes

- Add "العملاء" (Clients) entry in the sidebar nav in `AdminLayout.tsx` with `Users` icon
- Add routes in `App.tsx`: `/admin/clients` and `/admin/clients/:id`

### i18n

- Add Arabic translations for all client-related strings in `ar.ts`, `fr.ts`, `en.ts`

### Business Logic

- **Balance calculation**: Sum of (product_given amounts) minus sum of (payment_received + product_returned amounts) = amount owed by client
- **Give products**: Select product from products table, enter quantity and unit price. Deducts from main product stock.
- **Record payment**: Enter amount received from client
- **Record return**: Select product, enter quantity returned. Adds back to main product stock.

## Files to Create
- `src/pages/admin/AdminClientsPage.tsx`
- `src/pages/admin/AdminClientDetailPage.tsx`
- `src/hooks/useClients.ts`
- `src/hooks/useClientTransactions.ts`

## Files to Modify
- `src/components/AdminLayout.tsx` -- scroll fix + add clients nav item
- `src/App.tsx` -- add client routes
- `src/i18n/locales/ar.ts` -- add client translations
- `src/i18n/locales/fr.ts` -- add client translations
- `src/i18n/locales/en.ts` -- add client translations

## Database Migration
- Create `clients` and `client_transactions` tables with RLS policies (admin-only)
