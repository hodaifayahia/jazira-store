

# Redesign Navbar with Categories Bar

## Overview
Upgrade the homepage header with a modern two-row design: the main navigation bar on top, and a categories strip below it. This creates a cleaner, more professional e-commerce experience and gives customers quick access to product categories.

## New Header Layout

```text
+---------------------------------------------------------------+
| Announcement Bar (existing, unchanged)                        |
+---------------------------------------------------------------+
| [Logo + Store Name]    [Home] [Products] [Track] [About]    [User] [Cart] [Menu] |
+---------------------------------------------------------------+
| [All] [ملابس] [إكسسوارات] [أحذية] [إلكترونيات] [منزل]        |  <-- NEW categories bar
+---------------------------------------------------------------+
```

## Design Improvements

### Main Nav Bar (Row 1)
- Slightly increased height for better breathing room
- Refined hover states with smooth scale transitions
- Search icon shortcut on desktop (navigates to /products)
- Better visual separation between logo and nav links
- Improved cart badge with subtle animation

### Categories Bar (Row 2)
- Horizontal scrollable strip of category pills below the main nav
- Each category shows its icon (mapped from Lucide icons like Shirt, Watch, etc.) + name
- Clicking a category navigates to `/products?category=CategoryName`
- "All" pill at the start links to `/products`
- Only visible on the homepage (or optionally on all pages)
- On mobile: horizontally scrollable with hidden scrollbar for a clean look
- Subtle bottom border and slightly different background tint to distinguish from main nav

### Mobile Menu
- Categories section added at the top of the mobile slide-down menu as horizontal scrollable pills
- Cleaner spacing and visual grouping with section dividers

## Technical Details

### Files Modified

**`src/components/Navbar.tsx`** -- Major redesign:
- Import `useCategories` hook and `useStoreSettings` (for store name)
- Import additional Lucide icons needed for category icon mapping (Shirt, Watch, Footprints, Smartphone, Home, Search, Grid3X3)
- Add a helper function to map category icon strings to Lucide icon components
- Add a categories bar section below the main nav (desktop: flex row of pills, mobile: horizontal scroll)
- Include categories in the mobile menu as a scrollable section
- Add a search shortcut icon in the desktop nav actions area
- Use the dynamic store name from settings instead of hardcoded "DZ Store"
- Improve hover/active states with better transitions and visual feedback

### Icon Mapping
The categories store icon names as strings (e.g., "Shirt", "Watch"). A mapping function will convert these to actual Lucide React components:

```text
"Shirt"      -> Shirt icon
"Watch"      -> Watch icon
"Footprints" -> Footprints icon
"Smartphone" -> Smartphone icon
"Home"       -> Home icon
(fallback)   -> Grid3X3 icon
```

### No New Dependencies
All icons come from `lucide-react` (already installed). Categories data comes from the existing `useCategories` hook.

### No Database Changes
Categories are already stored in the settings table and fetched via `useCategories()`.
