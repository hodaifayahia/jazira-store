

# Premium Storefront Redesign + Database Seeding

## Overview

Redesign the homepage and product page with a warm, natural, luxurious aesthetic for a dates/honey/natural foods brand. Update the color system project-wide (including admin dashboard), generate hero/product images using Lovable AI, and seed the database with sample data so the store has a complete preview.

## Part 1: Color System Overhaul

### CSS Variables Update (`src/index.css`)

Replace the current green/blue theme with the warm amber palette:

| Variable | Current | New (HSL) | Hex Reference |
|----------|---------|-----------|---------------|
| --primary | 145 63% 49% (green) | 25 95% 37% | #B45309 Deep Amber |
| --primary-foreground | 0 0% 100% | 0 0% 100% | white |
| --secondary | 207 71% 53% (blue) | 40 96% 50% | #F59E0B Honey Gold |
| --secondary-foreground | 0 0% 100% | 25 95% 10% | dark text |
| --background | 0 0% 100% | 40 100% 98% | #FFFBF2 Soft Cream |
| --card | 0 0% 100% | 36 100% 97% | #FEF9EE Warm White |
| --foreground | 210 29% 24% | 30 70% 7% | #1C1005 Deep Walnut |
| --muted-foreground | 210 10% 50% | 30 25% 38% | #78644A Warm Taupe |
| --accent | derived from primary | 160 84% 39% | #059669 Emerald Green |
| --accent-foreground | derived | 160 84% 20% | dark emerald |

Also update dark mode equivalents, sidebar variables, and semantic colors (--success to emerald, --warning to amber).

This change automatically propagates to the entire app including the admin dashboard since all components use CSS variables.

### Typography Addition

Add Playfair Display for Latin serif headings:

```css
@import url('...&family=Playfair+Display:wght@400;500;600;700&...');
```

Add `.font-playfair` utility in tailwind config.

### New Keyframes (`tailwind.config.ts`)

- `parallax-float`: subtle vertical drift for hero background
- `golden-shimmer`: animated golden line drawing effect
- `count-up`: number counter animation
- `drip`: honey drip SVG animation

## Part 2: Homepage Redesign (`src/pages/Index.tsx`)

Completely rewrite the classic template (keeping the template routing system and all data queries intact). The new sections in order:

### Hero Section
- Full-screen with AI-generated hero image (dates + honey on dark wood)
- Poetic Arabic headline with golden decorative line
- Two CTA buttons (amber filled + ghost outlined)
- Floating "100% طبيعي" badge with pulse animation
- Staggered fade-in for text elements

### Trust Bar
- Horizontal strip with 4 trust icons on soft amber background
- Icons: honey jar, fast delivery, quality certified, preservative-free

### Featured Categories
- 3 large cards: تمور / عسل / هدايا وتشكيلات
- Full-bleed AI-generated images with title overlay
- Golden shimmer border on hover + image zoom

### Bestsellers Section
- "الأكثر مبيعاً" heading with golden underline accent
- 4-column grid on desktop, horizontal scroll on mobile
- Uses the redesigned ProductCard component

### Brand Story Section
- Split layout: image left + brand story text right
- Animated counters: +50 types of dates, +20 types of honey, 10,000+ customers
- Decorative quote in serif italic

### Testimonials
- Card carousel with gold stars, customer quotes
- Warm beige cards, auto-scroll with dot navigation
- Data from `reviews` table (will seed reviews)

### Newsletter Section
- Full-width amber background with grain texture
- Email input + subscribe CTA
- Leads are inserted into the existing `leads` table

## Part 3: Product Card Redesign (`src/components/ProductCard.tsx`)

