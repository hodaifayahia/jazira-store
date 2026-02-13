

# Overhaul Landing Page: New Premium Template + Full Prompt Integration

## Root Cause

The landing page generation works in two parts:
1. **Edge function** generates structured JSON content (text, headlines, etc.)
2. **Frontend template** renders that JSON into HTML sections

Currently, the template only renders: Hero, Trust Bar, Benefits, Product Details, Gallery, Testimonials, FAQ, Urgency. Your prompt asks for many more sections (counters, Before/After, authority logos, hotspots, etc.), but the template ignores them because those fields don't exist in the JSON schema or the rendering code.

## Plan

### 1. Expand the AI Generation Schema

Add new fields to the `generate-landing` edge function's tool schema and prompt:

- `social_proof_stats`: Array of animated counter items (e.g., "50,000+ Sold", "98% Satisfaction", "30-Day Guarantee")
- `before_after`: Object with `before_text`, `after_text`, and `switch_line` (e.g., "See why 2,400+ customers made the switch")
- `authority_text`: "As featured in..." section text
- `how_it_works`: 3-step timeline array with icon, title, description
- `guarantee_text`: Money-back guarantee badge text

Keep existing fields (headline, subheadline, benefits, testimonials, faq, urgency_text).

### 2. Redesign the Frontend Template (Both Admin + Public)

Update both `AdminLandingPagePage.tsx` and `LandingPage.tsx` to render a premium template with these sections in order:

1. **Hero** -- Split layout with floating product image + headline + glowing CTA + micro social-proof strip ("4.9/5 from 2,400+ reviews") + animated gradient background
2. **Trust Bar** -- Keep existing (Fast Delivery, Secure Payment, etc.)
3. **Before / After** -- Two side-by-side cards showing transformation with a compelling one-liner below
4. **Benefits** -- Keep existing grid but add subtle hover animations
5. **Authority & Social Validation** -- Grayscale logo strip placeholder + animated number counters (e.g., "50,000+ Sold")
6. **Product Details** -- Keep existing with product image + description
7. **How It Works** -- 3-step horizontal timeline with icons
8. **Testimonials** -- Keep existing with verified badge added
9. **Guarantee Badge** -- "100% Money-Back Guarantee" section
10. **FAQ** -- Keep existing accordion style
11. **Urgency Banner** -- Keep existing
12. **Order Form** -- Keep existing (outside contentEditable in admin)

### 3. Redeploy the Edge Function

Deploy the updated `generate-landing` function so the new prompt and schema are active.

### 4. Add Premium CSS Animations

Add to both admin preview and public page:
- Scroll-triggered fade-in/slide-up animations (using IntersectionObserver)
- Animated number counters that count up when visible
- Subtle gradient shifts on the hero section
- Hover effects on benefit cards and testimonial cards

## Technical Details

### Updated Edge Function Schema (new fields)

```text
social_proof_stats: [
  { number: "50,000+", label: "Products Sold" },
  { number: "98%", label: "Customer Satisfaction" },
  { number: "30", label: "Day Guarantee" }
]

before_after: {
  before_text: "Before using [Product]...",
  after_text: "After 30 days with [Product]...",
  switch_line: "See why 2,400+ customers made the switch."
}

how_it_works: [
  { icon: "1", title: "Order", description: "Place your order in seconds" },
  { icon: "2", title: "Receive", description: "Fast delivery to your door" },
  { icon: "3", title: "Enjoy", description: "Experience the transformation" }
]

guarantee_text: "100% Money-Back Guarantee - No Questions Asked"
authority_text: "Trusted by 50,000+ customers across Algeria"
```

### Files Modified

| File | Changes |
|------|---------|
| `supabase/functions/generate-landing/index.ts` | Add new fields to schema, enhance prompt sections |
| `src/pages/admin/AdminLandingPagePage.tsx` | Add new template sections (Before/After, Counters, How It Works, Guarantee), add animations, update LandingContent interface |
| `src/pages/LandingPage.tsx` | Mirror all new template sections, add scroll animations, update LandingContent interface |

### Animation Approach

Using a lightweight IntersectionObserver pattern (no dependencies):

```text
// On each section wrapper:
// - Start with opacity: 0, transform: translateY(30px)
// - When intersecting viewport: transition to opacity: 1, translateY(0)
// - Counter sections: animate numbers from 0 to target using requestAnimationFrame
```

