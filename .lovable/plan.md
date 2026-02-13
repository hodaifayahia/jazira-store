
# Enhance Transformation Section + Testimonials Design

## 1. Transformation Section -- Add Generated Image

Currently the Before/After section shows two small text-only cards (red/green). The upgrade will:

- **Generate a transformation image** using the existing `generate-landing-image` edge function when the landing page is created
- Add a new field `before_after.image_url` to store the generated transformation image URL
- Display a **large, full-width transformation image** above the Before/After text cards
- The image prompt will be crafted based on the product context (e.g., "Before and after transformation showing the impact of [product name], split comparison, professional photography")
- In the admin page, add a "Generate Transformation Image" button so admins can regenerate it
- The image will be stored in the `before_after` content object alongside the text

### Layout Change (Before/After Section)
```text
+--------------------------------------------------+
|  Section Title: "The Transformation"              |
|                                                   |
|  +--------------------------------------------+  |
|  |                                              | |
|  |    Large Generated Transformation Image      | |
|  |    (full-width, rounded, with shadow)        | |
|  |                                              | |
|  +--------------------------------------------+  |
|                                                   |
|  +-- Before Card --+    +-- After Card --+        |
|  |  (red/pain)     |    | (green/gain)   |        |
|  +-----------------+    +----------------+        |
|                                                   |
|  "See why 2,400+ customers made the switch"       |
+--------------------------------------------------+
```

## 2. Testimonials Section -- Premium Redesign

Current design: simple white cards with stars, italic text, name + verified badge. The upgrade adds:

- **Avatar circle** with the customer's initials (colored gradient background, generated from name)
- **Quote icon** (large decorative quote mark) at the top of each card
- **Card elevation** with gradient left border (orange accent)
- **Bottom row** with avatar + name + verified badge in a more polished layout
- **Hover effect** with subtle lift and shadow increase
- **Star rating** moved below the quote for better visual flow

### New Testimonial Card Layout
```text
+----------------------------------------+
|  "  (large decorative quote mark)      |
|                                         |
|  "Review text here, specific and        |
|   detailed about the product..."        |
|                                         |
|  ★★★★★                                 |
|                                         |
|  [Avatar] Name                          |
|           Verified Purchase badge       |
+----------------------------------------+
  (left border: orange gradient accent)
```

## Technical Details

### Files Modified

| File | Changes |
|------|------|
| `src/pages/LandingPage.tsx` | Add `before_after.image_url` rendering, redesign testimonial cards with avatar initials + quote icon + gradient border |
| `src/pages/admin/AdminLandingPagePage.tsx` | Same visual changes + "Generate Transformation Image" button that calls `generate-landing-image` with a transformation prompt |
| `supabase/functions/generate-landing/index.ts` | Add `image_url` field to `before_after` schema (optional, will be populated client-side after image generation) |

### Interface Change
```text
before_after: {
  before_text: string;
  after_text: string;
  switch_line: string;
  image_url?: string;  // NEW: generated transformation image
}
```

### Transformation Image Generation
When generating a landing page, after the text content is generated, the admin page will automatically call `generate-landing-image` with a transformation-specific prompt like:
- "Before and after transformation showing the dramatic impact of [product name], split screen comparison, professional lifestyle photography, 4K"

The admin can also click a button to regenerate this image independently.

### Avatar Generation (Testimonials)
No API call needed -- avatars will be generated from name initials with deterministic gradient colors based on the name string hash. For example:
- "Ahmed B." gets initials "AB" on a blue-purple gradient circle
- "Sarah M." gets initials "SM" on a green-teal gradient circle
