

# Store Settings Page Enhancement

## Overview
Reorganize the existing settings page into a tabbed interface with 4 tabs, adding new features: primary/secondary color pickers, announcement bar, hero slider (multiple images), favicon upload, and social media links. All settings continue using the existing `settings` key-value table -- no new database tables needed.

## Current State
- Settings are stored as key-value pairs in the `settings` table
- Existing settings: store_logo, hero_banner, footer_description, footer_phone, footer_email, footer_address, store_name, facebook_url, payment methods, telegram bot config
- Categories managed separately in `AdminCategoriesPage.tsx`
- CSS theme colors are hardcoded in `src/index.css`
- No announcement bar, no favicon, no color customization exists yet

## Tab Structure

### Tab 1: هوية المتجر (Store Identity)
- **Store Name** (existing `store_name` field)
- **Store Logo** (existing `store_logo` upload -- move here)
- **Favicon** (new `store_favicon` setting -- 32x32px upload, rendered in `index.html` via a hook)
- **Primary Color** (new `primary_color` setting -- hex color picker, default `#2ecc71` matching current CSS)
- **Secondary Color** (new `secondary_color` setting -- hex color picker, default `#3498db`)
  - Warning text: "تجنب اللون الأبيض لضمان وضوح النصوص"
  - Live preview swatch showing both colors together
- **Announcement Bar** (new settings: `announcement_1` through `announcement_4`)
  - 4 text input slots with enable/disable toggle (`announcements_enabled`)
  - Preview strip showing how announcements rotate
- **Hero Slider** (upgrade from single `hero_banner` to multi-image)
  - New setting `hero_slides` storing JSON array: `[{ url, link?, alt? }]`
  - Upload up to 5 images, reorder with drag handles, delete individual slides
  - Each slide can optionally link to a URL
- **Copyright Text** (new `copyright_text` setting, rendered in Footer)
- **Products Per Page** (new `products_per_page` setting -- dropdown: 5, 10, 25, 50)

### Tab 2: الدفع والتوصيل (Payment and Shipping)
- Move existing payment settings here (BaridiMob, Flexy)
- Keep as-is, just relocated under this tab

### Tab 3: بوت تلغرام (Telegram Bot)
- Move existing Telegram bot settings here
- Keep as-is, just relocated under this tab

### Tab 4: الأمان (Security)
- Move existing password change section here
- Move admin user management here

## Settings Keys (New)
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `primary_color` | hex string | `#2ecc71` | Store primary color |
| `secondary_color` | hex string | `#3498db` | Store secondary color |
| `store_favicon` | URL string | empty | Favicon image URL |
| `announcements_enabled` | `true`/`false` | `false` | Show announcement bar |
| `announcement_1` to `announcement_4` | text | empty | Announcement texts |
| `hero_slides` | JSON string | `[]` | Array of slider images |
| `copyright_text` | text | empty | Footer copyright |
| `products_per_page` | number string | `10` | Products per page on storefront |

## Storefront Integration

### Dynamic Colors
- Create `useStoreTheme` hook that fetches `primary_color` and `secondary_color` from settings
- In `App.tsx`, apply colors as CSS custom properties on `<html>` element:
  ```
  document.documentElement.style.setProperty('--primary', hslFromHex(color))
  ```
- This makes all existing Tailwind `primary` / `secondary` classes respond dynamically

### Announcement Bar
- New `AnnouncementBar` component rendered above `Navbar`
- Fetches `announcements_enabled` + `announcement_1..4`
- Rotates between non-empty texts every 4 seconds with fade animation
- Compact strip: colored background (primary), white text, ~36px height

### Hero Slider
- Update `Index.tsx` hero section to use `hero_slides` setting
- If slides exist, render with Embla Carousel (already installed)
- Auto-play, dots navigation, swipe on mobile
- Fallback to current static hero if no slides configured

### Favicon
- Create `useFavicon` hook that updates `<link rel="icon">` in document head
- Called in `App.tsx`

### Products Per Page
- Update `ProductsPage.tsx` to fetch `products_per_page` setting and use it as page size

### Copyright
- Update `Footer.tsx` to use `copyright_text` setting if set, otherwise keep default

## Technical Details

### Files to Create
- `src/hooks/useStoreTheme.ts` -- Fetches colors and applies CSS variables
- `src/hooks/useFavicon.ts` -- Updates document favicon
- `src/components/AnnouncementBar.tsx` -- Rotating announcement strip

### Files to Modify
- `src/pages/admin/AdminSettingsPage.tsx` -- Complete restructure into 4 tabs
- `src/pages/Index.tsx` -- Hero slider using Embla
- `src/components/Footer.tsx` -- Copyright text from settings
- `src/pages/ProductsPage.tsx` -- Dynamic products per page
- `src/App.tsx` -- Add `useStoreTheme`, `useFavicon`, `AnnouncementBar`

### No Database Migration Needed
All new settings use the existing `settings` key-value table with upsert logic already in place.

### Color Picker Implementation
- Use native HTML `<input type="color">` alongside a text input for hex value
- Validate hex format on save
- Show live preview swatches

### Hero Slider Storage
- Images uploaded to existing `store` bucket
- URLs stored as JSON array in `hero_slides` setting
- Max 5 slides enforced in UI

