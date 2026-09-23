import { supabase } from "./supabase";
import { seedProducts } from "../data/seedProducts";
import { categories as seedCategories } from "../data/categories";
import { contentFor } from "../data/productContent";
import type { Product, Category, ProductTag, CategorySlug } from "./types";

/** Attach editorial detail-page content. A product's own (DB) fields win;
 *  the static productContent map only fills gaps (used by the seed catalogue). */
function withContent(list: Product[]): Product[] {
  return list.map((p) => {
    const c = contentFor(p);
    return {
      ...p,
      description: p.description ?? c.description,
      bestFor: p.bestFor ?? c.bestFor,
      ingredients: p.ingredients ?? c.ingredients,
      howToUse: p.howToUse ?? c.howToUse,
    };
  });
}

/* Repository pattern: read from Supabase when configured, else local seed.
   Any error falls back to seed so the storefront always renders. */

type SizeRow = { label: string; price_millimes: number };
type Row = {
  id: string; brand: string; title: string; category: CategorySlug;
  price_millimes: number; old_price_millimes: number | null;
  rating: number; rating_count: number; image: string; alt: string; tags: ProductTag[];
  stock?: number | null; active?: boolean | null; hero_rank?: number | null;
  description?: string | null; how_to_use?: string | null; ingredients?: string | null;
  sizes?: SizeRow[] | null;
};

function mapRow(r: Row): Product {
  const sizes = (r.sizes ?? []).map((s) => ({ label: s.label, priceMillimes: s.price_millimes }));
  return {
    id: r.id, brand: r.brand, title: r.title, category: r.category,
    priceMillimes: r.price_millimes,
    oldPriceMillimes: r.old_price_millimes ?? undefined,
    rating: Number(r.rating), ratingCount: r.rating_count,
    image: r.image, alt: r.alt, tags: r.tags ?? [],
    stock: r.stock ?? undefined,
    active: r.active ?? undefined,
    heroRank: r.hero_rank ?? undefined,
    description: r.description ?? undefined,
    howToUse: r.how_to_use ?? undefined,
    ingredients: r.ingredients ?? undefined,
    sizes: sizes.length > 0 ? sizes : undefined,
  };
}

/** How long a fetched catalogue is reused before re-fetching. */
const PRODUCTS_TTL_MS = 60_000;
let productsCache: { at: number; promise: Promise<Product[]> } | null = null;

async function fetchProducts(): Promise<Product[]> {
  if (!supabase) return withContent(seedProducts);
  const { data, error } = await supabase.from("products").select("*").eq("active", true);
  if (error || !data || data.length === 0) return withContent(seedProducts);
  return withContent((data as Row[]).map(mapRow));
}

/**
 * The active catalogue. Deduplicates concurrent callers (many components use
 * useProducts on one page) and caches briefly so a page load makes a single
 * request instead of one per component. A failed fetch is not cached.
 */
export function getProducts(): Promise<Product[]> {
  const now = Date.now();
  if (productsCache && now - productsCache.at < PRODUCTS_TTL_MS) {
    return productsCache.promise;
  }
  const promise = fetchProducts().catch((err) => {
    // Don't cache a failure — let the next caller retry.
    if (productsCache?.promise === promise) productsCache = null;
    throw err;
  });
  productsCache = { at: now, promise };
  return promise;
}

/** Drop the cached catalogue so the next read re-fetches (e.g. after an admin edit). */
export function invalidateProducts(): void {
  productsCache = null;
}

export async function getCategories(): Promise<Category[]> {
  if (!supabase) return seedCategories;
  const { data, error } = await supabase.from("categories").select("*").order("sort");
  if (error || !data || data.length === 0) return seedCategories;
  return data as Category[];
}

export async function getByTag(tag: ProductTag): Promise<Product[]> {
  return (await getProducts()).filter((p) => p.tags.includes(tag));
}

export async function getByCategory(slug: CategorySlug): Promise<Product[]> {
  return (await getProducts()).filter((p) => p.category === slug);
}

export async function getProduct(id: string): Promise<Product | undefined> {
  return (await getProducts()).find((p) => p.id === id);
}
