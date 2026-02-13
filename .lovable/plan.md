

# Use Google Gemini Free Tier for Image Generation

## Why

Puter.js image generation can be unreliable. Google offers a free tier for Gemini API (including the image generation model `gemini-2.0-flash-exp`) with no credit card required -- just a free API key from Google AI Studio.

## How It Works

We'll create an edge function that calls the Gemini API directly using a free Google AI API key (separate from the Lovable AI Gateway). The free tier provides 15 requests per minute which is plenty for landing page generation.

## Steps

### 1. Get a Free Google AI API Key
- Go to https://aistudio.google.com/apikey
- Click "Create API Key" (free, no credit card needed)
- Copy the key -- you'll be asked to paste it as a secret

### 2. Create Edge Function: `supabase/functions/gemini-image/index.ts`
A new edge function that:
- Receives a prompt from the frontend
- Calls Gemini's image generation API (`gemini-2.0-flash-exp` with `responseModalities: ["IMAGE"]`)
- Receives the base64 image in the response
- Uploads it to the `products` storage bucket
- Returns the public URL

### 3. Update `src/lib/puterImageGen.ts`
- Try the Gemini edge function first (primary)
- Fall back to Puter.js if it fails (secondary)
- Same function signature -- no other files need changing

### 4. Store API Key as Secret
The Google AI API key will be stored as `GOOGLE_AI_API_KEY` so it stays secure on the server.

## Technical Details

### Gemini Image Generation API
```text
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=API_KEY
{
  "contents": [{ "parts": [{ "text": "Generate an image of..." }] }],
  "generationConfig": { "responseModalities": ["IMAGE"] }
}

// Response contains base64 image data in:
// response.candidates[0].content.parts[0].inline_data.data
```

### Fallback Chain
Gemini Free Tier (primary) --> Puter.js (fallback) --> Error

### File Changes Summary

| File | Change |
|------|--------|
| `supabase/functions/gemini-image/index.ts` | New edge function for Gemini image API |
| `src/lib/puterImageGen.ts` | Call edge function first, Puter.js as fallback |
| `supabase/config.toml` | Register new function with `verify_jwt = false` |
| Secret: `GOOGLE_AI_API_KEY` | Free API key from Google AI Studio |

