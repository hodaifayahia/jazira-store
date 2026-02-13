

# Switch Image Generation to Puter.js (Free, No Credits Needed)

## Why

The current edge function uses Lovable AI Gateway for image generation, which has credit limits (causing the 402 error). Puter.js provides free, unlimited image generation directly from the browser -- no API keys, no server needed, no credits to run out.

## How It Works

Puter.js is a client-side JavaScript library. Instead of calling the `generate-landing-image` edge function, the admin page will generate images directly in the browser using `puter.ai.txt2img()`, then upload the resulting blob to storage via the existing Supabase client.

## Changes

### 1. Add Puter.js Script Tag to `index.html`
Add `<script src="https://js.puter.com/v2/"></script>` to the HTML head so the `puter` global is available.

### 2. Create a Helper: `src/lib/puterImageGen.ts`
A small utility that wraps Puter.js image generation + Supabase storage upload:
- Calls `puter.ai.txt2img(prompt, { model: 'dall-e-3' })` to generate the image
- Uploads the resulting blob to the `products` storage bucket
- Returns the public URL
- Handles errors gracefully with fallback models

### 3. Update `src/pages/admin/AdminLandingPagePage.tsx`
Replace all `supabase.functions.invoke('generate-landing-image', ...)` calls (4 occurrences) with the new Puter.js helper function. The logic stays the same -- only the image source changes.

### 4. Keep the Edge Function (No Delete)
The edge function `generate-landing-image` stays in place as a fallback but will no longer be the primary method. This means if Puter.js fails for any reason, a retry via edge function is still possible.

## Technical Details

### Puter.js API Usage
```text
// Available globally after script inclusion
const result = await puter.ai.txt2img(prompt, { model: 'dall-e-3' });
// result is an HTML Image element with src as a blob URL
// Convert to blob, upload to storage
```

### Models Available (free)
- `dall-e-3` (recommended -- high quality)
- `gpt-image-1` (OpenAI's latest)
- `flux-schnell` (fast)

### File Changes Summary

| File | Change |
|------|--------|
| `index.html` | Add Puter.js script tag |
| `src/lib/puterImageGen.ts` | New helper for Puter image generation + upload |
| `src/pages/admin/AdminLandingPagePage.tsx` | Replace 4 edge function calls with Puter.js helper |
| `src/vite-env.d.ts` | Add type declaration for the global `puter` object |

