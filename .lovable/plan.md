
# Fix: Clear Variations When Selecting "Custom Option"

## Problem
When you select "خيار مخصص" (Custom Option) from the variation type dropdown, the values from the previously selected type remain visible. They should be cleared so you start fresh.

## Fix

### File: `src/pages/admin/AdminProductsPage.tsx` (lines 750-754)

In the `handleVariationTypeSelect` function, when `__custom__` is selected, also clear the `values` array and reset `displayType`:

**Before:**
```typescript
if (selectedType === '__custom__') {
  updateOptionGroup(gIdx, 'name', '');
  return;
}
```

**After:**
```typescript
if (selectedType === '__custom__') {
  const newGroups = optionGroups.map((g, i) =>
    i === gIdx ? { ...g, name: '', displayType: 'button', values: [] } : g
  );
  setOptionGroups(newGroups);
  regenerateVariants(newGroups);
  return;
}
```

This resets all three fields (name, displayType, values) and regenerates the variant matrix (which will be empty since there are no values).

### No other files affected.
