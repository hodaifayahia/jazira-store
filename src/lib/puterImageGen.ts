import { supabase } from '@/integrations/supabase/client';
import { ensurePuterLoaded, getPuter } from './puterClient';

/**
 * Generate an image using Gemini Free Tier (primary) or Puter.js (fallback).
 * Returns the public URL of the uploaded image.
 */
export async function generateImageWithPuter(prompt: string): Promise<string> {
  // Try Gemini edge function first
  try {
    const res = await supabase.functions.invoke('gemini-image', {
      body: { prompt },
    });

    if (res.error) throw res.error;
    if (res.data?.url) return res.data.url;
    throw new Error('No URL in response');
  } catch (err: any) {
    console.warn('Gemini image gen failed, falling back to Puter.js:', err.message);
  }

  // Fallback to Puter.js
  await ensurePuterLoaded();
  const puter = getPuter();

  const models = ['dall-e-3', 'flux-schnell'];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const result = await puter.ai.txt2img(prompt, { model });
      const response = await fetch(result.src);
      const blob = await response.blob();

      const fileName = `puter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
      const filePath = `generated/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, blob, { contentType: 'image/png', upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (err: any) {
      lastError = err;
      console.warn(`Puter image gen failed with model ${model}:`, err.message);
      continue;
    }
  }

  throw lastError || new Error('All image generation methods failed');
}
