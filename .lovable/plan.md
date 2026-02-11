

# Phase 2: Enhanced Confirmer Management System

## Overview
Upgrade the existing basic confirmer CRUD page into a tabbed interface with proper authentication (email/password login for confirmers), a dual payment model (per-order vs monthly salary), and a confirmation settings tab. This builds on the existing `confirmers` table and follows the `manage-admin` edge function pattern for account creation.

## What Changes

### 1. Database Migration -- Alter `confirmers` table + Add `confirmation_settings`

**Alter `confirmers`** to add:
- `email` (TEXT, nullable) -- login credential for the confirmer
- `user_id` (UUID, nullable) -- linked to auth.users for login
- `payment_mode` (TEXT, DEFAULT 'per_order') -- either 'per_order' or 'monthly'
- `monthly_salary` (NUMERIC, DEFAULT 0) -- used when payment_mode = 'monthly'

**Create `confirmation_settings`** table (single row, global config):
- `id` (UUID, PK)
- `assignment_mode` (TEXT, DEFAULT 'manual') -- manual / round_robin / load_balanced
- `auto_timeout_minutes` (INTEGER, DEFAULT 30)
- `max_call_attempts` (INTEGER, DEFAULT 3)
- `enable_confirm_chat` (BOOLEAN, DEFAULT false)
- `working_hours_start` (TEXT, DEFAULT '08:00')
- `working_hours_end` (TEXT, DEFAULT '20:00')
- `created_at`, `updated_at` (TIMESTAMPTZ)

RLS: Admin-only ALL policy on `confirmation_settings`.

Also add 'confirmer' to the `app_role` enum so confirmers can have their own role in `user_roles`.

### 2. Edge Function -- `manage-confirmer`

A new edge function (modeled after `manage-admin`) that:
- **Action: "create"** -- Creates a Supabase Auth user with email/password, assigns the 'confirmer' role in `user_roles`, and updates the `confirmers` row with `user_id` and `email`.
- **Action: "deactivate"** -- Removes the confirmer's active sessions.
- Requires admin authentication (same pattern as `manage-admin`).

### 3. Restructured Admin Page -- 3 Tabs

Restructure `AdminConfirmersPage.tsx` into a tabbed layout:

**Tab 1: "إضافة مؤكد جديد" (Add New Confirmer)**
- Form with sections:
  - **معلومات المؤكد (Confirmer Info):**
    - الاسم الكامل (Full Name) -- required
    - الإيمايل (Email) -- required, for login
    - كلمة السر (Password) -- required, min 8 chars
    - رقم الهاتف (Phone) -- optional
    - النوع (Type) -- dropdown: خاص / خارجي
  - **نظام محاسبة المؤكد (Payment System):**
    - طريقة المحاسبة (Payment Method) -- radio/dropdown:
      - "دفع حسب الطلبات" (Per Order) -- shows confirmation_price + cancellation_price fields
      - "دفع شهري" (Monthly Salary) -- shows monthly_salary field
  - Buttons: إلغاء (Cancel) / إضافة (Add)
- On submit: calls `manage-confirmer` edge function to create auth account, then inserts into `confirmers` table.

**Tab 2: "فريق المؤكدين" (Confirmer Team)**
- The existing table/list view (KPI cards, search, filters, table) -- moved here as-is with minor enhancements:
  - Add "طريقة الدفع" (Payment Method) column showing per_order or monthly badge
  - Edit dialog updated with payment_mode and monthly_salary fields
  - Status toggle and delete remain the same

**Tab 3: "إعدادات التأكيد" (Confirmation Settings)**
- Form to manage `confirmation_settings`:
  - طريقة التوزيع (Assignment Mode) -- dropdown: يدوي / دوري / حسب الحمل
  - مهلة التأكيد (Timeout Minutes) -- number input
  - محاولات الاتصال القصوى (Max Call Attempts) -- number input
  - تفعيل التأكيد التلقائي (Enable Confirm Chat) -- toggle switch
  - ساعات العمل (Working Hours) -- start/end time inputs
- Uses upsert to save (single row pattern)

### 4. Files to Create
- `supabase/functions/manage-confirmer/index.ts` -- Edge function for confirmer account lifecycle

### 5. Files to Modify
- `src/pages/admin/AdminConfirmersPage.tsx` -- Complete restructure into 3 tabs
- Database migration (new SQL)

### 6. Files NOT Modified
- `src/App.tsx` -- Route already exists at `/admin/confirmers`
- `src/components/AdminLayout.tsx` -- Nav item already exists

## Technical Notes

- **No multi-tenant (store_id)**: The current project has no `stores` table. All data is single-tenant. Skipping store_id scoping.
- **Password handling**: Passwords are managed entirely through Supabase Auth. The edge function creates the auth account; the frontend never stores passwords.
- **Confirmer login page**: NOT included in this phase. Confirmers will use a separate login page and dashboard in a future phase. This phase only creates their accounts.
- **The `app_role` enum** needs 'confirmer' added via `ALTER TYPE app_role ADD VALUE 'confirmer'`.
- **Payment mode conditional rendering**: When "per_order" is selected, show price fields and hide salary. When "monthly" is selected, show salary and hide price fields.

## What This Does NOT Include (Future Phases)
- Confirmer login page and dashboard
- Order assignment system (queue, auto-assign)
- Call logging and tracking
- Earnings ledger and payroll
- Performance analytics
- Real-time WebSocket notifications
- Confirmer-scoped RLS policies

