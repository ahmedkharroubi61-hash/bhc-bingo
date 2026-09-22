import { supabase } from "./supabase";
import { DELIVERY_FEE_MILLIMES, FREE_DELIVERY_OVER_MILLIMES } from "./config";
import { invalidateProducts } from "./products";
import { withTimeout } from "./net";
import type { CustomerDetails, Order } from "./types";
import type { ResolvedLine } from "./useCartLines";

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
}
interface RpcResult {
  success: boolean;
  order?: RpcOrder;
  error?: string;
}

function newOrderId(): string {
  return "BNG-" + Date.now().toString(36).toUpperCase().slice(-6);
}

function deliveryFor(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_OVER_MILLIMES ? 0 : DELIVERY_FEE_MILLIMES;
}

/** Demo fallback: construct the order client-side (no server validation). */
function buildLocalOrder(lines: ResolvedLine[], customer: CustomerDetails): Order {
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const delivery = deliveryFor(subtotal);
  return {
    id: newOrderId(),
    createdAt: new Date().toISOString(),
    items: lines.map((l) => ({
      title: l.product.title + (l.line.size ? ` — ${l.line.size}` : ""),
      qty: l.line.qty,
      lineTotal: l.lineTotal,
    })),
    subtotal,
    delivery,
    total: subtotal + delivery,
    customer,
    method: "COD",
  };
}

/**
 * Place a Cash-on-Delivery order.
 * Resolves to the confirmed Order. Rejects with a user-safe Error when a
 * configured backend refuses the order (e.g. a price/availability mismatch).
 */
export async function createOrder(lines: ResolvedLine[], customer: CustomerDetails): Promise<Order> {
  if (!supabase) {
    return buildLocalOrder(lines, customer);
  }

  const payload = {
    p_customer: {
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      notes: customer.notes,
    },
    p_items: lines.map((l) => ({ product_id: l.product.id, qty: l.line.qty, size: l.line.size ?? null })),
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
  return { ...result.order, customer, createdAt: new Date().toISOString() };
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
