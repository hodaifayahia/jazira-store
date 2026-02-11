
# Fix Admin Sidebar Responsiveness

## Problems Identified
1. At tablet width (768px), the sidebar is permanently visible and takes too much space, cramping the main content
2. On mobile, when the sidebar opens, the nav items don't scroll properly -- the logout button at the bottom can overlap with long nav lists
3. The overlay behind the mobile sidebar doesn't fully block interaction with background content
4. The `md:` breakpoint (768px) is too small for a permanent 256px sidebar -- should use `lg:` (1024px) instead

## Solution

Modify `src/components/AdminLayout.tsx` with these changes:

### 1. Change breakpoint from `md:` to `lg:` (1024px)
- Sidebar: change `md:translate-x-0` to `lg:translate-x-0` so the sidebar only stays permanently open on screens 1024px and wider
- Main content: change `md:mr-64` to `lg:mr-64`
- Hamburger menu: change `md:hidden` to `lg:hidden` so it shows on tablets too
- Close button in sidebar: change `md:hidden` to `lg:hidden`
- Header title and search: change `md:block` / `md:flex` to `lg:block` / `lg:flex`
- Overlay: change `md:hidden` to `lg:hidden`

### 2. Add scrollable nav area
- Add `overflow-y-auto` and proper height constraints to the nav section so all items are accessible without overlapping the logout button
- Use `flex-1 overflow-y-auto` on the nav container and keep the logout footer fixed at bottom

### 3. Improve mobile overlay
- Ensure the overlay `z-index` is correct (z-40 for overlay, z-50 for sidebar)

## Files Changed
- `src/components/AdminLayout.tsx` -- update breakpoints and add scroll to nav

## Technical Details
- All `md:` responsive prefixes in the sidebar/layout section get changed to `lg:`
- The nav `<nav>` element gets `flex-1 overflow-y-auto` classes
- The sidebar `<aside>` gets `flex flex-col` to enable proper flex layout for header/nav/footer sections
