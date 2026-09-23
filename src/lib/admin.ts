import { supabase } from "./supabase";
import type { CategorySlug, FulfillmentMethod } from "./types";

/* Admin data layer. Every call here relies on the caller already being an
   authenticated admin — the database RLS policies (is_admin()) are the real
   gate, so a non-admin session gets empty reads and rejected writes. */

export interface AdminProduct {
  id: string;
  brand: string;
  title: string;
  category: CategorySlug;
  priceMillimes: number;
  oldPriceMillimes: number | null;
  image: string;
  alt: string;
  stock: number;
  active: boolean;
  heroRank: number | null;
  rating: number;
  ratingCount: number;
  tags: string[];
  description: string;
  howToUse: string;
  ingredients: string;
}

export interface AdminProductInput {
  brand: string;
  title: string;
  category: CategorySlug;
  priceMillimes: number;
  oldPriceMillimes: number | null;
  image: string;
  stock: number;
  active: boolean;
  description: string;
  howToUse: string;
  ingredients: string;
}

/** AI-drafted product copy (from the product-ai Edge Function). */
export interface AiProductContent {
  description: string;
  howToUse: string;
  ingredients: string;
}

export type OrderStatus = "received" | "confirmed" | "cancelled";

export interface AdminOrderItem {
  productId: string;
  title: string;
  unitMillimes: number;
  qty: number;
  lineMillimes: number;
}

export interface AdminOrder {
  id: string;
  status: OrderStatus;
  createdAt: string;
  fulfillment: FulfillmentMethod;
  subtotalMillimes: number;
  deliveryMillimes: number;
  totalMillimes: number;
  customer: { name: string; phone: string; address: string; city: string };
  notes: string;
  items: AdminOrderItem[];
}

function assertBackend() {
  if (!supabase) throw new Error("No Supabase backend is configured.");
  return supabase;
}

/** Stable, URL-safe id derived from the title, with a short random suffix. */
function makeProductId(title: string): string {
  const base = title.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "product";
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

interface ProductRow {
  id: string; brand: string; title: string; category: CategorySlug;
  price_millimes: number; old_price_millimes: number | null;
  image: string; alt: string; stock: number; active: boolean; hero_rank: number | null;
  rating: number; rating_count: number; tags: string[] | null;
  description: string | null; how_to_use: string | null; ingredients: string | null;
}

function mapProduct(r: ProductRow): AdminProduct {
  return {
    id: r.id, brand: r.brand, title: r.title, category: r.category,
    priceMillimes: r.price_millimes, oldPriceMillimes: r.old_price_millimes,
    image: r.image, alt: r.alt, stock: r.stock, active: r.active, heroRank: r.hero_rank ?? null,
    rating: Number(r.rating), ratingCount: r.rating_count, tags: r.tags ?? [],
    description: r.description ?? "", howToUse: r.how_to_use ?? "", ingredients: r.ingredients ?? "",
  };
}

export async function adminListProducts(): Promise<AdminProduct[]> {
  const sb = assertBackend();
  const { data, error } = await sb.from("products").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as ProductRow[]).map(mapProduct);
}

export async function adminCreateProduct(input: AdminProductInput): Promise<void> {
  const sb = assertBackend();
  const { error } = await sb.from("products").insert({
    id: makeProductId(input.title),
    brand: input.brand, title: input.title, category: input.category,
    price_millimes: input.priceMillimes, old_price_millimes: input.oldPriceMillimes,
    image: input.image, alt: input.title, stock: input.stock, active: input.active,
    description: input.description || null, how_to_use: input.howToUse || null, ingredients: input.ingredients || null,
  });
  if (error) throw new Error(error.message);
}

