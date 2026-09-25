import { supabase } from "./supabase";

/**
 * Customer star ratings (stars only). Anonymous-friendly: each browser gets a
 * stable random voter key stored in localStorage, so a visitor can rate without
 * an account and re-rating overwrites their previous vote. The server
 * (rate_product RPC) validates 1..5 and blends the vote into the product's
 * displayed rating — the client never sets the average directly.
 */

const VOTER_KEY = "bhc.voter";
const MY_RATING_PREFIX = "bhc.rating.";

export interface RatingResult {
  rating: number;
  ratingCount: number;
}

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* private mode: ignore */ }
}

/** A stable per-browser key used to deduplicate votes. Created on first use. */
export function getVoterKey(): string {
  const existing = safeGet(VOTER_KEY);
  if (existing && existing.length >= 8) return existing;
  const key =
    (globalThis.crypto?.randomUUID?.() ??
      `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
  safeSet(VOTER_KEY, key);
  return key;
}

/** The star value this browser last submitted for a product, if any. */
export function getMyStars(productId: string): number | null {
  const raw = safeGet(MY_RATING_PREFIX + productId);
  const n = raw ? Number(raw) : NaN;
  return n >= 1 && n <= 5 ? n : null;
}

function setMyStars(productId: string, stars: number): void {
  safeSet(MY_RATING_PREFIX + productId, String(stars));
}

/**
 * Submit a star rating for a product. Returns the new blended average and count
 * on success, or an error message. When the backend isn't configured (local
 * seed mode) the choice is remembered locally so the UI still responds.
 */
export async function rateProduct(
  productId: string,
  stars: number,
): Promise<{ ok: true; result: RatingResult } | { ok: false; error: string }> {
  if (stars < 1 || stars > 5) return { ok: false, error: "Please choose 1 to 5 stars." };

  if (!supabase) {
    setMyStars(productId, stars);
    return { ok: false, error: "Ratings need the store backend — your choice was saved on this device." };
  }

  const { data, error } = await supabase.rpc("rate_product", {
    p_product_id: productId,
    p_voter_key: getVoterKey(),
    p_stars: stars,
  });

  if (error) return { ok: false, error: "We could not save your rating. Please try again." };

  const res = data as { success?: boolean; rating?: number; ratingCount?: number; error?: string };
  if (!res?.success) return { ok: false, error: res?.error ?? "We could not save your rating." };

  setMyStars(productId, stars);
  return { ok: true, result: { rating: Number(res.rating ?? 0), ratingCount: Number(res.ratingCount ?? 0) } };
}
