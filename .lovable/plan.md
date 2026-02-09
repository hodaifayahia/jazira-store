

## Plan: Admin Enhancements, Settings Expansion, and Homepage Redesign

This is a large set of improvements spanning 6 areas. Here is the detailed breakdown:

---

### 1. Toggle Product Status Directly from Table Row

**What changes:** Clicking the status badge in the products table will instantly toggle the product between active/inactive without opening the edit form.

**File:** `src/pages/admin/AdminProductsPage.tsx`
- Replace the static status `<span>` badge (line 158-161) with a clickable badge/button.
- On click, call a mutation to update `is_active` to the opposite value directly via Supabase.
- Show a brief loading indicator on the badge while updating.
- Invalidate the products query on success.

---

### 2. Duplicate Product Button

**What changes:** Add a "Duplicate" button in the actions column for each product row, which creates a copy of the product with "(نسخة)" appended to the name.

**File:** `src/pages/admin/AdminProductsPage.tsx`
- Add a `Copy` icon button next to Edit and Delete in the actions column (line 164-170).
- Create a `duplicateMutation` that inserts a new product with all the same fields (name + " (نسخة)", same description, price, category, stock, images, etc.) but a new ID.
- Invalidate the products query on success and show a toast.

---

### 3. Export and Import Products (CSV)

**What changes:** Add "Export CSV" and "Import CSV" buttons to the products page header. Export downloads all products as a CSV file. Import reads a CSV and bulk-inserts products.

**File:** `src/pages/admin/AdminProductsPage.tsx`
- Add two buttons next to "Add Product": "تصدير" (Export) with a `Download` icon and "استيراد" (Import) with an `Upload` icon.
- **Export:** Generate a CSV string from the products array (columns: name, description, price, category, stock, is_active) and trigger a browser download.
- **Import:** Open a file input, parse the CSV, validate rows, and bulk-insert valid products via Supabase. Show a summary toast (X products imported, Y errors).

---

### 4. Smart Wilaya Suggestions in Orders (High Return Rate Warning)

**What changes:** Analyze orders with status "ملغي" (cancelled) grouped by wilaya. On the orders page and in the dashboard, show a warning icon/badge next to wilayas that have a high cancellation/return rate (e.g., >30% of orders from that wilaya are cancelled).

**Files:**
- `src/pages/admin/AdminDashboardPage.tsx` -- Add a new card "Wilayas to Watch" showing wilayas with high cancellation rates.
- `src/pages/admin/AdminOrdersPage.tsx` -- In the orders table, show a small warning icon next to the wilaya name if it has a high cancellation rate.

**Logic:** 
- Calculate per-wilaya: `cancelledCount / totalCount`. If ratio > 0.3 and totalCount >= 3, flag it.
- Display as a small `AlertTriangle` icon with a tooltip showing "نسبة إلغاء مرتفعة (X%)".

---

### 5. Settings Page: Footer Info + Hero Banner Image

**What changes:** Expand the Settings page to allow editing footer content and uploading a custom hero banner image for the homepage.

**File:** `src/pages/admin/AdminSettingsPage.tsx`
- Add a new section "معلومات التذييل" (Footer Info) with fields:
  - `footer_description` -- The store description text shown in the footer.
  - `footer_phone` -- Contact phone number.
  - `footer_email` -- Contact email.
  - `footer_address` -- Address text.
- Add a new section "صورة الصفحة الرئيسية" (Hero Banner) with:
  - An image upload similar to the logo upload, saving to the `store` bucket.
  - The URL saved as `hero_banner` in the settings table.

**File:** `src/components/Footer.tsx`
- Read `footer_description`, `footer_phone`, `footer_email`, `footer_address`, and `store_name` from the settings table (via a new query or expanded existing one).
- Render these dynamic values instead of hardcoded text.

**File:** `src/pages/Index.tsx`
- Read the `hero_banner` setting. If it exists, use it instead of the static imported `heroBanner` image.

---

### 6. Enhanced Homepage Design

**What changes:** Make the homepage more attractive with additional sections and visual improvements.

**File:** `src/pages/Index.tsx`
- **Features/Trust Bar:** Add a section below the hero with 3-4 trust icons (free shipping, secure payment, fast delivery, customer support) in a horizontal strip.
- **Improved Categories:** Make category cards larger with better hover effects and gradients.
- **"Why Choose Us" Section:** Add a section with 3 cards highlighting store benefits (quality products, nationwide delivery, competitive prices) with icons and brief descriptions.
- **Newsletter/CTA Section:** Add a simple call-to-action section before the footer encouraging visitors to browse or contact.
- **Visual polish:** Add subtle gradient backgrounds between sections, improve spacing, and add fade-in animations.

---

### Technical Summary

| File | Changes |
|------|---------|
| `src/pages/admin/AdminProductsPage.tsx` | Clickable status toggle, duplicate button, export/import CSV |
| `src/pages/admin/AdminOrdersPage.tsx` | Wilaya cancellation warning icon |
| `src/pages/admin/AdminDashboardPage.tsx` | "Wilayas to Watch" card with high cancellation rates |
| `src/pages/admin/AdminSettingsPage.tsx` | Footer info fields + hero banner upload |
| `src/components/Footer.tsx` | Dynamic footer content from settings |
| `src/pages/Index.tsx` | Dynamic hero banner + trust bar + "why us" section + CTA section |

No database schema changes needed -- all new settings use the existing `settings` key-value table.

