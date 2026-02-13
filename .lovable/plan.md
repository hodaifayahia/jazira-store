

# Categories Dropdown on Hover

## Overview
Replace the always-visible categories bar (Row 2) with a hover-triggered dropdown. A "Categories" button will be added to the main nav bar, and hovering over it reveals a dropdown panel showing all categories.

## New Behavior

```text
BEFORE:
[Main Nav Bar]
[Categories Bar - always visible]

AFTER:
[Main Nav Bar with "التصنيفات" button]
   └── Hover → dropdown panel with category grid appears
```

## Design Details

### Desktop
- Add a "التصنيفات" (Categories) nav item with a chevron-down icon in the main nav links
- On hover, a dropdown panel slides down below it with a subtle shadow and border
- The dropdown shows categories in a clean grid (icon + name for each)
- Dropdown disappears when the mouse leaves the area (with a small delay to prevent flicker)

### Mobile
- Keep the categories as horizontal scrollable pills inside the mobile menu (unchanged -- this is already good UX for touch)

## Technical Changes

### `src/components/Navbar.tsx`
- Remove the entire Row 2 categories bar (lines 134-171)
- Add a "التصنيفات" button in the desktop nav links area with `onMouseEnter`/`onMouseLeave` handlers
- Add a dropdown `div` (absolutely positioned below the nav) that shows/hides based on hover state
- Use a small timeout (~150ms) on mouse leave to prevent flicker when moving between trigger and dropdown
- Import `ChevronDown` from lucide-react
- Categories dropdown will display items in a responsive grid (3-4 columns) with icon + name, each linking to `/products?category=...`
