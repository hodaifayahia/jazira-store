

# Split Settings Page into Separate Category Pages

## Overview
Break the single monolithic Settings page (942 lines, 7 tabs) into separate admin pages, each accessible from the sidebar navigation. This makes the admin panel cleaner and easier to navigate.

## Current vs New Structure

```text
BEFORE (single page with tabs):
/admin/settings
  ├── Tab: Store Identity
  ├── Tab: Payment & Delivery
  ├── Tab: Telegram Bot
  ├── Tab: Returns
  ├── Tab: Form
  ├── Tab: Appearance
  └── Tab: Security

AFTER (separate pages in sidebar):
/admin/settings/identity    --> Store Identity (name, logo, colors, announcements, slider, footer, pixel)
/admin/settings/payment     --> Payment & Delivery
/admin/settings/telegram    --> Telegram Bot
/admin/settings/returns     --> Returns Settings
/admin/settings/form        --> Form Settings
/admin/settings/appearance  --> Appearance / Template
/admin/settings/security    --> Security & Users
```

## Sidebar Navigation Changes
The current single "Settings" item in the sidebar will become a collapsible group with sub-items:

```text
Settings (collapsible)
  ├── Store Identity
  ├── Payment
  ├── Telegram
  ├── Returns
  ├── Form
  ├── Appearance
  └── Security
```

## Technical Details

### Files Created (7 new page files)
Each file extracts its corresponding tab content from the current settings page, keeping the same shared hooks (settings query, save mutation, image upload helpers):

- `src/pages/admin/settings/AdminIdentityPage.tsx` -- Store name, logo, favicon, colors, announcements, hero slider, footer info, Facebook Pixel, extra settings
- `src/pages/admin/settings/AdminPaymentPage.tsx` -- COD, BaridiMob, Flexy payment toggles and config
- `src/pages/admin/settings/AdminTelegramPage.tsx` -- Telegram bot token, chat IDs, webhook, test notification
- `src/pages/admin/settings/AdminReturnsSettingsPage.tsx` -- Return settings + reasons manager (the existing `ReturnSettingsTab` component)
- `src/pages/admin/settings/AdminFormSettingsPage.tsx` -- Wrapper for existing `FormSettingsTab` component
- `src/pages/admin/settings/AdminAppearancePage.tsx` -- Wrapper for existing `AppearanceTab` component
- `src/pages/admin/settings/AdminSecurityPage.tsx` -- Password change + `AdminUserManagement`

### Shared Settings Hook
- `src/hooks/useAdminSettings.ts` -- Extract the shared logic (settings query, save mutation, image upload, setField) into a reusable hook so all 7 pages share the same data fetching and saving pattern without duplicating code.

### Files Modified
- `src/components/AdminLayout.tsx` -- Replace single "Settings" nav item with a collapsible group containing 7 sub-links
- `src/App.tsx` -- Add 7 new routes under `/admin/settings/*`
- `src/pages/admin/AdminSettingsPage.tsx` -- Simplified to redirect to `/admin/settings/identity` (keeps backward compatibility)

### No New Dependencies
Uses existing `Collapsible` component from Radix UI (already installed) for the sidebar group.

