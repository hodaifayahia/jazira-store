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

    const systemPrompt = `You are an expert copywriter and landing page designer. You create high-converting, persuasive, and emotionally engaging product landing page content. All output MUST be in ${langName}. The content should feel premium, luxurious, and trustworthy. Use power words, create urgency, and highlight benefits over features. Make the copy feel natural, not AI-generated.`;

    const userPrompt = `Create landing page content for this product:
- Product: ${productName}
- Price: ${price} DA${oldPrice ? ` (was ${oldPrice} DA)` : ""}
- Category: ${category || "General"}
- Description: ${description || shortDescription || "No description provided"}

Generate compelling landing page content using the suggest_landing_content function.`;

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
                  headline: { type: "string", description: "Catchy hero headline, max 10 words" },
                  subheadline: { type: "string", description: "Supporting text, 1-2 sentences" },
                  description: { type: "string", description: "3-4 paragraph persuasive product description, SEO-optimized" },
                  benefits: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        icon: { type: "string", description: "Emoji icon" },
                        title: { type: "string", description: "Short benefit title" },
                        text: { type: "string", description: "1-2 sentence benefit description" },
                      },
                      required: ["icon", "title", "text"],
                      additionalProperties: false,
                    },
                    description: "4-6 key benefits",
                  },
                  cta_primary: { type: "string", description: "Main CTA button text" },
                  cta_secondary: { type: "string", description: "Secondary CTA button text" },
                  testimonials: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        text: { type: "string" },
                        rating: { type: "number" },
                      },
                      required: ["name", "text", "rating"],
                      additionalProperties: false,
                    },
                    description: "3 realistic testimonial placeholders",
                  },
                  urgency_text: { type: "string", description: "Scarcity/urgency line" },
                },
                required: ["headline", "subheadline", "description", "benefits", "cta_primary", "cta_secondary", "testimonials", "urgency_text"],
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
