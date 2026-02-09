

## Plan: Hero Carousel, Product Reviews, Advanced Filters, and User Authentication

This plan covers 4 major features. Here is the detailed breakdown:

---

### 1. Homepage Hero Carousel

**What changes:** Replace the single hero image with an auto-sliding carousel that cycles through multiple banner images.

**File:** `src/pages/Index.tsx`
- Use `embla-carousel-react` (already installed) to create a hero carousel.
- Fetch multiple banner images from the `settings` table (key: `hero_banners` storing a JSON array of image URLs). Fall back to the single `hero_banner` setting and the static fallback image.
- Auto-play with 5-second interval, dot indicators at the bottom, smooth transitions.
- Each slide keeps the same gradient overlay and text content on top.

**File:** `src/pages/admin/AdminSettingsPage.tsx`
- Update the hero banner section to support uploading multiple images (stored as a JSON array in `hero_banners` setting key).
- Allow reordering and deleting individual banners.

---

### 2. Product Reviews and Enhanced Product Detail Page

**What changes:** Allow visitors to leave reviews (name, rating, comment) on products and redesign the product detail page with a rich layout including photos interleaved with description text.

#### Database Migration

```sql
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  reviewer_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "Reviews are publicly readable"
  ON public.reviews FOR SELECT
  USING (true);

-- Anyone can post a review
CREATE POLICY "Anyone can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (true);

-- Admin can manage reviews
CREATE POLICY "Admin can manage reviews"
  ON public.reviews FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

#### File: `src/pages/SingleProductPage.tsx` (Major Redesign)

- **Image gallery:** Keep the current thumbnail gallery but make the main image larger.
- **Rich product info section:**
  - Product title, price, category badges, stock status.
  - Short description paragraph.
  - Add-to-cart and direct-order buttons (existing).
  - Product details section with all images displayed inline with description text (rich layout with alternating image-left/text-right blocks).
- **Reviews section at the bottom:**
  - Display average rating with star icons and total review count.
  - List of reviews showing reviewer name, star rating, comment, and date.
  - "Add Review" form: name input, star rating selector (clickable stars), comment textarea, submit button.
  - Reviews fetched via `useQuery`, new review submitted via mutation.

---

### 3. Products Page with Sidebar Filters

**What changes:** Redesign the products page from a top-bar filter layout to a sidebar + content grid layout with comprehensive filtering options.

**File:** `src/pages/ProductsPage.tsx`

- **Layout:** Two-column layout on desktop: left sidebar (filters) + right content area (product grid). On mobile, filters collapse into a slide-out sheet.
- **Sidebar filters:**
  - **Search:** Text input (existing, moved to sidebar).
  - **Categories:** Checkbox list of all categories (multi-select instead of single dropdown).
  - **Price Range:** Dual-thumb slider using the existing `Slider` component with min/max inputs.
  - **Availability:** Toggle/checkbox for "in stock only".
  - **Sort:** Radio buttons or select (newest, cheapest, most expensive).
  - **Clear All Filters** button.
- **Mobile:** A "Filters" button opens a Sheet/Drawer with the same filter options.
- **Active filters shown as badges** above the product grid that can be individually dismissed.
- Client-side filtering for search and price range; server-side for category and sort.

---

### 4. User Authentication and Customer Dashboard

**What changes:** Add a simple sign-in/sign-up flow for customers and a personal dashboard where they can view their order history.

#### Database Migration

```sql
-- Add optional user_id to orders so logged-in users' orders are linked
ALTER TABLE public.orders ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Allow users to read their own orders
CREATE POLICY "Users can read own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);
```

Note: The existing "Anyone can read orders" policy already allows public reads by order number. The new `user_id` column lets logged-in users see all their orders in one place.

#### New Files

- **`src/pages/AuthPage.tsx`**: A clean page with tabs for "Login" and "Sign Up". Email + password fields. Uses `supabase.auth.signUp` and `supabase.auth.signInWithPassword`. After login, redirect to `/dashboard`. Minimal and smooth design matching the store aesthetic.

- **`src/pages/CustomerDashboardPage.tsx`**: Protected page (redirects to `/auth` if not logged in). Shows:
  - Welcome message with user email.
  - List of the user's orders (fetched by `user_id`) with order number, date, status badge, total amount.
  - Click on an order to expand and see items.
  - Logout button.

- **`src/hooks/useAuth.ts`**: A custom hook wrapping `supabase.auth.onAuthStateChange` and `getSession` to provide `user`, `loading`, `signOut` across the app.

#### Updated Files

- **`src/App.tsx`**: Add routes `/auth` and `/dashboard`.
- **`src/components/Navbar.tsx`**: Add a user icon next to the cart. If logged in, show avatar/icon linking to `/dashboard`. If not, link to `/auth` with a "تسجيل الدخول" label.
- **`src/pages/CheckoutPage.tsx`**: If user is logged in, auto-fill name from session and set `user_id` on order insert. Show a subtle prompt "سجل دخولك لتتبع طلباتك" if not logged in.

---

### Technical Summary

| Area | Files | Changes |
|------|-------|---------|
| Hero Carousel | `Index.tsx`, `AdminSettingsPage.tsx` | Multi-image carousel with auto-play using embla-carousel |
| Reviews | New `reviews` table, `SingleProductPage.tsx` | Review form, star ratings, review list, rich product layout |
| Sidebar Filters | `ProductsPage.tsx` | Sidebar with category checkboxes, price slider, stock filter |
| Auth + Dashboard | New `AuthPage.tsx`, `CustomerDashboardPage.tsx`, `useAuth.ts`, updated `Navbar.tsx`, `App.tsx`, `CheckoutPage.tsx` | Email auth, order history dashboard, auto-link orders |

#### Database Changes Required
- New `reviews` table with RLS policies
- New `user_id` column on `orders` table with RLS policy

