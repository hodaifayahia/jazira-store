

## Plan: Wilaya Order Statistics + Phone Validation

### 1. Wilaya Order Statistics (`AdminWilayasPage.tsx`)

When clicking a wilaya row, show a dialog/expandable section with order statistics for that wilaya:

- Total orders count
- Orders grouped by status (e.g., "جديد": 5, "مؤكد": 3, "ملغي": 1)
- Total revenue from that wilaya

**Implementation:**
- Add a `selectedWilaya` state and a stats dialog
- When a wilaya row is clicked, query `orders` table filtered by `wilaya_id`
- Display stats in a dialog with:
  - Total order count
  - Status breakdown (badges with counts)
  - Total revenue (sum of `total_amount`)

### 2. Phone Number Validation (Checkout + anywhere phone is entered)

**In `CheckoutPage.tsx`:**
- The phone validation regex already exists at line 125: `/^0[567]\d{8}$/` -- this correctly validates 10-digit numbers starting with 05, 06, or 07
- Add real-time visual feedback: show error message below the phone input when it doesn't match the pattern (not just on submit)
- Update placeholder to be clearer: "05/06/07XXXXXXXX"

### 3. Required Field Validation (Checkout)

Add inline error states for:
- **Name**: show error if empty when user tries to submit or blurs the field
- **Wilaya**: show error if not selected
- Add red border + error text for each required field

### Technical Details

**Files to modify:**

| File | Changes |
|------|---------|
| `src/pages/admin/AdminWilayasPage.tsx` | Add click handler on wilaya rows, stats dialog with order query |
| `src/pages/CheckoutPage.tsx` | Add inline validation errors for name, phone (05/06/07 + 10 digits), and wilaya |

**AdminWilayasPage changes:**
- Add `statsWilaya` state to track which wilaya's stats are being viewed
- Add a `useQuery` that fetches orders for the selected wilaya (`orders` table, filtered by `wilaya_id`)
- Show a dialog with:
  - Wilaya name as title
  - Total orders count
  - Status breakdown in a simple table or badge list
  - Total revenue

**CheckoutPage validation changes:**
- Add `errors` state object tracking touched/invalid fields
- On blur of name input: set error if empty
- On blur/change of phone input: validate against `/^0[567]\d{8}$/`
- On wilaya select: clear wilaya error
- Show red border (`border-destructive`) and error text below each invalid field
- The submit handler already validates these -- just adding real-time feedback

