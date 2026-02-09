

## Plan: Notifications Modal, Low Stock Alerts, Hero Enhancement, Streamlined Checkout, and Product Page UI Upgrade

---

### 1. Notification Bell Pop-up Modal (Admin Dashboard)

**Current state:** The bell icon in `AdminLayout.tsx` only shows a count badge and navigates to the orders page when clicked. No detail pop-up exists. Low stock alerts appear only on the dashboard page as a static banner.

**Changes:**

**File: `src/components/AdminLayout.tsx`**
- Replace the bell click handler with a `Popover` (from shadcn) that opens a notification panel.
- Maintain a notifications list in state with two types:
  - **New Order** notifications (from the existing realtime subscription) -- show order number, customer name, timestamp.
  - **Low Stock** notifications -- fetched on mount via a query for products where `stock <= 5 AND is_active = true`. Each shows product name and remaining stock count.
- Each notification item has an icon (ShoppingCart for orders, AlertTriangle for low stock), a title, description, and timestamp.
- Clicking a notification navigates to the relevant page (orders or products).
- "Mark all as read" button clears the notification list.
- Badge on bell shows total unread count (new orders + low stock items).

---

### 2. Enhanced Hero Section (Homepage)

**Current state:** The hero has a gradient overlay, text, search bar, and two buttons. It works but is visually flat.

**File: `src/pages/Index.tsx`**
- Add animated floating decorative elements (subtle CSS-animated circles/blobs) in the background for visual depth.
- Add a subtle glassmorphism card effect around the hero content area (semi-transparent backdrop with blur).
- Improve the gradient to a multi-stop gradient with better color transitions.
- Add a subtle parallax-like scale effect on the banner images (CSS transform on hover or scroll).
- Enhance the search bar with a larger, more prominent design and a subtle glow/shadow effect.
- Add animated badge counters (e.g., "500+ product" or similar social proof element) near the CTA buttons.
- Add a subtle entrance animation (fade-in + slide-up) for the text content using Tailwind animate classes.

---

### 3. Streamlined Checkout Button on Product Pages

**Current state:** The checkout button ("اطلب مباشرة") exists on `SingleProductPage.tsx` and individual `ProductCard.tsx`. The checkout page is a separate page (`/checkout`). The user wants "إتمام الطلب" to be easily accessible, especially when browsing many products.

**Changes:**

**File: `src/components/ProductCard.tsx`**
- Keep the existing "اطلب" direct order button as-is (it already adds to cart and navigates to checkout).

**File: `src/pages/SingleProductPage.tsx`**
- Move the Add-to-Cart and Direct Order buttons into a **sticky bottom bar** that stays visible as the user scrolls. This bar shows: product name (truncated), price, quantity selector, "Add to Cart" and "Order Now" buttons.
- The sticky bar appears after the user scrolls past the original button area (using Intersection Observer or a scroll threshold).
- On mobile, this bar is always visible at the bottom with compact layout.

**File: `src/pages/ProductsPage.tsx`**
- Add a **floating cart summary bar** at the bottom of the screen when items are in the cart. Shows: item count, total price, and a "إتمام الطلب" button linking to `/checkout`.
- This makes checkout accessible from the product listing without scrolling back to the nav.

---

### 4. Enhanced Product Page UI/UX (Multiple Photos Display)

**Current state:** `SingleProductPage.tsx` shows a main image with small thumbnails below. The "Rich Product Details" section alternates images and text blocks but looks generic.

**File: `src/pages/SingleProductPage.tsx`**
- **Image Gallery Upgrade:**
  - Replace the simple thumbnail strip with a more visual gallery: main image takes more vertical space, thumbnails displayed as a vertical strip on desktop (left side) and horizontal on mobile.
  - Add image zoom on hover (CSS transform scale on the main image container with overflow hidden).
  - Add left/right arrow navigation on the main image for quick browsing.
  - Show image counter (e.g., "3/7") overlay.
- **Rich Details Section Redesign:**
  - Instead of generic "صورة توضيحية" placeholders, use a masonry-style or magazine layout for additional images.
  - Group images in a responsive grid (2 columns on desktop, 1 on mobile) with rounded corners and subtle shadow.
  - The description text is displayed prominently above the image grid.
- **Overall layout polish:**
  - Better spacing, card-based sections with subtle borders.
  - Product info section gets a slight card background for separation.
  - Smooth scroll-to-reviews link from the rating summary.

---

### Technical Summary

| Area | Files Modified | Key Changes |
|------|---------------|-------------|
| Notification Modal | `AdminLayout.tsx` | Popover with order + low stock notifications list |
| Hero Enhancement | `Index.tsx` | Glassmorphism, animated elements, better gradient, glow search bar |
| Sticky Checkout | `SingleProductPage.tsx`, `ProductsPage.tsx` | Sticky bottom bar on product page, floating cart bar on products list |
| Product Gallery | `SingleProductPage.tsx` | Vertical thumbnails, zoom, arrows, masonry image grid, polished layout |

No database changes are required for any of these features.

