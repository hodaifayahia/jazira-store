

# Settings Hub: Category Cards Page

## Overview
Replace the current auto-redirect at `/admin/settings` with a visual hub page showing all 7 settings categories as clickable cards. When you click a card, it navigates to that category's settings page.

## What You'll See

```text
/admin/settings
+---------------------------------------------------+
|  Settings (title)                                  |
|                                                    |
|  [Store Identity]  [Payment]    [Telegram]         |
|  [Returns]         [Form]      [Appearance]        |
|  [Security]                                        |
+---------------------------------------------------+
```

Each card will show:
- The category icon (same icons already used in sidebar)
- The category name
- A short description of what that section controls

Clicking a card navigates to the corresponding sub-page (e.g., `/admin/settings/identity`).

## Technical Details

### File Modified

**`src/pages/admin/AdminSettingsPage.tsx`**
- Remove the `Navigate` redirect
- Render a responsive grid of cards (one per settings category)
- Each card uses the same icon and translation key from `SETTINGS_SUB_KEYS` pattern
- Cards link to their respective routes using `useNavigate` or `Link`
- Add short description text for each category
- Uses existing `Card` component from `src/components/ui/card.tsx`

### Translation Keys
Add 7 short description strings to `ar.ts`, `fr.ts`, and `en.ts` for each settings category card (e.g., "Manage store name, logo, and colors").

### No Database or Routing Changes
The route `/admin/settings` already exists. We're just changing what it renders from a redirect to a cards page.

