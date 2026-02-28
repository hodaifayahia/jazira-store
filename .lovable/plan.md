
# Plan: Confirmer Dashboard & Comprehensive Testing Fixes

## Problem
When a confirmer logs in, they are redirected to the admin dashboard which requires the "admin" role -- so they see nothing or get kicked out. Confirmers need their own restricted view showing only orders.

## Solution

### 1. Create Confirmer Layout (`src/components/ConfirmerLayout.tsx`)
- Similar to AdminLayout but checks for `confirmer` role instead of `admin`
- Simplified sidebar with only: Dashboard (orders list) and Logout
- Same header style but without admin-only features (settings, products, etc.)
- Reuses existing notification system for new orders

### 2. Create Confirmer Dashboard Page (`src/pages/confirmer/ConfirmerDashboardPage.tsx`)
- Shows only orders in a table/list format
- Confirmer can view order details, update order status (confirm/cancel)
- Filters: new orders, confirmed, cancelled
- KPI cards: total orders assigned, confirmed today, cancelled today
- No access to products, settings, suppliers, clients, etc.

### 3. Update Login Flow (`src/pages/admin/AdminLoginPage.tsx`)
- After successful login, check user role:
  - If `admin` role: redirect to `/admin`
  - If `confirmer` role: redirect to `/confirmer`
  - If neither: show "no access" error

### 4. Add Confirmer Routes (`src/App.tsx`)
- `/confirmer` -- ConfirmerLayout wrapping ConfirmerDashboardPage
- Login page remains at `/admin/login` (shared between admin and confirmer)

### 5. Update RLS / Database
- No new tables needed -- confirmers already have `confirmer` role in `user_roles`
- The `has_role` function already supports checking for any `app_role`
- Need to verify `app_role` enum includes `confirmer` -- if not, add it via migration
- Orders table already has public SELECT policy, so confirmers can read orders

---

## Technical Details

### Files to Create
1. `src/components/ConfirmerLayout.tsx` -- Layout with confirmer role check and minimal sidebar
2. `src/pages/confirmer/ConfirmerDashboardPage.tsx` -- Orders-only dashboard for confirmers

### Files to Modify
1. `src/pages/admin/AdminLoginPage.tsx` -- Role-based redirect after login
2. `src/App.tsx` -- Add confirmer routes
3. `src/i18n/locales/ar.ts` -- Add confirmer translations
4. `src/i18n/locales/en.ts` -- Add confirmer translations
5. `src/i18n/locales/fr.ts` -- Add confirmer translations

### Database Migration
- Check if `app_role` enum includes `confirmer`; if not, run `ALTER TYPE app_role ADD VALUE 'confirmer'`
- The `manage-confirmer` edge function already inserts `role: 'confirmer'` into `user_roles`, so the enum value must exist or the insert would fail -- this confirms it likely already exists

### Confirmer Dashboard Features
- Order list with search by order number, customer name, phone
- Status filters (New, Confirmed, Cancelled, All)
- Quick action buttons to change order status
- Today's stats cards (new, confirmed, cancelled counts)
- No access to any other admin pages
