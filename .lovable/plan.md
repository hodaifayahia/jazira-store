

# Abandoned Orders System (Phase 1)

## Overview
Implement an abandoned cart capture and recovery system. When a customer fills out the checkout form but leaves without confirming, their data is automatically saved. Admins can view, contact, and convert these abandoned carts into real orders.

## How It Works

1. **Capture**: As the customer types their name and phone on the checkout page, after a short delay (5 seconds of inactivity), the system silently saves their info + cart contents to the database
2. **Deduplication**: If the same phone number abandons again, the existing record is updated (not duplicated)
3. **Auto-resolve**: When an order is successfully confirmed, any matching abandoned cart (same phone) is automatically marked as "recovered"
4. **Admin Dashboard**: A new page at `/admin/abandoned` shows all abandoned carts with KPI cards, search, filtering, and action buttons

## Database

A new `abandoned_orders` table:
- `id`, `customer_name`, `customer_phone`, `customer_wilaya` (text), `cart_items` (JSONB snapshot of products), `cart_total` (numeric), `item_count` (integer)
- `status`: 'abandoned' | 'contacted' | 'recovered' | 'lost' (default: 'abandoned')
- `recovered_order_id` (uuid, nullable, references orders)
- `notes` (text, nullable) -- admin notes for follow-up
- `abandoned_at` (timestamptz, default now)
- `created_at`, `updated_at`

RLS: Public insert (anyone can create from checkout), admin-only for read/update/delete.

## Changes

### 1. Checkout Page (`CheckoutPage.tsx`)
- Add a `useEffect` with a 5-second debounce that fires when `name` and `phone` are both filled
- On trigger: upsert into `abandoned_orders` matching by `customer_phone`
- Cart items are snapshotted as JSONB: `[{ product_id, name, price, quantity, image, variant_info }]`
- On successful order submission: update matching abandoned record to status='recovered' with `recovered_order_id`

### 2. New Admin Page (`src/pages/admin/AdminAbandonedPage.tsx`)
- **KPI Cards** (3 cards at top):
  - Total abandoned carts (count where status='abandoned')
  - Contacted (count where status='contacted')
  - Total abandoned value (sum of cart_total where status='abandoned')
- **Search**: By phone number or customer name
- **Filter**: By status (all / abandoned / contacted / recovered / lost)
- **Table columns**: Customer name, Phone, Products (expandable), Cart value, Status, Date, Actions
- **Actions per row**:
  - "Call" button (tel: link to phone number)
  - "Convert to Order" button (pre-fills checkout with the abandoned cart data and navigates admin, or creates order directly)
  - Status dropdown (change to contacted/lost)
  - "Add Note" (inline text input)
  - "Delete" (with confirmation)
- **Mobile cards view** for responsive layout (same pattern as Leads page)
- **Product details**: Expandable row showing what products were in the cart with images and quantities

### 3. Navigation
- Add "السلات المتروكة" (Abandoned Carts) link in `AdminLayout.tsx` sidebar, using `ShoppingCart` icon with a different style, placed after "الطلبات"
- Add route `/admin/abandoned` in `App.tsx`

### 4. Convert to Order Flow
When admin clicks "Convert to Order":
1. Open a confirmation dialog showing cart contents and customer info
2. Admin confirms -- system creates a real order in `orders` table with the snapshotted data
3. Creates `order_items` from the cart snapshot
4. Updates abandoned record: status='recovered', recovered_order_id set
5. Shows success toast with link to the new order

## Technical Details

### Files to Create
- `src/pages/admin/AdminAbandonedPage.tsx` -- The full abandoned orders admin page

### Files to Modify
- `src/pages/CheckoutPage.tsx` -- Add debounced abandoned cart capture + auto-resolve on order confirm
- `src/App.tsx` -- Add route for `/admin/abandoned`
- `src/components/AdminLayout.tsx` -- Add sidebar nav item

### Cart Items JSONB Structure
```json
[
  {
    "product_id": "uuid",
    "name": "T-Shirt Sport",
    "price": 1500,
    "quantity": 2,
    "image": "https://...",
    "variant_id": "uuid-or-null",
    "variant_label": "أحمر / XL"
  }
]
```

### Debounce Logic in Checkout
- Trigger conditions: `name.length >= 2` AND `phone.length >= 10` AND cart has items
- Debounce: 5 seconds after last keystroke in name/phone fields
- Uses `setTimeout` with cleanup in `useEffect`
- Only upserts if no order has been submitted yet (check `submitting` state)

### Auto-resolve Logic
- After successful order insert in `handleSubmit`, run:
  ```
  UPDATE abandoned_orders SET status='recovered', recovered_order_id=order.id
  WHERE customer_phone = phone AND status IN ('abandoned','contacted')
  ```

### Validation for Convert to Order
- Re-check product availability (stock) before creating the order
- If any product is out of stock, show warning and let admin decide
- Use current product prices (not snapshot prices) with option to use original prices

