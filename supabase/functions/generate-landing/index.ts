import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, price, oldPrice, description, shortDescription, category, language } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const langMap: Record<string, string> = {
      ar: "Arabic",
      en: "English",
      fr: "French",
      es: "Spanish",
      de: "German",
      tr: "Turkish",
    };
    const langName = langMap[language] || "English";

    const systemPrompt = `You are a world-class direct-response copywriter and landing page strategist specializing in high-converting e-commerce pages. Your mission: create landing page content that feels like it was crafted by a premium agency — emotionally compelling, psychologically persuasive, and irresistibly engaging.

CRITICAL RULES:
- ALL output text MUST be in ${langName} — every word, headline, benefit, testimonial, FAQ
- Write like a top-tier brand (think Apple, Nike, Dyson) — premium, aspirational, confident
- Focus on BENEFITS and TRANSFORMATION, not just features
- Use power words that trigger emotion: exclusive, premium, transform, unleash, discover, revolutionary
- Create urgency without being sleazy
- Make testimonials feel real and specific (include product details, timeframes)
- The copy should make the reader FEEL something — desire, excitement, FOMO
- Keep it culturally appropriate for the ${langName}-speaking market`;

    const userPrompt = `Deeply analyze this product and create a stunning, high-converting landing page:

PRODUCT ANALYSIS:
- Product: ${productName}
- Price: ${price} DA${oldPrice ? ` (original: ${oldPrice} DA — ${Math.round((1 - price/oldPrice) * 100)}% OFF!)` : ""}
- Category: ${category || "General"}
- Description: ${description || shortDescription || "Premium quality product"}

YOUR TASK:
1. First, mentally analyze: What type of person buys this? What problem does it solve? What desire does it fulfill? What emotional trigger works best?
2. Then generate compelling content that speaks directly to that buyer's heart
3. Make every word count — this page needs to CONVERT

Generate the content using the suggest_landing_content function. Remember: ALL text in ${langName}.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_landing_content",
              description: "Return structured landing page content",
              parameters: {
                type: "object",
                properties: {
                  headline: { type: "string", description: "Bold, attention-grabbing hero headline. Max 10 words. Must create instant desire." },
                  subheadline: { type: "string", description: "Supporting text that amplifies the headline. 1-2 sentences max. Builds on the emotional promise." },
                  description: { type: "string", description: "3-4 paragraph persuasive product description. Lead with the transformation/benefit, then features. Use sensory language. SEO-optimized." },
                  benefits: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        icon: { type: "string", description: "Single relevant emoji" },
                        title: { type: "string", description: "Short, punchy benefit title (3-5 words)" },
                        text: { type: "string", description: "1-2 sentence benefit description focusing on transformation" },
                      },
                      required: ["icon", "title", "text"],
                      additionalProperties: false,
                    },
                    description: "4-6 key benefits. Focus on what the customer GAINS, not what the product HAS.",
                  },
                  cta_primary: { type: "string", description: "Main CTA button text — action-oriented, urgent (e.g., 'Get Yours Now')" },
                  cta_secondary: { type: "string", description: "Secondary CTA — softer action (e.g., 'Learn More')" },
                  testimonials: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Realistic first name + last initial" },
                        text: { type: "string", description: "Specific, believable review mentioning the product by name and a concrete benefit they experienced" },
                        rating: { type: "number", description: "Rating 4-5" },
                      },
                      required: ["name", "text", "rating"],
                      additionalProperties: false,
                    },
                    description: "3 realistic, specific testimonials that address different buyer concerns",
                  },
                  urgency_text: { type: "string", description: "Scarcity/urgency line that creates FOMO without being fake" },
                  faq: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string", description: "Common buyer question or objection" },
                        answer: { type: "string", description: "Clear, reassuring answer that overcomes the objection" },
                      },
                      required: ["question", "answer"],
                      additionalProperties: false,
                    },
                    description: "3-4 FAQ items addressing common objections: shipping, quality, returns, payment",
                  },
                },
                required: ["headline", "subheadline", "description", "benefits", "cta_primary", "cta_secondary", "testimonials", "urgency_text", "faq"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_landing_content" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No content generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(content), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-landing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
