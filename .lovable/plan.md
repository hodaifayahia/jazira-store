

# Multi-Language Support for Admin Dashboard (Arabic, French, English)

## Overview
Add a language switcher to the admin dashboard that supports Arabic, French, and English. All hardcoded Arabic text across 15+ admin pages and the layout will be replaced with translation keys.

## Approach

### 1. Create i18n Infrastructure
- Create a `LanguageContext` with React Context + localStorage persistence
- Create translation files for all three languages (ar, fr, en)
- Create a `useTranslation` hook that returns the `t()` function
- Arabic and French remain RTL-aware (Arabic = RTL, French/English = LTR)

### 2. Translation Files Structure

```text
src/
  i18n/
    index.ts          -- LanguageProvider, useTranslation hook
    locales/
      ar.ts           -- Arabic translations (current text)
      fr.ts           -- French translations
      en.ts           -- English translations
```

Each file exports a flat object with ~300+ keys covering:
- **Layout**: sidebar nav labels, notifications, logout, search, user menu
- **Dashboard**: stat cards, chart labels, alerts, table headers
- **Products**: form labels, tabs, KPI labels, bulk actions, CSV import/export
- **Orders**: statuses, filters, table headers, advanced filters, bulk actions
- **Categories**: form fields, icon labels
- **Wilayas**: table headers, form fields, stats
- **Coupons**: form fields, types
- **Leads**: statuses, sources, form fields
- **Confirmers**: form fields, payment modes
- **Abandoned**: statuses, recovery actions
- **Returns**: statuses, form fields, history
- **Costs**: cost types, profit labels
- **Inventory**: stock labels
- **Variations**: option groups, values
- **Settings**: all tab labels, form fields, sections
- **Login**: form labels, buttons
- **Common**: save, delete, cancel, edit, search, loading, etc.

### 3. Language Switcher
- Add a language toggle button in the admin header (AdminLayout.tsx)
- Shows current language flag/code (AR/FR/EN)
- Dropdown to switch between languages
- Selection saved to localStorage

### 4. RTL/LTR Direction Handling
- Arabic: `dir="rtl"` (current behavior)
- French and English: `dir="ltr"`
- The `LanguageProvider` will set `document.documentElement.dir` and `document.documentElement.lang` dynamically
- Font: keep Cairo for Arabic, use system font or Cairo for French/English

### 5. Files to Modify

**New files (4):**
- `src/i18n/index.ts` -- Context, Provider, hook
- `src/i18n/locales/ar.ts` -- Arabic translations
- `src/i18n/locales/fr.ts` -- French translations  
- `src/i18n/locales/en.ts` -- English translations

**Modified files (17):**
- `src/components/AdminLayout.tsx` -- use translations + add language switcher
- `src/pages/admin/AdminLoginPage.tsx`
- `src/pages/admin/AdminDashboardPage.tsx`
- `src/pages/admin/AdminProductsPage.tsx`
- `src/pages/admin/AdminOrdersPage.tsx`
- `src/pages/admin/AdminCategoriesPage.tsx`
- `src/pages/admin/AdminWilayasPage.tsx`
- `src/pages/admin/AdminCouponsPage.tsx`
- `src/pages/admin/AdminLeadsPage.tsx`
- `src/pages/admin/AdminConfirmersPage.tsx`
- `src/pages/admin/AdminAbandonedPage.tsx`
- `src/pages/admin/AdminReturnsPage.tsx`
- `src/pages/admin/AdminCostsPage.tsx`
- `src/pages/admin/AdminInventoryPage.tsx`
- `src/pages/admin/AdminVariationsPage.tsx`
- `src/pages/admin/AdminSettingsPage.tsx`
- `src/App.tsx` -- wrap admin routes with LanguageProvider

### 6. Order Status Translations
Order statuses stored in the database are in Arabic. The display will be translated but the database values remain Arabic. A mapping will handle this:
- "جديد" -> "New" / "Nouveau"
- "قيد المعالجة" -> "Processing" / "En cours"
- "تم الشحن" -> "Shipped" / "Expedie"
- "تم التسليم" -> "Delivered" / "Livre"
- "ملغي" -> "Cancelled" / "Annule"

## Technical Details

### Translation Hook Usage
```typescript
const { t, language, setLanguage, dir } = useTranslation();
// t('sidebar.dashboard') -> "Dashboard" / "Tableau de bord" / "لوحة القيادة"
```

### Language Switcher Component
A small dropdown in the header bar showing flags/codes: 🇩🇿 AR | 🇫🇷 FR | 🇬🇧 EN

### Direction Switching
When language changes:
- Set `document.documentElement.dir` to "rtl" or "ltr"
- Set `document.documentElement.lang` to "ar", "fr", or "en"
- Tailwind's RTL classes (`rtl:` prefix) can be used where needed, but since the current layout is RTL-first, we'll swap CSS logical properties where needed (e.g., sidebar position, margins, text alignment)

### Sidebar Position
- Arabic: sidebar on the right (current)
- French/English: sidebar on the left
- This requires conditional classes based on language direction

