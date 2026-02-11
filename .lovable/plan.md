

# Product Return & Exchange Management (RMA) -- Phase 1

## Overview
Build the foundation of a Return/Exchange management system for the Algerian COD e-commerce platform. Phase 1 covers database schema, return settings configuration, return reasons management, and the admin return list/detail views with basic approve/reject workflow.

This is scoped as an incremental build. Future phases will add the customer-facing return portal, pickup scheduling, inspection workflow, store credit system, and analytics.

## Important Scope Decisions
- **Single-tenant**: This project has no `stores` table. All `store_id` columns from the spec are omitted.
- **No customer portal yet**: Phase 1 is admin-only. Customers will request returns via a public page in Phase 2.
- **No carrier integration**: Pickup scheduling is manual (text fields) in Phase 1.
- **No store credit system yet**: Deferred to Phase 3.
- **No financial processing**: Refund amounts are recorded but no wallet debit in Phase 1.
- **Photos stored in Supabase Storage**: Using the existing `products` bucket pattern, a new `returns` bucket will be created.

## Database Migration

### Table 1: `return_settings` (single row, global config)
```text
id                    UUID PK (gen_random_uuid)
return_window_days    INTEGER DEFAULT 7
allow_refund          BOOLEAN DEFAULT true
allow_exchange        BOOLEAN DEFAULT true
allow_store_credit    BOOLEAN DEFAULT true
auto_approve_returns  BOOLEAN DEFAULT false
require_return_photos BOOLEAN DEFAULT true
max_photos_per_return INTEGER DEFAULT 5
return_policy_text    TEXT nullable
is_returns_enabled    BOOLEAN DEFAULT true
created_at            TIMESTAMPTZ DEFAULT now()
updated_at            TIMESTAMPTZ DEFAULT now()
```
RLS: Admin-only ALL policy. Public SELECT policy (needed for customer portal later).

### Table 2: `return_reasons` (configurable list)
```text
id                UUID PK (gen_random_uuid)
label_ar          TEXT NOT NULL
fault_type        TEXT NOT NULL DEFAULT 'customer_fault'  -- 'merchant_fault' or 'customer_fault'
requires_photos   BOOLEAN DEFAULT true
is_active         BOOLEAN DEFAULT true
position          INTEGER DEFAULT 0
created_at        TIMESTAMPTZ DEFAULT now()
```
RLS: Admin ALL + public SELECT.

### Table 3: `return_requests`
```text
id                    UUID PK (gen_random_uuid)
order_id              UUID NOT NULL (FK orders.id)
return_number         TEXT NOT NULL UNIQUE
customer_name         TEXT NOT NULL
customer_phone        TEXT NOT NULL
resolution_type       TEXT NOT NULL  -- 'refund', 'exchange', 'store_credit'
status                TEXT DEFAULT 'requested'
                      -- requested, approved, rejected, pickup_scheduled,
                      -- in_transit, received, inspected, completed, cancelled, disputed
reason_id             UUID (FK return_reasons.id)
reason_notes          TEXT nullable
merchant_notes        TEXT nullable
rejection_reason      TEXT nullable
total_refund_amount   NUMERIC DEFAULT 0
return_shipping_cost  NUMERIC DEFAULT 0
shipping_paid_by      TEXT DEFAULT 'customer'  -- 'merchant' or 'customer'
net_refund_amount     NUMERIC DEFAULT 0
refund_method         TEXT nullable  -- 'baridimob', 'ccp', 'cash', 'store_credit'
refund_reference      TEXT nullable
refunded_at           TIMESTAMPTZ nullable
pickup_tracking_number TEXT nullable
pickup_scheduled_at   TIMESTAMPTZ nullable
item_received_at      TIMESTAMPTZ nullable
requested_at          TIMESTAMPTZ DEFAULT now()
approved_at           TIMESTAMPTZ nullable
completed_at          TIMESTAMPTZ nullable
created_at            TIMESTAMPTZ DEFAULT now()
updated_at            TIMESTAMPTZ DEFAULT now()
```
RLS: Admin ALL + public INSERT (for future customer portal) + public SELECT.

### Table 4: `return_items`
```text
id                  UUID PK (gen_random_uuid)
return_request_id   UUID NOT NULL (FK return_requests.id ON DELETE CASCADE)
order_item_id       UUID NOT NULL (FK order_items.id)
product_id          UUID NOT NULL (FK products.id)
variant_id          UUID nullable (FK product_variants.id)
product_name        TEXT NOT NULL
variant_label       TEXT nullable
quantity_ordered    INTEGER NOT NULL
quantity_returned   INTEGER NOT NULL
unit_price          NUMERIC NOT NULL
item_total          NUMERIC NOT NULL
item_condition      TEXT nullable  -- set during inspection
restock_decision    TEXT nullable  -- 'restock', 'write_off'
restocked           BOOLEAN DEFAULT false
exchange_product_id UUID nullable (FK products.id)
exchange_product_name TEXT nullable
exchange_unit_price NUMERIC nullable
price_difference    NUMERIC nullable
created_at          TIMESTAMPTZ DEFAULT now()
```
RLS: Admin ALL + public SELECT.

