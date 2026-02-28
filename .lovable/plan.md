

# Plan: Delivery Company Integration, Stock Limits & Payment Alerts

## 1. Delivery Companies Integration

### 1a. Database: `delivery_companies` table
Create a new table to store delivery company configurations:
- `id` (uuid, PK)
- `name` (text) -- company name
- `api_key` (text, nullable) -- API key for integration
- `api_url` (text, nullable) -- base URL for the company API
- `is_active` (boolean, default true)
- `is_builtin` (boolean, default false) -- for pre-seeded companies
- `logo_url` (text, nullable)
- `created_at` (timestamp)

Pre-seed famous Algerian delivery companies:
- **Yalidine** (yalidine.com)
- **ZR Express** (zrexpress.com)
- **Maystro Delivery** (maystro-delivery.com)
- **EcoTrack** (ecotrack.dz)
- **Procolis** (procolis.com)
- **GLS Algeria**
- **E-Com Delivery**

RLS: Admin-only management, no public access needed.

### 1b. Admin Settings Page: `/admin/settings/delivery`
Create `src/pages/admin/settings/AdminDeliveryPage.tsx`:
- List all delivery companies (built-in + custom)
- Toggle active/inactive for each
- Add custom delivery company (name, API key, API URL)
- Edit/delete custom companies
- Show connection status indicator

### 1c. Export Orders to Delivery Company
In `AdminOrdersPage.tsx`, add an "Export to Delivery" button:
- Appears in the bulk actions bar when orders are selected
- Opens a dialog to choose which active delivery company to export to
- Generates a CSV/Excel file with order data (name, phone, wilaya, address, total, COD amount) formatted for the selected company
- For companies with API integration (Yalidine, ZR Express, etc.), attempt to push orders via their API through an edge function
- Show success/failure feedback per order

### 1d. Edge Function: `delivery-export`
Create `supabase/functions/delivery-export/index.ts`:
- Accepts order IDs and delivery company ID
- Fetches order details from database
- Formats data according to the delivery company's API spec
- Pushes orders to the API (if API key is configured)
- Returns results (success/failed per order)

### 1e. Route & Navigation
- Add route `/admin/settings/delivery` in `App.tsx`
- Add "Delivery" entry in `SETTINGS_SUB_KEYS` in `AdminLayout.tsx`

---

## 2. Client Stock Limit (Cannot Give More Than Available)

In `AdminClientDetailPage.tsx`, modify `handleGiveProduct`:
- Before creating the transaction, check if `giveForm.quantity > (product.stock ?? 0)`
- If so, show an error toast: "Insufficient stock. Available: X" and block the action
- Also set `max` attribute on the quantity input to `selectedProduct?.stock ?? 0`
- Show available stock next to the quantity field

---

## 3. Payment Alerts on Dashboard

### 3a. Supplier Payment Alerts
In `AdminDashboardPage.tsx`, add an alert card:
- Query `supplier_transactions` to calculate supplier balances (received - given)
- Show suppliers with negative balance (you owe them money)
- Display as a warning card: "Suppliers you need to pay"

### 3b. Client Payment Alerts
In the same dashboard, add another alert card:
- Query `client_transactions` to calculate client balances
- Show clients with positive balance (they owe you money)
- Display as an info card: "Clients who need to pay you"

Both cards will link to the respective detail pages for quick action.

---

## Technical Details

### Files to Create
1. `src/pages/admin/settings/AdminDeliveryPage.tsx` -- Delivery companies management
2. `supabase/functions/delivery-export/index.ts` -- API export edge function

### Files to Modify
1. `src/pages/admin/AdminOrdersPage.tsx` -- Add "Export to Delivery" bulk action button
2. `src/pages/admin/AdminClientDetailPage.tsx` -- Add stock quantity validation
3. `src/pages/admin/AdminDashboardPage.tsx` -- Add supplier/client payment alert cards
4. `src/App.tsx` -- Add delivery settings route
5. `src/components/AdminLayout.tsx` -- Add delivery to settings nav
6. `src/i18n/locales/ar.ts` -- New translations
7. `src/i18n/locales/en.ts` -- New translations
8. `src/i18n/locales/fr.ts` -- New translations

### Database Migration
- Create `delivery_companies` table with RLS
- Insert built-in Algerian delivery companies as seed data

