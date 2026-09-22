import { supabase } from "./supabase";

export interface MyOrderItem {
  title: string;
  qty: number;
  lineTotal: number;
}

export interface MyOrder {
  id: string;
  createdAt: string;
  status: string;
  subtotal: number;
  delivery: number;
  total: number;
  items: MyOrderItem[];
}

interface OrderRow {
  id: string;
  created_at: string;
  status: string;
  subtotal_millimes: number;
  delivery_millimes: number;
  total_millimes: number;
  order_items: { title: string; qty: number; line_millimes: number }[] | null;
}

/**
 * The signed-in customer's own orders, newest first. RLS ("orders read own")
 * enforces that only the caller's orders come back — no user_id filter needed
 * client-side, but we can't see anyone else's regardless.
 */
export async function listMyOrders(): Promise<MyOrder[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("orders")
    .select("id, created_at, status, subtotal_millimes, delivery_millimes, total_millimes, order_items(title, qty, line_millimes)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error || !data) return [];
  return (data as OrderRow[]).map((o) => ({
    id: o.id,
    createdAt: o.created_at,
    status: o.status,
    subtotal: o.subtotal_millimes,
    delivery: o.delivery_millimes,
    total: o.total_millimes,
    items: (o.order_items ?? []).map((i) => ({ title: i.title, qty: i.qty, lineTotal: i.line_millimes })),
  }));
}
