// Supabase Edge Function: product-ai
// Researches a product on the web via Google Gemini (free tier, with Google
// Search grounding) and drafts { description, howToUse, ingredients }.
// Admin-gated; key server-side (GEMINI_API_KEY).
import { createClient } from "jsr:@supabase/supabase-js@2";

const MODEL = "gemini-3.6-flash"; // free tier, supports Google Search grounding

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

    // 2) Require the Gemini key (set by the store owner).
    const key = Deno.env.get("GEMINI_API_KEY");
    if (!key) return json({ error: "The AI key isn't set up yet. Add GEMINI_API_KEY in Supabase → Edge Functions → Secrets." }, 200);

    const { title, brand, category } = await req.json().catch(() => ({}));
    if (!title || !brand) return json({ error: "Missing product title or brand." }, 200);

    const userMsg = `Product: ${title}\nBrand: ${brand}\nCategory: ${category ?? ""}`.trim();

    // 3) Gemini generateContent with Google Search grounding.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: userMsg }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.4 },
      }),
    });

    const j = await r.json();
    if (!r.ok) {
      return json({ error: j?.error?.message ?? `AI error (${r.status}).` }, 200);
    }

    // Extract the model's text.
    let text = "";
    const parts = j?.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
      text = parts.map((p: { text?: string }) => p.text ?? "").join("");
    }

    const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    let parsed: { description?: string; howToUse?: string; ingredients?: string } = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { description: cleaned }; // fall back: raw text into description for the admin to edit
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
