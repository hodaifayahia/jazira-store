

# Improve Variations Page: Dropdown for Type + Quick Add per Group

## Problem
1. When adding a variation, the "Type" field is a free-text input with a datalist hint -- it should be a proper **dropdown** to select from existing types (with an option to create a new type).
2. Each variation type group (e.g., "اللون", "المقاس") should have an **"Add" button** in its header to quickly add a new value under that type.

## Changes

### File: `src/pages/admin/AdminVariationsPage.tsx`

#### 1. Add button in each group header (line 168-172)
Add a `Plus` button next to the type name and badge. Clicking it opens the create dialog with `formType` pre-filled to that group's type.

```
[Palette icon] اللون  (3)  [+ إضافة]
```

A new function `openCreateForType(type: string)` will:
- Set `formType` to the given type
- Clear `formValue` and reset other fields
- Open the dialog

#### 2. Replace the datalist input with a proper Select dropdown (lines 213-218)
Replace the `Input + datalist` for the type field with a `Select` component:
- Lists all existing types from `existingTypes`
- Has a final option "نوع جديد..." (New type) that shows a text input for custom entry
- When opened from a group header button, the dropdown is pre-set and disabled (since the type is already chosen)

A new state `isCustomType` (boolean) will control whether to show the dropdown or a free-text input.

### No database changes needed.

