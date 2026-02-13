

# Create Landing Page Builder

## Overview
Add a new "Landing Page Builder" feature in the admin sidebar that lets users select a product, choose a language, and use AI to generate a complete, editable, high-converting landing page -- all in minutes.

## Architecture

### New Files
| File | Purpose |
|------|---------|
| `src/pages/admin/AdminLandingPagePage.tsx` | Main page with product selector, language picker, AI generation, and live editor |
| `supabase/functions/generate-landing/index.ts` | Edge function that calls Lovable AI to generate landing page content (headline, description, benefits, CTA text, testimonial placeholders) |

### Modified Files
| File | Change |
|------|--------|
| `src/components/AdminLayout.tsx` | Add "Landing Page" item to `NAV_KEYS` sidebar array |
| `src/App.tsx` | Add route `/admin/landing` with the new page |
| `src/i18n/locales/ar.ts` | Add ~15 new translation keys |
| `src/i18n/locales/en.ts` | Add ~15 new translation keys |
| `src/i18n/locales/fr.ts` | Add ~15 new translation keys |
| `supabase/config.toml` | Register the new edge function |

No database migration needed -- landing pages are generated on-the-fly and rendered client-side. Users can copy the final HTML or share a preview link.

---

## Step-by-Step Flow

### 1. Sidebar Entry
A new item with a `FileText` (or `Rocket`) icon labeled "صفحة هبوط" / "Landing Page" / "Page d'atterrissage" is added to the admin sidebar between "Coupons" and "Settings".

### 2. Product Selection (Step 1 of the wizard)
- Fetch all products from the `products` table
- Display a searchable dropdown (using the existing `Select` component) showing product name + thumbnail
- On selection, show the product's images in a grid so the user can pick the primary image
- The image with the highest resolution is pre-selected (based on `main_image_index`), but the user can click any other image to override

### 3. Language Selection (Step 2)
- A dropdown with: Arabic, English, French, Spanish, German, Turkish
- Defaults to the current admin language

### 4. AI Content Generation (Step 3)
- On clicking "Generate", the frontend calls the `generate-landing` edge function with:
  - Product name, price, old price, description, short description, category
  - Selected language code
- The edge function uses Lovable AI (`google/gemini-3-flash-preview`) with a carefully crafted system prompt to return structured JSON via tool calling:
  - `headline` (catchy hero headline)
  - `subheadline` (supporting text)
  - `description` (3-4 paragraph persuasive copy, SEO-optimized)
  - `benefits` (array of 4-6 benefit objects with icon hint + title + text)
  - `cta_primary` (main button text)
  - `cta_secondary` (secondary button text)
  - `testimonial_placeholders` (2-3 fake but realistic review quotes)
  - `urgency_text` (scarcity/urgency line)
- A loading state shows a skeleton preview while AI generates

### 5. Live Preview + Inline Editing (Step 4)
- The generated content is rendered in a beautiful, responsive landing page preview
- Layout sections:
  - **Hero**: Full-width product image with headline overlay, gradient, and CTA button
  - **Benefits**: Icon grid (3 columns on desktop, 1 on mobile) with benefit cards
  - **Product Details**: Large image + AI description side by side
  - **Social Proof**: Testimonial cards in a row
  - **Urgency Banner**: Countdown or limited stock message
  - **Final CTA**: Large button with price display
- Every text element is wrapped in a `contentEditable` div (or uses a simple inline editing approach) so the user can click and type to refine any copy
- A "Regenerate" button lets the user re-run AI for fresh content
- An "Export HTML" button copies the full self-contained HTML to clipboard
- A "Preview in new tab" button opens the landing page in a new browser tab

### 6. Sharing
- The generated landing page includes the product link back to the store's product page for the CTA buttons
- The exported HTML is fully self-contained with inline styles (Tailwind classes compiled to inline) for use anywhere

---

## Technical Details

### Edge Function: `generate-landing`

```text
POST /functions/v1/generate-landing
Body: { productName, price, oldPrice, description, category, language }
Response: { headline, subheadline, description, benefits[], cta_primary, cta_secondary, testimonials[], urgency_text }
```

- Uses `LOVABLE_API_KEY` (already configured)
- Uses tool calling to get structured JSON output
- Model: `google/gemini-3-flash-preview`
- Handles 429/402 errors gracefully
- `verify_jwt = false` in config.toml (auth checked in code)

### Landing Page Component
- Rendered as a React component with state for each editable field
- Uses `useState` for each text block so edits are reactive
- Styled with Tailwind classes for a modern, premium look
- Mobile-responsive with proper breakpoints
- RTL support for Arabic

### Inline Editing Approach
- Each text element uses `contentEditable="true"` with `onBlur` to capture changes
- A subtle pencil icon appears on hover to indicate editability
- Changes update local state only (no database persistence needed)

