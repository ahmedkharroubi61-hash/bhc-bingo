// Supabase Edge Function: product-ai
// Drafts { description, howToUse, ingredients } for a product via Groq
// (free API, OpenAI-compatible). Admin-gated; key server-side (GROQ_API_KEY).
// Auto-selects an available chat model so Groq's model renames don't break it.
import { createClient } from "jsr:@supabase/supabase-js@2";

// Preferred models, best first; the first one available on the account is used.
const PREFERRED = [
  "llama-3.3-70b-versatile",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "moonshotai/kimi-k2-instruct",
  "qwen/qwen3-32b",
  "llama-3.1-8b-instant",
];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SYSTEM = `You write product copy for skincare, cosmetic and parapharmacie products for a Tunisian online store.
Use what you reliably know about the given brand + product.
If you are unsure of a detail, keep it general and do not invent specific ingredients or medical claims.
Return ONLY a minified JSON object with exactly these string keys: "description", "howToUse", "ingredients".
- description: 2-3 plain sentences.
- howToUse: short step-by-step usage, steps separated by newlines.
- ingredients: key ingredients, comma or newline separated.
No markdown, no code fences, no extra keys, no commentary.`;

/** Ask Groq which models the key can use; pick the best chat model available. */
async function pickModel(key: string): Promise<string> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return PREFERRED[0];
    const body = await res.json();
    const ids: string[] = (body?.data ?? []).map((m: { id?: string }) => m.id ?? "");
    const chat = ids.filter((id) => id && !/whisper|tts|guard|embed/i.test(id));
    for (const p of PREFERRED) if (chat.includes(p)) return p;
    return chat[0] ?? PREFERRED[0];
  } catch {
    return PREFERRED[0];
  }
}

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

    // 2) Require the Groq key (set by the store owner).
    const key = Deno.env.get("GROQ_API_KEY");
    if (!key) return json({ error: "The AI key isn't set up yet. Add GROQ_API_KEY in Supabase → Edge Functions → Secrets." }, 200);

    const { title, brand, category } = await req.json().catch(() => ({}));
    if (!title || !brand) return json({ error: "Missing product title or brand." }, 200);

    const userMsg = `Product: ${title}\nBrand: ${brand}\nCategory: ${category ?? ""}`.trim();
    const model = await pickModel(key);

    // 3) Groq chat completion (OpenAI-compatible), JSON mode.
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userMsg },
        ],
      }),
    });

    const j = await r.json();
    if (!r.ok) {
      return json({ error: j?.error?.message ?? `AI error (${r.status}).` }, 200);
    }

    const text: string = j?.choices?.[0]?.message?.content ?? "";
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
