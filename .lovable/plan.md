

# Landing Page Builder: Full Order Form, Auto Images, Save & Track

## 1. Database Changes

### New table: `landing_pages`
Stores saved landing pages for reuse and order tracking.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Default gen_random_uuid() |
| product_id | uuid | Reference to products table |
| title | text | The generated headline |
| language | text | e.g. 'ar', 'en', 'fr' |
| content | jsonb | Full LandingContent JSON |
| selected_image | text | Primary image URL |
| generated_images | text[] | AI-generated image URLs |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

RLS: Admin-only for all operations.

### Alter `orders` table
Add a nullable column to track landing page source:
```sql
ALTER TABLE public.orders ADD COLUMN landing_page_id uuid;
```

## 2. Landing Page Form Overhaul

Replace the current static HTML form (name/phone/wilaya text inputs) with a **real interactive React form** that mirrors CheckoutPage:

- **Wilaya dropdown**: Fetches from `wilayas` table (active only), shows real wilaya names
- **Baladiya dropdown**: Loads dynamically based on selected wilaya from `baladiyat` table
- **Delivery type**: Office vs Home buttons with shipping prices from the wilaya record
- **Address textarea**: For detailed delivery address
- **Payment method**: COD by default (landing pages use COD as the primary method)
- **Phone validation**: Same 05/06/07 + 10 digit Algerian format
- **Form submission**: Actually creates an order in the `orders` table with `landing_page_id` set, plus `order_items` for the product

The form section at the bottom of the landing page preview will be a live React component (not static HTML), using the same Supabase queries as CheckoutPage.

## 3. Auto-Generate Multiple AI Images

When the user clicks "Generate Landing Page" (step 2), the system will:

1. Call `generate-landing` for text content (as before)
2. Simultaneously fire 3 parallel calls to `generate-landing-image` with contextual prompts:
   - **Prompt 1**: Product in its natural environment (e.g., clothes being worn, kitchen tools in a kitchen)
   - **Prompt 2**: Close-up detail shot highlighting quality/texture
   - **Prompt 3**: Lifestyle shot showing the product in use

The prompts are auto-generated based on the product category:
- Clothes/Fashion: "Person wearing [product], lifestyle photography"
- Electronics: "[Product] on a modern desk, tech setup"
- Kitchen: "[Product] in a beautiful kitchen, cooking scene"
- Generic fallback: "[Product] in its natural environment, professional photography"

All generated images are used in the landing page:
- Image 1: Hero background
- Image 2: Product details section
- Image 3: A secondary section or gallery strip

## 4. Save Landing Pages

- Add a "Save" button in the toolbar (step 3)
- Saves to `landing_pages` table with all content, images, and settings
- Add a "Saved Pages" tab/section in step 1 showing previously saved landing pages as cards
- Clicking a saved page loads it into the editor for viewing/editing
- Each saved page gets a shareable preview link

## 5. Orders Tracking

### In the landing page form
When a customer submits the order form on the landing page:
- Insert into `orders` with `landing_page_id` set to the saved landing page ID
- Insert into `order_items` with the product details
- Show a success message

### In AdminOrdersPage
- Add a new filter option: "Source" with values "All", "Website", "Landing Page"
- Orders with `landing_page_id IS NOT NULL` are "Landing Page" orders
- Show a small badge/icon on landing page orders in the table
- Optionally show which landing page it came from

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/AdminLandingPagePage.tsx` | Major rewrite: real checkout form with wilayas/baladiyat, auto 3-image generation, save functionality, saved pages list |
| `src/pages/admin/AdminOrdersPage.tsx` | Add "source" filter (Website vs Landing Page), landing page badge on orders |
| `src/i18n/locales/ar.ts` | New keys for save, source filter, baladiya labels |
| `src/i18n/locales/en.ts` | Same |
| `src/i18n/locales/fr.ts` | Same |

## Database Migration

```sql
-- Landing pages table
CREATE TABLE public.landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  title text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'ar',
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  selected_image text,
  generated_images text[] DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage landing_pages"
  ON public.landing_pages FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Landing pages publicly readable"
  ON public.landing_pages FOR SELECT
  USING (true);

-- Add landing_page_id to orders
ALTER TABLE public.orders ADD COLUMN landing_page_id uuid;
```

