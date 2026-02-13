

# Fix Landing Page: Variations, Delivery/Order Bugs, and Enhanced Generation

## Problems Identified

### Bug 1: Product Variations Missing from Form
The landing page order form (both admin preview and public `/lp/:id`) does not fetch or display product variations/variants. When a product has options (Size, Color, etc.), customers cannot select them.

### Bug 2: Delivery Type Buttons & Order Submit Not Working
The delivery type buttons (`office`/`home`) and the "Confirm Order" button in the admin preview form use `onClick` handlers that update state, but the form is inside the `contentEditable` preview container (`previewRef`). React event handlers inside a `contentEditable` parent can be swallowed or interfered with. Additionally, the `handleOrderSubmit` function requires `savedPageId` to be set before submission, but a user testing in the admin preview may not have saved yet.

### Bug 3: Landing Page Generation Needs Enhancement
The prompt requests a more "magical" experience with AI vision analysis, auto-generated contextual images, and a richer template.

---

## Plan

### 1. Add Product Variations to the Order Form

**Files: `src/pages/admin/AdminLandingPagePage.tsx`, `src/pages/LandingPage.tsx`**

- Fetch `product_option_groups` + `product_option_values` + `product_variants` for the selected product (same queries as SingleProductPage)
- Also fetch legacy `product_variations` for backward compatibility
- Add variant selection UI in the order form section:
  - For new variant system (`has_variants`): Show option group buttons (Color, Size, etc.) with availability checking against `product_variants`
  - For legacy variations: Show grouped buttons by `variation_type`
- Selected variant affects the displayed price and is included in the order submission (`variant_id` in `order_items`)
- Both admin preview form and public `/lp/:id` form get this treatment

### 2. Fix Delivery Type & Order Submit Bugs

**Files: `src/pages/admin/AdminLandingPagePage.tsx`, `src/pages/LandingPage.tsx`**

- Move the order form section OUTSIDE the `contentEditable` preview container (`previewRef`) in the admin page. Render it as a separate React component below the preview, so React event handlers work properly
- Remove the `savedPageId` requirement from `handleOrderSubmit` -- allow orders even before saving (use `null` for `landing_page_id` if not saved)
- Wrap all async handlers (`handleOrderSubmit`, delivery type clicks) in proper `try...catch` blocks
- In `LandingPage.tsx`: The delivery type buttons already work (they're native HTML buttons outside contentEditable), but add better error feedback -- show validation errors inline instead of silently failing
- Add proper form validation with visible error messages for both files

### 3. Enhance Landing Page Generation with Better Prompt

**File: `supabase/functions/generate-landing/index.ts`**

- Enhance the system prompt to instruct the AI to:
  - Analyze the product deeply (type, style, target audience, emotional vibe)
  - Generate more compelling, emotionally-driven copy
  - Create content that feels like a premium luxury brand
  - Include FAQ section content in the generated JSON (add `faq` field)
- Add a `faq` field to the tool schema (array of question/answer pairs)

**File: `src/pages/admin/AdminLandingPagePage.tsx`**

- Add FAQ section to the landing page template (between testimonials and urgency banner)
- Update `LandingContent` interface to include `faq`

**File: `src/pages/LandingPage.tsx`**

- Add FAQ section rendering to the public page as well

### 4. Auto-Generate Images with Product Context

The current image generation already fires 3 parallel prompts based on category. Enhance the prompts in `getImagePrompts()` to be more specific:
- Use the product description to make prompts more contextual
- For clothing: explicitly request "person wearing" shots
- For products: explicitly request "product in its environment" shots
- Pass the product's existing image URL to the AI for reference (edit mode) if available

### 5. Update i18n Keys

**Files: `src/i18n/locales/ar.ts`, `en.ts`, `fr.ts`**

- Add keys for: variation selection labels, FAQ section title, form validation error messages

---

## Technical Details

### Variant Selection in Landing Form

```text
-- Fetch chain for a product with variants:
1. product_option_groups (by product_id) -> get group names (e.g., "Size", "Color")
2. product_option_values (by option_group_id) -> get values (e.g., "S", "M", "L")
3. product_variants (by product_id, is_active) -> get available combinations with prices

-- On form submit, include variant_id in order_items:
INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price)
```

### Order Form Extraction from Preview

The admin preview's order form will be rendered as a separate `<div>` AFTER the `previewRef` container, not inside it. This ensures all React event handlers (onClick, onChange) work correctly since they won't be inside a `contentEditable` ancestor.

### Files Modified Summary

| File | Changes |
|------|---------|
| `src/pages/admin/AdminLandingPagePage.tsx` | Move form outside preview, add variant selection, fix order submit, add FAQ section, enhance image prompts |
| `src/pages/LandingPage.tsx` | Add variant selection, fix validation errors display, add FAQ section |
| `supabase/functions/generate-landing/index.ts` | Enhanced prompt, add FAQ to schema |
| `src/i18n/locales/ar.ts` | New keys for variants, FAQ, validation |
| `src/i18n/locales/en.ts` | Same |
| `src/i18n/locales/fr.ts` | Same |

