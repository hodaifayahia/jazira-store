

# Order Confirmers Management (Phase 1 -- MVP)

## Overview
Build a confirmer management page where admins can add, edit, and manage order confirmation agents (مؤكدين). Phase 1 focuses on the CRUD management of confirmers with type classification, pricing, search, and filtering -- matching the UI patterns already established in the Leads page.

## Scope (Phase 1 Only)
- Confirmer CRUD: add, edit, delete, deactivate
- Two types: Private (خاصين) and External (خارجيين)
- Per-confirmer pricing: confirmation price + cancellation price
- Search by name/phone, filter by type and status
- KPI counters: total, private, external, active
- No confirmer login/portal (future phase)
- No order assignment system (future phase)

## Database

### New Table: `confirmers`

```text
confirmers
  id                UUID PK (gen_random_uuid)
  name              TEXT NOT NULL
  phone             TEXT NOT NULL
  type              TEXT NOT NULL DEFAULT 'private'  -- 'private' or 'external'
  confirmation_price NUMERIC DEFAULT 0              -- DZD per confirmed order
  cancellation_price NUMERIC DEFAULT 0              -- DZD per cancelled order
  status            TEXT DEFAULT 'active'            -- 'active' or 'inactive'
  notes             TEXT nullable
  created_at        TIMESTAMPTZ DEFAULT now()
  updated_at        TIMESTAMPTZ DEFAULT now()
```

### RLS Policies
- Admin full access (ALL) using `has_role(auth.uid(), 'admin')`
- No public access needed -- confirmers are admin-managed only

## Admin Page: `/admin/confirmers`

### Header
- Title: "إدارة المؤكدين" with Users icon
- "إضافة مؤكد جديد" button

### KPI Cards (3 cards)
- كل المؤكدين (All Confirmers) -- total count
- مؤكدين خاصين (Private) -- count where type = 'private'
- مؤكدين خارجيين (External) -- count where type = 'external'

### Search and Filter
- Search input: "ابحث عن مؤكد..." (by name or phone)
- Type filter tabs: All / Private / External
- Status filter: All / Active / Inactive

### Table Columns (Desktop)
- المؤكد (Name)
- رقم الهاتف (Phone)
- النوع (Type) -- badge: private/external
- سعر التأكيد (Confirmation Price) -- DZD
- سعر الإلغاء (Cancellation Price) -- DZD
- الحالة (Status) -- active/inactive badge
- تاريخ الانضمام (Join Date)
- الإجراءات (Actions) -- edit, toggle status, delete

### Mobile Card Layout
Same pattern as the Leads page: card with name, phone, type badge, prices, and action buttons.

### Add/Edit Dialog
Fields:
- الاسم (Name) -- required
- رقم الهاتف (Phone) -- required
- النوع (Type) -- dropdown: خاص / خارجي
- سعر التأكيد (Confirmation Price) -- number input (DZD)
- سعر الإلغاء (Cancellation Price) -- number input (DZD)
- ملاحظات (Notes) -- optional textarea

### Delete Confirmation
Standard delete dialog with warning message.

### Status Toggle
Click to toggle active/inactive. Inactive confirmers are visually dimmed in the list.

## Technical Details

### Files to Create
- `src/pages/admin/AdminConfirmersPage.tsx` -- Full confirmer management page

### Files to Modify
- `src/App.tsx` -- Add route `/admin/confirmers`
- `src/components/AdminLayout.tsx` -- Add "إدارة المؤكدين" nav item with `Users` icon (or `UserCheck`), placed after "العملاء المحتملون"

### Database Migration
- Create `confirmers` table
- Enable RLS
- Add admin-only ALL policy

### Data Pattern
Follows the same query/mutation pattern as `AdminLeadsPage.tsx`:
- `useQuery` with key `['admin-confirmers']` to fetch all confirmers
- `useMutation` for create/update/delete with `invalidateQueries` on success
- Client-side search and filtering with `useMemo`

### No New Edge Functions
All operations use direct Supabase client calls since RLS handles authorization (admin-only).

