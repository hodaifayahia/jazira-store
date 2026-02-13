

# Live Form Preview in Form Settings Tab

## What Changes
Add a real-time checkout form preview panel next to the field configuration toggles. As the admin toggles fields visible/hidden and required/optional, the preview updates instantly to show exactly how the checkout form will look to customers.

## Layout
The Form Settings tab will be split into two columns on desktop:
- **Right column**: The existing toggles table (field controls)
- **Left column**: A live mockup of the checkout form showing only the visible fields, with required fields marked with an asterisk (*)

On mobile, the preview will appear below the toggles.

## Preview Details
The preview will be a read-only visual mockup styled like the real checkout form, containing:
- Full Name input (if visible)
- Phone input (always shown, locked)
- Wilaya dropdown (if visible)
- Baladiya dropdown (if visible)
- Delivery type selector (if visible, shown as two cards: office/home)
- Address textarea (if visible)
- Coupon code input (if visible)
- Payment receipt upload area (if visible)

Each visible field will show a "*" if it is marked as required. Hidden fields will not appear in the preview. The preview panel will have a "معاينة النموذج" (Form Preview) header and a subtle border/background to distinguish it from the controls.

---

## Technical Details

### File Modified
- `src/components/admin/FormSettingsTab.tsx`

### Changes
1. Add a `FormPreview` component inside the file that takes the current `CheckoutFormConfig` and renders a styled read-only mockup of each visible field
2. Update the main layout from a single column to a two-column grid (`grid md:grid-cols-2`):
   - Right: existing toggles card
   - Left: new preview card with `FormPreview`
3. The preview uses disabled inputs/selects with placeholder text to simulate the real form appearance
4. Fields hidden in config are not rendered in the preview
5. Required fields show an asterisk next to their label
6. The preview updates reactively since it reads directly from the parsed `config` object which changes on every toggle
