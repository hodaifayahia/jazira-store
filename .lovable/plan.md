

## Plan: Remove COD + Enhance Order Form UI with Field-Level Validation

### Changes in `src/pages/SingleProductPage.tsx`

**1. Remove "الدفع عند التسليم" (COD) option**
- Delete lines 416-421 (the COD radio button label block)
- Remove any reference to `'cod'` as a payment method value

**2. Add field-level error state and inline validation messages**
- Add an `errors` state object: `Record<string, string>` tracking per-field errors
- Create a `validate()` function that checks each field and populates `errors`:
  - `orderName`: empty check -> "يرجى إدخال الاسم الكامل"
  - `orderPhone`: empty check + regex `/^0[567]\d{8}$/` -> "رقم الهاتف غير صالح (مثال: 05XXXXXXXX)"
  - `orderWilayaId`: empty check -> "يرجى اختيار الولاية"
  - `paymentMethod`: empty check -> "يرجى اختيار طريقة الدفع"
  - `receiptFile`: required when baridimob/flexy selected -> "يرجى إرفاق إيصال الدفع"
- Show red error text (`text-destructive text-xs`) below each field when its error is set
- Add red border highlight (`border-destructive`) on invalid fields
- Clear individual field errors on change (real-time feedback)
- `handleDirectOrder` calls `validate()` first; if errors exist, return early without toast (errors shown inline)

**3. Enhanced form UI/UX design**
- Add step-like numbered sections with icons for visual flow:
  - Step 1: User info (User icon) -- Name, Phone
  - Step 2: Delivery (MapPin icon) -- Wilaya, Address
  - Step 3: Payment (CreditCard icon) -- Payment method selection
- Each step gets a numbered circle badge + title for clarity
- Add subtle dividers between steps
- Improve spacing: `space-y-5` between steps, `space-y-3` within
- Add a green success-style accent on the order summary card
- Polish the submit button with a gradient background matching the primary color

### No other files affected. No database changes.

