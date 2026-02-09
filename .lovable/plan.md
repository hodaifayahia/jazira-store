

## Plan: Admin Products Search/Filter + Enhanced Categories Page

### 1. Admin Products Table -- Search and Filter

**What changes:**
- Add a search bar above the products table to filter by product name.
- Add a category dropdown filter to show only products of a specific category.
- Add a status filter (All / Active / Inactive).
- Filtering happens client-side on the already-fetched products list.

**Where:** `src/pages/admin/AdminProductsPage.tsx`

---

### 2. Enhanced Categories Page

**What changes:**

**A. More icon options**
- Expand the `AVAILABLE_ICONS` array with many more Lucide icons (e.g., Laptop, Phone, Car, Utensils, Baby, Headphones, Camera, Sofa, Dumbbell, Palette, Book, Gem, Zap, Flame, Leaf, Music, Plane, Pizza, Coffee, etc.).

**B. Custom photo upload for categories**
- Add an "upload photo" option alongside icon selection. Each category can use either a Lucide icon OR an uploaded image.
- Category data structure changes from `{ name, icon }` to `{ name, icon, image?: string }`.
- When an image is uploaded, it goes to the existing `store` storage bucket (e.g., `categories/filename.ext`).
- The category display (in admin and storefront) will show the uploaded image if present, otherwise the icon.

**C. Edit functionality (already exists)**
- The edit feature with inline editing is already implemented. No changes needed here -- it already supports renaming and changing the icon.
- The edit flow will be extended to also allow changing/uploading a category image.

**Where:** `src/pages/admin/AdminCategoriesPage.tsx`, `src/hooks/useCategories.ts`

---

### Technical Details

**AdminProductsPage.tsx changes:**
- Add state variables: `searchQuery`, `filterCategory`, `filterStatus`.
- Add a filter bar with an `Input` for search, a `Select` for category, and a `Select` for status.
- Apply filters to the `products` array before rendering the table rows.

**AdminCategoriesPage.tsx changes:**
- Expand `AVAILABLE_ICONS` with ~20+ more icons.
- Add image upload input in both the "add" and "edit" forms.
- Upload images to the `store` bucket under a `categories/` prefix.
- Show image preview when a category has a custom photo.
- Update the Category type to include an optional `image` field.

**useCategories.ts changes:**
- Update the `Category` interface to add `image?: string`.

**Storefront impact:**
- Any component rendering category icons (Navbar, ProductsPage, Index) will need a small update to render the category image if present, falling back to the icon.
