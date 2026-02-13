

# Move Landing Page Text Generation to Puter.js (Free)

## Problem

The `generate-landing` edge function uses the Lovable AI Gateway for generating landing page text content, which is returning a 402 "Credits exhausted" error. Images were already switched to Puter.js, but the text generation still relies on the paid gateway.

## Solution

Replace the edge function call with Puter.js `puter.ai.chat()` directly in the browser. Puter.js provides free, unlimited access to AI text models (GPT-4o, Claude, etc.) with no API keys needed.

## Changes

### 1. Create Helper: `src/lib/puterTextGen.ts`
A new utility that:
- Takes the same product data (name, price, description, category, language)
- Calls `puter.ai.chat()` with the same system/user prompts currently in the edge function
- Parses the JSON response into the same structured landing page content format
- Includes error handling and retry logic

### 2. Update `src/pages/admin/AdminLandingPagePage.tsx`
Replace line 287's `supabase.functions.invoke('generate-landing', ...)` call with the new Puter.js text generation helper. The rest of the flow (setting content, step progression, etc.) stays identical.

### 3. Update Type Declaration: `src/vite-env.d.ts`
Add `chat()` method to the existing `PuterAI` interface.

### 4. Keep the Edge Function (No Delete)
The `generate-landing` edge function stays as-is for potential future use but won't be called.

## Technical Details

### Puter.js Chat API
```text
const response = await puter.ai.chat(prompt, { model: 'gpt-4o' });
// response.message.content contains the text response
```

Since Puter.js chat doesn't support tool_choice/function calling natively, the prompt will instruct the AI to return a JSON object directly, and the helper will parse it.

### Prompt Strategy
The same system and user prompts from the edge function will be reused, but instead of using OpenAI function calling, the prompt will end with: "Return ONLY a valid JSON object with the following structure: {...}" -- this ensures clean parseable output.

### File Changes Summary

| File | Change |
|------|--------|
| `src/lib/puterTextGen.ts` | New helper for Puter.js text generation |
| `src/pages/admin/AdminLandingPagePage.tsx` | Replace edge function call with Puter.js helper |
| `src/vite-env.d.ts` | Add `chat()` method to PuterAI interface |

