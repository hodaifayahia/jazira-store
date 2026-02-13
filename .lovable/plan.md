

# Switch Image Generation to Prodia API (Free Tier)

## Why

Puter.js image generation may be unreliable or failing. Prodia offers the fastest free image generation API (190ms latency) with a generous free tier -- no credit card required.

## How It Works

Prodia provides a simple REST API. We'll create an edge function to call it (keeping the API key secure on the server), and update the frontend to use it. The free tier provides plenty of generations for landing page use.

## Steps

### 1. Get Prodia API Key (Free)
You'll need to sign up at https://prodia.com and get a free API key. It takes 30 seconds -- no credit card needed.

### 2. Create Edge Function: `supabase/functions/prodia-image/index.ts`
A lightweight edge function that:
- Receives a prompt from the frontend
- Calls Prodia's API to generate an image (using SDXL or Flux Schnell model)
- Waits for the job to complete (usually under 1 second)
- Downloads the result and uploads it to storage
- Returns the public URL

### 3. Update `src/lib/puterImageGen.ts`
Replace the Puter.js logic with a call to the new edge function. Keep the same function signature so no other files need changing. The function will:
- Call the `prodia-image` edge function with the prompt
- Return the public URL from storage
- Fall back to Puter.js if the edge function fails

### 4. Store API Key as Secret
The Prodia API key will be stored as a secret (`PRODIA_API_KEY`) so it's never exposed in frontend code.

## Technical Details

### Prodia API Call (inside edge function)
```text
// 1. Create job
POST https://inference.prodia.com/v2/job
{
  "type": "inference.flux-fast.schnell.txt2img.v2",
  "config": { "prompt": "..." }
}

// 2. Poll until complete, then download image
GET https://inference.prodia.com/v2/job/{jobId}
// When status is "succeeded", image URL is available
```

### Fallback Chain
Prodia (primary) -> Puter.js (fallback) -> Error

### File Changes Summary

| File | Change |
|------|--------|
| `supabase/functions/prodia-image/index.ts` | New edge function for Prodia API |
| `src/lib/puterImageGen.ts` | Update to call edge function, keep Puter.js as fallback |
| Secret: `PRODIA_API_KEY` | Store free API key securely |

