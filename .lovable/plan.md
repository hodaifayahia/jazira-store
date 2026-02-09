

## Plan: Low Stock Alert + RTL Switch/Checkbox Fix

### 1. Low Stock Alert on Dashboard

The dashboard already has a low stock section at the bottom. This task will add a prominent alert banner at the top of the dashboard when there are products with stock of 5 or fewer units.

**Changes in `src/pages/admin/AdminDashboardPage.tsx`:**
- Import `Alert`, `AlertTitle`, `AlertDescription` from `@/components/ui/alert`.
- Add a visible alert banner at the very top of the dashboard (before the stats grid) when `lowStockProducts.length > 0`.
- The alert will show the count and list the product names with their remaining stock.
- Uses the `destructive` variant for visual urgency.

---

### 2. RTL Fix for Switch Component

The Switch component's thumb uses `translate-x-5` (moves right when checked) and `translate-x-0` (rests at left when unchecked). In RTL, this is reversed -- the thumb should move LEFT when checked.

**Changes in `src/components/ui/switch.tsx`:**
- Replace `data-[state=checked]:translate-x-5` with `data-[state=checked]:ltr:translate-x-5 data-[state=checked]:rtl:-translate-x-5`
- This ensures the thumb slides in the correct direction based on text direction.

This fix applies globally to all Switch usages across the site (Wilayas page, Products page, etc.).

---

### 3. RTL Fix for Checkbox Component

The Checkbox component itself is mostly fine (it's a simple square with a checkmark), but the check icon positioning can be slightly off in RTL. Review and ensure the indicator renders correctly.

After inspecting the Checkbox code, the checkbox itself (a square with a centered checkmark) does not have directional translation issues like the Switch. No changes needed for the Checkbox component specifically.

---

### Technical Summary

| File | Change |
|------|--------|
| `src/components/ui/switch.tsx` | Fix thumb translation direction for RTL using `ltr:` and `rtl:` Tailwind variants |
| `src/pages/admin/AdminDashboardPage.tsx` | Add prominent low-stock alert banner at top of dashboard |

### Note on Tailwind RTL support
Tailwind CSS v3+ supports `ltr:` and `rtl:` variants out of the box when `dir="rtl"` is set on the HTML element (which this project already has).
