import type { Product } from "./types";

const CATEGORY_LABEL: Record<string, string> = {
  skincare: "Skincare", face: "Face Care", body: "Body Care", hair: "Hair Care",
  makeup: "Makeup", sun: "Sun Protection", baby: "Baby & Mother", wellness: "Wellness",
};

/** True when every whitespace-separated term in `q` appears in the product's
 *  title, brand, or category label (case-insensitive). */
export function productMatches(p: Product, q: string): boolean {
  const hay = `${p.title} ${p.brand} ${CATEGORY_LABEL[p.category] ?? p.category}`.toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((term) => hay.includes(term));
}

/** Filter products by a query; empty query → no results. Optional cap. */
export function searchProducts(products: Product[], q: string, limit?: number): Product[] {
  const query = q.trim();
  if (!query) return [];
  const results = products.filter((p) => productMatches(p, query));
  return typeof limit === "number" ? results.slice(0, limit) : results;
}
