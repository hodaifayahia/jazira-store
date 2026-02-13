

# Simplify Settings Sidebar Navigation

## Overview
Remove the expandable settings sub-items from the sidebar. Instead, "Settings" will be a single link that navigates to `/admin/settings`, where the cards hub page (already built) lets you pick the category you want.

## What Changes

### Before (current)
The sidebar shows "Settings" as a collapsible group that expands to reveal 7 sub-links (Identity, Payment, Telegram, etc.).

### After
The sidebar shows "Settings" as a single link (like Dashboard, Products, etc.) that goes to `/admin/settings`. From there, you click a card to reach the specific settings page.

## Technical Details

### `src/components/AdminLayout.tsx`
- Remove the `Collapsible`, `CollapsibleContent`, `CollapsibleTrigger` usage for the settings group (lines 272-295)
- Replace it with a simple `Link` to `/admin/settings`, styled the same as other nav items
- Keep the `SETTINGS_SUB_KEYS` array (it's still used by `currentPageLabel` logic) but remove the collapsible rendering
- Update the active-state check: highlight the Settings link when any `/admin/settings*` path is active
- Remove unused imports (`Collapsible`, `CollapsibleContent`, `CollapsibleTrigger`, `ChevronRight`) if no longer needed elsewhere

No other files need changes -- the hub page and routing already work.