### Table 5: `return_photos`
```text
id                UUID PK (gen_random_uuid)
return_request_id UUID NOT NULL (FK return_requests.id ON DELETE CASCADE)
return_item_id    UUID nullable (FK return_items.id)
url               TEXT NOT NULL
caption           TEXT nullable
uploaded_by       TEXT DEFAULT 'customer'  -- 'customer' or 'merchant'
created_at        TIMESTAMPTZ DEFAULT now()
```
RLS: Admin ALL + public INSERT + public SELECT.

### Table 6: `return_status_history`
```text
id                UUID PK (gen_random_uuid)
return_request_id UUID NOT NULL (FK return_requests.id ON DELETE CASCADE)
from_status       TEXT nullable
to_status         TEXT NOT NULL
changed_by        UUID nullable
change_reason     TEXT nullable
created_at        TIMESTAMPTZ DEFAULT now()
```
RLS: Admin ALL + public SELECT.

### Storage Bucket
- Create `returns` bucket (public) for return proof photos.

### Database Function
- `generate_return_number()`: Trigger on `return_requests` INSERT that generates `RET-YYYYMMDD-NNN` format.

## Admin UI

### 1. Return Settings (new tab in AdminSettingsPage)

Add a 5th tab "الاسترجاع" (Returns) to the existing settings page with:
- Return window days (number input)
- Toggle switches: allow refund, allow exchange, allow store credit
- Auto-approve toggle
- Require photos toggle
- Max photos per return (number input)
- Return policy text (textarea)
- Enable/disable returns master toggle

### 2. Return Reasons Manager (within settings tab)

Below the settings form, a list of return reasons:
- Add reason: label (Arabic), fault type (merchant/customer), requires photos
- Edit/delete existing reasons
- Reorder by position
- Seed default reasons on first load:
  - "منتج معيب / تالف" (merchant_fault)
  - "منتج خاطئ" (merchant_fault)
  - "لا يطابق الوصف" (merchant_fault)
  - "مقاس خاطئ" (merchant_fault)
  - "غير راضٍ عن المنتج" (customer_fault)
  - "أخرى" (customer_fault)

### 3. Admin Returns Page (`/admin/returns`)

New page with:

**KPI Cards:**
- Total returns count
- Pending review (status = 'requested')
- In progress (approved through inspected)
- Completed count

**Table:**
| Return # | Order # | Customer | Reason | Type | Amount | Status | Date | Actions |

**Filters:** status, resolution type, date range, search by return/order number or phone.

**Detail Dialog (or inline expand):**
- Return info: items, quantities, reason, notes, photos gallery
- Action buttons based on status:
  - Requested: [Approve] [Reject] (reject requires reason text)
  - Approved: [Mark as Received] + tracking number input
  - Received: [Mark Completed] (simplified -- no inspection step in Phase 1)
- Status history timeline at bottom
- Financial summary: item total, shipping, net refund

### 4. Create Return (Admin-initiated)

A dialog/form where admin can create a return on behalf of a customer:
- Select order (by order number or search)
- Select items to return with quantities
- Choose resolution type
- Choose reason
- Add notes
- This creates the return_request + return_items records

## Navigation

Add to `AdminLayout.tsx` NAV_ITEMS:
```text
{ href: '/admin/returns', label: 'الاسترجاع', icon: RotateCcw }
```
Placed after "الطلبات" (Orders).

## Files to Create
- `src/pages/admin/AdminReturnsPage.tsx` -- Return list + detail + create return

## Files to Modify
- `src/App.tsx` -- Add `/admin/returns` route
- `src/components/AdminLayout.tsx` -- Add nav item
- `src/pages/admin/AdminSettingsPage.tsx` -- Add returns settings tab (5th tab)

## Data Patterns
- Same `useQuery`/`useMutation` pattern as existing admin pages
- Return requests query joins with `return_reasons`, `return_items`, `orders`
- Client-side search and filtering with `useMemo`
- Status transitions are simple updates with status history logging

## What Phase 1 Does NOT Include
- Customer-facing return portal (Phase 2)
- Pickup scheduling with carrier APIs (Phase 2)
- Item inspection workflow with condition grading (Phase 3)
- Store credit system (Phase 3)
- Exchange order creation (Phase 3)
- Inventory restock on return completion (Phase 3)
- Return analytics dashboard (Phase 4)
- Anti-fraud detection rules (Phase 4)
- SMS/WhatsApp notifications (Phase 4)

