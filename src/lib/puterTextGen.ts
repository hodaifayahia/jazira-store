import { ensurePuterLoaded, getPuter } from './puterClient';

interface LandingContentResult {
  headline: string;
  subheadline: string;
  description: string;
  benefits: { icon: string; title: string; text: string }[];
  cta_primary: string;
  cta_secondary: string;
  testimonials: { name: string; text: string; rating: number }[];
  urgency_text: string;
  faq: { question: string; answer: string }[];
  social_proof_stats: { number: string; label: string }[];
  before_after: { before_text: string; after_text: string; switch_line: string };
  how_it_works: { icon: string; title: string; description: string }[];
  guarantee_text: string;
  authority_text: string;
}

const langMap: Record<string, string> = {
  ar: 'Arabic', en: 'English', fr: 'French', es: 'Spanish', de: 'German', tr: 'Turkish',
};

export async function generateTextWithPuter(params: {
  productName: string;
  price: number;
  oldPrice?: number | null;
  description?: string | null;
  shortDescription?: string | null;
  category?: string;
  language: string;
}): Promise<LandingContentResult> {
  await ensurePuterLoaded();
  const puter = getPuter();

  const langName = langMap[params.language] || 'English';
  const discount = params.oldPrice ? `${Math.round((1 - params.price / params.oldPrice) * 100)}% OFF` : '';

  const prompt = `You are an elite landing page designer. Create landing page content for this product. ALL text MUST be in ${langName}.

PRODUCT:
- Name: ${params.productName}
- Price: ${params.price} DA${params.oldPrice ? ` (original: ${params.oldPrice} DA — ${discount})` : ''}
- Category: ${params.category || 'General'}
- Description: ${params.description || params.shortDescription || 'Premium quality product'}

Return ONLY a valid JSON object (no markdown, no code fences) with this exact structure:
{
  "headline": "Bold hero headline, max 10 words, '[Transformation] Without [Pain]' formula",
  "subheadline": "1-2 sentence emotional promise",
  "description": "3-4 paragraph persuasive description using PAS framework",
  "benefits": [{"icon": "emoji", "title": "3-5 word title", "text": "1-2 sentence description"}],
  "cta_primary": "Main CTA text",
  "cta_secondary": "Secondary CTA text",
  "testimonials": [{"name": "Realistic name", "text": "Specific review mentioning product", "rating": 5}],
  "urgency_text": "Scarcity/urgency line",
  "faq": [{"question": "...", "answer": "..."}],
  "social_proof_stats": [{"number": "50,000+", "label": "Products Sold"}],
  "before_after": {"before_text": "Pain without product", "after_text": "Transformation with product", "switch_line": "Why customers switched"},
  "how_it_works": [{"icon": "1", "title": "Step title", "description": "Step desc"}],
  "guarantee_text": "Money-back guarantee text",
  "authority_text": "Trust/authority text"
}

Requirements:
- 4-6 benefits, 3 testimonials (ratings 4-5), 4-5 FAQ items, 3 social_proof_stats, 3 how_it_works steps
- Use power words: exclusive, premium, transform, revolutionary, limited
- Apply PAS framework and Cialdini's principles
- Make it emotionally compelling and conversion-focused
- EVERY word must be in ${langName}`;

  const response = await puter.ai.chat(prompt, { model: 'gpt-4o' });
  const raw = response?.message?.content || response;

  let text = typeof raw === 'string' ? raw : JSON.stringify(raw);
  // Strip markdown code fences if present
  text = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

  try {
    return JSON.parse(text) as LandingContentResult;
  } catch {
    // Try to extract JSON from the response
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as LandingContentResult;
    }
    throw new Error('Failed to parse AI response as JSON');
  }
}
