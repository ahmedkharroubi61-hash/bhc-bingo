// Supabase Edge Function: product-ai
// Researches a product on the web via OpenAI (Responses API + web_search tool)
// and drafts { description, howToUse, ingredients }. Admin-gated; key server-side.
import { createClient } from "jsr:@supabase/supabase-js@2";

const MODEL = "gpt-4o"; // supports the web_search tool; change to gpt-4o-mini for lower cost

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SYSTEM = `You research skincare, cosmetic and parapharmacie products for a Tunisian online store.
Search the web for the SPECIFIC product (by brand + name) and use only what you can verify.
If you cannot verify a detail, keep it general and do not invent ingredients or medical claims.
Return ONLY a minified JSON object with exactly these string keys: "description", "howToUse", "ingredients".
- description: 2-3 plain sentences.
- howToUse: short step-by-step usage, steps separated by newlines.
- ingredients: key ingredients, comma or newline separated.
No markdown, no code fences, no extra keys, no commentary.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    // 1) Require an authenticated admin (RLS helper is_admin()).
    const authHeader = req.headers.get("Authorization") ?? "";
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: isAdmin } = await sb.rpc("is_admin");
    if (isAdmin !== true) return json({ error: "Not authorised." }, 200);

    // 2) Require the OpenAI key (set by the store owner).
    const key = Deno.env.get("OPENAI_API_KEY");
    if (!key) return json({ error: "The AI key isn't set up yet. Add OPENAI_API_KEY in Supabase → Edge Functions → Secrets." }, 200);

    const { title, brand, category } = await req.json().catch(() => ({}));
    if (!title || !brand) return json({ error: "Missing product title or brand." }, 200);

    const userMsg = `Product: ${title}\nBrand: ${brand}\nCategory: ${category ?? ""}`.trim();

    // 3) OpenAI Responses API with web search.
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        tools: [{ type: "web_search_preview" }],
        input: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userMsg },
        ],
      }),
    });

    const j = await r.json();
    if (!r.ok) {
      return json({ error: j?.error?.message ?? `OpenAI error (${r.status}).` }, 200);
    }

    // Extract the assistant's text.
    let text: string = j.output_text ?? "";
    if (!text && Array.isArray(j.output)) {
      text = j.output
        .flatMap((o: { content?: { type: string; text?: string }[] }) => o.content ?? [])
        .filter((c: { type: string }) => c.type === "output_text")
        .map((c: { text?: string }) => c.text ?? "")
        .join("\n");
    }

    const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    let parsed: { description?: string; howToUse?: string; ingredients?: string } = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { description: cleaned }; // fall back: put raw text in description for the admin to edit
    }

    return json({
      description: parsed.description ?? "",
      howToUse: parsed.howToUse ?? "",
      ingredients: parsed.ingredients ?? "",
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unexpected error." }, 200);
  }
});