export async function adminUpdateProduct(id: string, input: AdminProductInput): Promise<void> {
  const sb = assertBackend();
  const { error } = await sb.from("products").update({
    brand: input.brand, title: input.title, category: input.category,
    price_millimes: input.priceMillimes, old_price_millimes: input.oldPriceMillimes,
    image: input.image, stock: input.stock, active: input.active,
    description: input.description || null, how_to_use: input.howToUse || null, ingredients: input.ingredients || null,
  }).eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Ask the product-ai Edge Function to research a product on the web and draft
 * its description / how-to-use / ingredients. The OpenAI key stays server-side;
 * the function is admin-gated. Returns editable drafts — never auto-saved.
 */
export async function adminAiProductContent(input: { title: string; brand: string; category: string }): Promise<AiProductContent> {
  const sb = assertBackend();
  const { data, error } = await sb.functions.invoke("product-ai", { body: input });
  if (error) {
    // Surface the function's own message when present (e.g. missing API key).
    const ctx = (error as { context?: { body?: unknown } }).context?.body;
    throw new Error(typeof ctx === "string" && ctx ? ctx : error.message || "AI request failed.");
  }
  const out = data as Partial<AiProductContent> & { error?: string };
  if (out?.error) throw new Error(out.error);
  return {
    description: out?.description ?? "",
    howToUse: out?.howToUse ?? "",
    ingredients: out?.ingredients ?? "",
  };
}

export async function adminSetStock(id: string, stock: number): Promise<void> {
  const sb = assertBackend();
  const { error } = await sb.from("products").update({ stock: Math.max(0, Math.round(stock)) }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function adminSetActive(id: string, active: boolean): Promise<void> {
  const sb = assertBackend();
  const { error } = await sb.from("products").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Set (or clear) a product's homepage-hero priority. null = not featured. */
export async function adminSetHeroRank(id: string, heroRank: number | null): Promise<void> {
  const sb = assertBackend();
  const value = heroRank === null || Number.isNaN(heroRank) ? null : Math.max(1, Math.round(heroRank));
  const { error } = await sb.from("products").update({ hero_rank: value }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function adminDeleteProduct(id: string): Promise<void> {
  const sb = assertBackend();
  const { error } = await sb.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

const IMAGE_BUCKET = "product-images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Upload a product image file to Supabase Storage; returns its public URL. */
export async function adminUploadProductImage(file: File): Promise<string> {
  const sb = assertBackend();
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Image is too large (max 5 MB).");

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await sb.storage.from(IMAGE_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw new Error(error.message);

  return sb.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

interface OrderItemRow {
  product_id: string; title: string; unit_millimes: number; qty: number; line_millimes: number;
}
interface OrderRow {
  id: string; status: OrderStatus; created_at: string; fulfillment: FulfillmentMethod | null;
  subtotal_millimes: number; delivery_millimes: number; total_millimes: number;
  customer_name: string; customer_phone: string; customer_address: string; customer_city: string;
  notes: string | null; order_items: OrderItemRow[] | null;
}

function mapOrder(r: OrderRow): AdminOrder {
  return {
    id: r.id, status: r.status, createdAt: r.created_at,
    fulfillment: r.fulfillment ?? "delivery",
    subtotalMillimes: r.subtotal_millimes, deliveryMillimes: r.delivery_millimes,
    totalMillimes: r.total_millimes,
    customer: { name: r.customer_name, phone: r.customer_phone, address: r.customer_address, city: r.customer_city },
    notes: r.notes ?? "",
    items: (r.order_items ?? []).map((i) => ({
      productId: i.product_id, title: i.title, unitMillimes: i.unit_millimes,
      qty: i.qty, lineMillimes: i.line_millimes,
    })),
  };
}

export async function adminListOrders(): Promise<AdminOrder[]> {
  const sb = assertBackend();
  const { data, error } = await sb
    .from("orders")
    .select("*, order_items(product_id, title, unit_millimes, qty, line_millimes)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as OrderRow[]).map(mapOrder);
}

export async function adminSetOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const sb = assertBackend();
  const { error } = await sb.from("orders").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}
