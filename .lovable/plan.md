
# Apply Translations to Remaining Admin Pages

## Overview
Replace all hardcoded Arabic text in the 10 remaining admin pages with `t()` translation calls from the existing `useTranslation` hook. The translation keys are already defined in the locale files (ar.ts, fr.ts, en.ts).

## Pages to Update (10 files)

### 1. AdminProductsPage.tsx (1646 lines)
- Import `useTranslation` hook
- Replace ~50+ hardcoded strings: page title, KPI labels, tab names, search placeholder, filter options, bulk action labels, toast messages, dialog titles, form labels
- Status filter labels ("كل الحالات", "نشط", "معطّل")
- CSV export/import messages
- Product form labels (handled inside `ProductForm` sub-component)

### 2. AdminOrdersPage.tsx (495 lines)
- Import `useTranslation`
- Replace table headers, filter labels, status names, payment method labels
- Advanced filter section labels
- Bulk action bar text
- Order detail dialog labels
- Toast messages

### 3. AdminSettingsPage.tsx (863 lines)
- Import `useTranslation`
- Replace tab labels, section headers, form labels
- Store identity, payment, telegram, returns, security tab content
- Upload buttons, color picker labels
- Hero slides section
- Admin user management labels
- Password change labels

### 4. AdminLeadsPage.tsx (278 lines)
- Import `useTranslation`
- Replace page header, search placeholder, table headers
- Status and source option labels (translate display labels, keep DB values in Arabic)
- Dialog titles and form labels
- Toast messages, empty state text

### 5. AdminConfirmersPage.tsx (738 lines)
- Import `useTranslation`
- Replace tab labels, form labels, table headers
- Payment mode labels, type labels
- Settings tab labels
- Toast messages, dialog titles

### 6. AdminAbandonedPage.tsx (338 lines)
- Import `useTranslation`
- Replace KPI card labels, status labels
- Search placeholder, filter options
- Action buttons (call, convert, note, delete)
- Dialog titles and messages
- Toast messages

### 7. AdminReturnsPage.tsx (726 lines)
- Import `useTranslation`
- Replace KPI labels, status labels, resolution type labels
- Table headers, search placeholder
- Detail dialog content
- Action buttons (approve, reject, mark received, complete)
- Status history labels

### 8. AdminCostsPage.tsx (345 lines)
- Import `useTranslation`
- Replace page title, KPI labels, table headers
- Cost edit dialog labels
- Profit preview labels
- Toast messages

### 9. AdminInventoryPage.tsx (583 lines)
- Import `useTranslation`
- Replace KPI labels, filter tab labels
- Column labels, status labels
- Search placeholder, display settings
- Variant detail labels
- Pagination labels

### 10. AdminVariationsPage.tsx (304 lines)
- Import `useTranslation`
- Replace page title, search placeholder
- Form labels (type, value, color code)
- Status labels (active/inactive)
- Dialog titles, toast messages
- Empty state text

## Implementation Pattern
Each page follows the same pattern:
1. Add `import { useTranslation } from '@/i18n';`
2. Add `const { t } = useTranslation();` at top of component
3. Replace each hardcoded Arabic string with `t('section.key')`
4. For dynamic strings with counts, use `.replace('{n}', String(value))`

## Technical Notes
- All translation keys already exist in ar.ts, fr.ts, and en.ts
- Database values (order statuses, lead statuses) remain in Arabic -- only display labels get translated
- The `useTranslation` hook is already set up and working in the previously updated pages
- Direction (RTL/LTR) is handled globally by the LanguageProvider
- AdminUserManagement component (used inside Settings) also needs the `t` prop or its own `useTranslation` call
- Search icon positioning uses `right-3` for RTL -- may need conditional `left-3`/`right-3` based on `dir`, but this can be handled as a follow-up refinement

## Files Changed
- `src/pages/admin/AdminProductsPage.tsx`
- `src/pages/admin/AdminOrdersPage.tsx`
- `src/pages/admin/AdminSettingsPage.tsx`
- `src/pages/admin/AdminLeadsPage.tsx`
- `src/pages/admin/AdminConfirmersPage.tsx`
- `src/pages/admin/AdminAbandonedPage.tsx`
- `src/pages/admin/AdminReturnsPage.tsx`
- `src/pages/admin/AdminCostsPage.tsx`
- `src/pages/admin/AdminInventoryPage.tsx`
- `src/pages/admin/AdminVariationsPage.tsx`
- `src/components/admin/AdminUserManagement.tsx` (minor -- add useTranslation)
