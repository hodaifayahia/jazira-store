

## Checkout Page Enhancements

The checkout page at `/checkout` already exists with most core functionality. This plan covers the gaps between the current implementation and your requirements.

### Changes (all in `src/pages/CheckoutPage.tsx`)

**1. Inline Form Validation**
- Add error state variables for each field (nameError, phoneError, wilayaError, paymentError)
- Show red error text below each field when validation fails
- Validate name minimum 3 characters with message "الاسم يجب أن يكون 3 أحرف على الأقل"
- Validate phone with regex, show "رقم الهاتف غير صحيح" inline
- Clear errors on field change

**2. Remove Coupon Button**
- Add an "x" button next to the discount line in the order summary
- Clicking it resets discount to 0, couponApplied to false, and clears couponCode

**3. File Upload Improvements**
- Validate file size (max 5MB) on selection, show error toast if exceeded
- Restrict accepted file types to `.jpg,.png,.pdf` for baridimob and `.jpg,.png` for flexy
- Show a file preview after upload: image thumbnail for images, filename for PDFs

**4. Flexy Step-by-Step Instructions**
- Add numbered Arabic instructions below the flexy details explaining how to send a Flexy recharge

**5. Minor UI Polish**
- Change shipping display from "—" to "اختر الولاية" when no wilaya selected
- Update copy toast to "تم النسخ ✅"
- Add a Loader2 spinner icon to the submit button during submission

### Technical Details

- Only `src/pages/CheckoutPage.tsx` is modified
- No changes to CartContext, App.tsx, or any other pages
- Import `Loader2` and `X` from lucide-react for spinner and remove button icons
- All validation is client-side with inline Arabic error messages
- File preview uses `URL.createObjectURL` for image files
