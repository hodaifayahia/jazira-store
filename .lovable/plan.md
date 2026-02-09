

## Plan: Center the Hero Section Content

The hero section currently aligns all content (title, subtitle, search bar, CTA buttons) to the right side using `max-w-xl`. The user wants everything centered on the page instead.

### Changes in `src/pages/Index.tsx`

**Lines 97-145 (Hero content container):**

1. Change the inner container from `max-w-xl` (right-aligned) to `max-w-2xl mx-auto text-center` so all content is horizontally centered.
2. Center the badge (`span`) -- already inline-block, will center with `text-center`.
3. Center the search form: change `max-w-md` to `max-w-md mx-auto` and keep `flex gap-2`.
4. Center the CTA buttons row: add `justify-center` to the flex wrapper.
5. Center the subtitle paragraph: add `mx-auto` to `max-w-md`.

### Technical Details

- File: `src/pages/Index.tsx`
- Lines affected: ~97-145 (hero section inner content)
- No other files or database changes needed
- The gradient overlay and background image remain unchanged
