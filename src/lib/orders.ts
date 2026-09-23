import { supabase } from "./supabase";
import { DELIVERY_FEE_MILLIMES, FREE_DELIVERY_OVER_MILLIMES } from "./config";
import { invalidateProducts } from "./products";
import { withTimeout } from "./net";
import type { CustomerDetails, FulfillmentMethod, Order } from "./types";
import type { ResolvedLine } from "./useCartLines";

/** A normalized order line — the single input both the storefront cart and the
 *  staff POS build before an order is placed. title/unit are only used by the
 *  demo fallback and optimistic UI; the server always re-prices from product_id. */
export interface OrderLineInput {
  productId: string;
  qty: number;
  size: string | null;
  title: string;
  unitMillimes: number;
}

/* Orders repository / service layer.
   - With Supabase configured: calls the create_order() RPC, which re-validates
     every price on the server (the client is never trusted for money).
   - Without Supabase (demo / no .env): builds the same Order locally so the
     checkout flow always completes. Totals then reflect client-side prices. */

/** Shape returned by the create_order() RPC on success. */
interface RpcOrder {
  id: string;
  items: { title: string; qty: number; lineTotal: number }[];
  subtotal: number;
  delivery: number;
  total: number;
  method: "COD";
  fulfillment?: FulfillmentMethod;
}
interface RpcResult {
  success: boolean;
  order?: RpcOrder;
  error?: string;
}

function newOrderId(): string {
  return "BNG-" + Date.now().toString(36).toUpperCase().slice(-6);
}

/** Delivery fee in millimes — free for pickup, and for delivery over the threshold. */
function deliveryFor(subtotal: number, fulfillment: FulfillmentMethod): number {
  if (fulfillment === "pickup") return 0;
  return subtotal >= FREE_DELIVERY_OVER_MILLIMES ? 0 : DELIVERY_FEE_MILLIMES;
}

/** Demo fallback: construct the order client-side (no server validation). */
function buildLocalOrder(items: OrderLineInput[], customer: CustomerDetails): Order {
  const subtotal = items.reduce((sum, i) => sum + i.unitMillimes * i.qty, 0);
  const delivery = deliveryFor(subtotal, customer.fulfillment);
  return {
    id: newOrderId(),
    createdAt: new Date().toISOString(),
    items: items.map((i) => ({
      title: i.title + (i.size ? ` — ${i.size}` : ""),
      qty: i.qty,
      lineTotal: i.unitMillimes * i.qty,
    })),
    subtotal,
    delivery,
    total: subtotal + delivery,
    customer,
    method: "COD",
    fulfillment: customer.fulfillment,
  };
}

/**
 * Place a Cash-on-Delivery order from normalized lines. Shared by the storefront
 * checkout and the staff POS. Resolves to the confirmed Order; rejects with a
 * user-safe Error when a configured backend refuses it (price/stock mismatch).
 */
export async function placeOrder(items: OrderLineInput[], customer: CustomerDetails): Promise<Order> {
  if (!supabase) {
    return buildLocalOrder(items, customer);
  }

  const payload = {
    p_customer: {
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      notes: customer.notes,
      fulfillment: customer.fulfillment,
    },
    p_items: items.map((i) => ({ product_id: i.productId, qty: i.qty, size: i.size })),
  };

  let res: { data: unknown; error: unknown };
  try {
    res = await withTimeout(Promise.resolve(supabase.rpc("create_order", payload)));
  } catch (timeout) {
    throw timeout instanceof Error ? timeout : new Error("We couldn't reach the store. Please try again.");
  }
  if (res.error) {
    throw new Error("We couldn't reach the store to place your order. Please try again.");
  }

  const result = res.data as RpcResult;
  if (!result?.success || !result.order) {
    throw new Error(result?.error ?? "We couldn't place your order. Please try again.");
  }

  // Stock was just decremented server-side — drop the cached catalogue so the
  // shopper's next view reflects the new stock (and any now-sold-out item).
  invalidateProducts();

  // Server owns id + validated totals; attach the customer + a timestamp.
  return { ...result.order, fulfillment: result.order.fulfillment ?? customer.fulfillment, customer, createdAt: new Date().toISOString() };
}

/**
 * In-store POS sale (admin only). Records the sale + decrements stock via the
 * create_pos_sale RPC — no delivery, no customer details required. Returns a
 * confirmed Order for the printable ticket.
 */
export async function createPosSale(items: OrderLineInput[]): Promise<Order> {
  const customer: CustomerDetails = {
    name: "Walk-in", phone: "", address: "", city: "", notes: "", fulfillment: "pickup",
  };
  if (!supabase) {
    return { ...buildLocalOrder(items, customer), delivery: 0 };
  }

  const payload = { p_items: items.map((i) => ({ product_id: i.productId, qty: i.qty, size: i.size })) };

  let res: { data: unknown; error: unknown };
  try {
    res = await withTimeout(Promise.resolve(supabase.rpc("create_pos_sale", payload)));
  } catch (timeout) {
    throw timeout instanceof Error ? timeout : new Error("We couldn't reach the store. Please try again.");
  }
  if (res.error) {
    throw new Error("We couldn't record the sale. Please try again.");
  }

  const result = res.data as RpcResult;
  if (!result?.success || !result.order) {
    throw new Error(result?.error ?? "We couldn't complete the sale. Please try again.");
  }

  invalidateProducts();
  return { ...result.order, fulfillment: "pickup", customer, createdAt: new Date().toISOString() };
}

/** Place an order from resolved storefront cart lines. */
export async function createOrder(lines: ResolvedLine[], customer: CustomerDetails): Promise<Order> {
  const items: OrderLineInput[] = lines.map((l) => ({
    productId: l.product.id,
    qty: l.line.qty,
    size: l.line.size ?? null,
    title: l.product.title,
    unitMillimes: l.unitPrice,
  }));
  return placeOrder(items, customer);
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