- Warm white card with thin golden border (#F59E0B/20)
- 16px border radius
- Badge overlay top-left: "جديد" / "الأكثر مبيعاً" / "خصم" pills
- Price in amber, old price in gray strikethrough
- "أضف للسلة" button with slide-up animation on hover
- Star rating display (from reviews data)
- All existing logic (variations, add to cart, navigation) preserved

## Part 4: Product Page Redesign (`src/pages/SingleProductPage.tsx`)

Visual-only changes -- all existing logic stays identical:

- Product name in large bold Cairo heading
- Price in deep amber with green "وفّر X%" pill badge
- Weight/volume selector as pill-shaped toggle buttons with amber fill
- "أضف إلى السلة" button: full width, amber gradient, pulse glow
- "اشتر الآن" button: dark walnut background
- Trust badges row: secure payment, free delivery, easy returns
- Product details tabs with warm styling
- Reviews section with gold star bar chart distribution
- Related products carousel at bottom

## Part 5: AI Image Generation

Use the Lovable AI image generation API (google/gemini-2.5-flash-image) via an edge function to generate:

1. Hero image: dates and honey jars on dark wood surface with warm lighting
2. Category images: dates, honey jar with drizzle, gift boxed sets
3. Brand story image: date farm / harvest scene

The edge function `generate-store-images` will:
- Generate images via AI
- Upload them to the `store` storage bucket
- Save the public URLs in the `settings` table

## Part 6: Database Seeding

Insert sample data via Supabase insert operations so the user has a complete overview:

### Products (6 items)
| Name | Category | Price | Old Price | Description |
|------|----------|-------|-----------|-------------|
| تمر المجهول الفاخر | تمور | 2500 | 3000 | Premium Medjool dates |
| عسل السدر الطبيعي | عسل | 3500 | 4000 | Natural Sidr honey |
| تمر دقلة نور | تمور | 1800 | 2200 | Deglet Noor dates |
| عسل الزهور البرية | عسل | 2800 | - | Wild flower honey |
| علبة هدايا فاخرة | هدايا | 5000 | 6000 | Premium gift set |
| معجون التمر الطبيعي | تمور | 1200 | - | Natural date paste |

### Categories (3)
- تمور (Dates), عسل (Honey), هدايا وتشكيلات (Gift Sets)

### Reviews (8-10 sample reviews)
Seeded across products with Arabic names and comments

### Suppliers (2 sample suppliers)
With sample transactions and products

### Wilayas
Ensure existing wilayas have data (should already exist)

### Settings
- store_name: "جزيرة الطبيعة"
- footer_description: updated brand description
- Hero slides with generated images

## Part 7: Admin Dashboard Color Harmony

Since the admin dashboard uses CSS variables (`bg-primary/10 text-primary`, `bg-secondary/10 text-secondary`, etc.), the color change in Part 1 will automatically update it. No code changes needed for the dashboard -- it will use the new amber/gold/cream palette automatically.

The supplier detail page, KPI cards, and all admin components will inherit the warm theme.

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/index.css` | Modify | New warm color palette + dark mode + grain texture utility |
| `tailwind.config.ts` | Modify | Add Playfair Display font + new keyframes |
| `src/pages/Index.tsx` | Rewrite | Complete homepage redesign with new sections |
| `src/components/ProductCard.tsx` | Rewrite | Premium warm card design |
| `src/pages/SingleProductPage.tsx` | Modify | Visual update (warm colors, amber buttons, tabs) |
| `src/components/Navbar.tsx` | Modify | Warm styling, golden accents |
| `src/components/Footer.tsx` | Modify | Dark walnut footer with warm accents |
| `src/components/AnnouncementBar.tsx` | Modify | Amber gradient styling |
| `supabase/functions/generate-store-images/index.ts` | Create | AI image generation + upload |
| `src/i18n/locales/ar.ts` | Modify | Add homepage section translations |
| `src/i18n/locales/en.ts` | Modify | Add homepage section translations |
| `src/i18n/locales/fr.ts` | Modify | Add homepage section translations |
| Database seed data | Insert | Products, categories, reviews, suppliers, settings |

## Implementation Sequence

1. Color system update (index.css + tailwind.config.ts) -- immediately affects entire app including admin
2. Database seeding (products, categories, reviews, suppliers, settings)
3. AI image generation edge function + deploy + invoke to generate images
4. Homepage redesign (Index.tsx)
5. ProductCard redesign
6. SingleProductPage visual update
7. Navbar + Footer + AnnouncementBar warm styling
8. Testing and verification

## Technical Notes

- The `useStoreTheme` hook dynamically overrides CSS variables from `settings.primary_color` / `settings.secondary_color`. We will seed those settings with the new amber/gold colors so the theme persists.
- All existing template routing (minimal, bold, liquid, digital) is preserved -- only the "classic" template gets the redesign.
- All existing logic (cart, orders, variations, checkout, reviews, admin) remains completely untouched.
- The color change propagates to the admin dashboard automatically through CSS variables -- no admin component code changes needed.

