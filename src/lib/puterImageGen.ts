import { supabase } from '@/integrations/supabase/client';

declare const puter: any;

/**
 * Generate an image using Puter.js (free, client-side) and upload to Supabase storage.
 * Returns the public URL of the uploaded image.
 */
export async function generateImageWithPuter(prompt: string): Promise<string> {
  if (typeof puter === 'undefined') {
    throw new Error('Puter.js is not loaded. Please refresh the page.');
  }

  const models = ['dall-e-3', 'flux-schnell'];

  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const result = await puter.ai.txt2img(prompt, { model });

      // result is an HTMLImageElement with a blob URL src
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

  throw lastError || new Error('All image generation models failed');
}
