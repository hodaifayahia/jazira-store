

## Three Enhancements: Homepage Verification, Quick-View Modal, Admin Category Management

### 1. Homepage Design Verification (Desktop + Mobile)

I've tested the homepage on both desktop (1920x1080) and mobile (390x844). Here's the status:

**Desktop** -- looks great:
- Hero section: gradient overlay, CTA buttons, announcement badge all render cleanly
- Trust bar: 4-column grid with icons, well-spaced
- Categories: grid layout with gradient cards, icons, and hover effects working
- Products grid: 4-column layout, product cards with "السلة" and "طلب مباشرة" buttons
- CTA banner: centered gradient section with decorative circles

**Mobile** -- mostly good, minor fixes needed:
- Hero: text and buttons stack properly, readable
- Trust bar: 2-column grid, slightly tight but functional
- Categories: 2-column grid, works well
- Product cards: buttons ("السلة" + "طلب مباشرة") are a bit cramped on small screens -- the two buttons plus the price all compete for space
- CTA banner: looks good, responsive text

**Fixes to apply:**
- On mobile (< sm), stack the price above the buttons in `ProductCard` so they don't feel cramped
- Ensure the product card button text doesn't overflow on very small screens

---

### 2. Product Quick-View Modal

Instead of hover (which doesn't work on mobile/touch), implement a quick-view that triggers via a visible "eye" icon button on the product card image overlay.

**New component:** `src/components/ProductQuickView.tsx`
- A Dialog/modal component that receives a product ID
- Fetches full product data (or receives it as props)
- Displays: image carousel, name, price, category, description, stock status
- Action buttons: "إضافة إلى السلة" and "طلب مباشرة" (reusing existing cart logic)
- "عرض التفاصيل الكاملة" link to navigate to the full product page

**Changes to `ProductCard.tsx`:**
- Add an "eye" icon button in the image overlay area (visible on hover for desktop, always visible on mobile)
- Clicking it opens the QuickView dialog instead of navigating to the product page
- The card itself still links to the product page on click

**Implementation details:**
- Use the existing `Dialog` component from shadcn/ui
- Product data can be passed as props (since the card already has basic info) + fetch description on open
- Modal is RTL-friendly with Arabic text

---

### 3. Admin Category Management Page

**Goal:** Replace the hardcoded `CATEGORIES` arrays across the app with dynamic categories managed from the admin panel. Since we can't add new DB tables, we'll store categories in the existing `settings` table as a JSON string.

**Settings key:** `categories` with value being a JSON array like:
```text
[
  {"name": "أدوات منزلية", "icon": "Home"},
  {"name": "منتجات زينة", "icon": "Sparkles"},
  {"name": "إكسسوارات", "icon": "Watch"}
]
```

**New page:** `src/pages/admin/AdminCategoriesPage.tsx`
- List all categories with their name and icon
- Add/edit/delete categories via inline form
- Icon selection from a predefined list of Lucide icon names (Home, Sparkles, Watch, ShoppingBag, Shirt, Laptop, Utensils, Gift, Heart, Star, Grid3X3, etc.)
- Save to `settings` table under key `categories`

**Changes to existing files:**

| File | Change |
|------|--------|
| `src/components/AdminLayout.tsx` | Add "التصنيفات" nav item with `Layers` icon pointing to `/admin/categories` |
| `src/App.tsx` | Add route `/admin/categories` with `AdminCategoriesPage` |
| `src/pages/Index.tsx` | Replace hardcoded `CATEGORY_ICONS` -- fetch categories from settings, use stored icon names |
| `src/pages/ProductsPage.tsx` | Replace hardcoded `CATEGORIES` array -- fetch from settings, show dynamic filter list |
| `src/pages/admin/AdminProductsPage.tsx` | Replace hardcoded `CATEGORIES` -- fetch from settings for the category dropdown |
| `src/pages/admin/AdminCategoriesPage.tsx` | New admin page for CRUD on categories |

**Shared hook:** `src/hooks/useCategories.ts`
- A `useQuery` hook that fetches the `categories` setting and parses the JSON
- Returns `{ categories, isLoading }` where categories is `{ name: string, icon: string }[]`
- Used by Index, ProductsPage, AdminProductsPage, and AdminCategoriesPage

**Database update:** Insert the initial `categories` setting with the current 3 categories as default.

---

### Summary of all files

| File | Action |
|------|--------|
| `src/components/ProductCard.tsx` | Add quick-view button, fix mobile layout |
| `src/components/ProductQuickView.tsx` | New -- quick-view modal component |
| `src/hooks/useCategories.ts` | New -- shared hook for dynamic categories |
| `src/pages/admin/AdminCategoriesPage.tsx` | New -- admin category management |
| `src/pages/Index.tsx` | Use dynamic categories from hook |
| `src/pages/ProductsPage.tsx` | Use dynamic categories from hook |
| `src/pages/admin/AdminProductsPage.tsx` | Use dynamic categories from hook |
| `src/components/AdminLayout.tsx` | Add categories nav link |
| `src/App.tsx` | Add admin categories route |
| Database (settings) | Insert initial categories JSON |

