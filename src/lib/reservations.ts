import { supabase } from "./supabase";
import { withTimeout } from "./net";
import type { ReservationInput, ReservationSlot, ReservationStatus } from "./types";

/** Confirmed reservation returned to the customer. */
export interface ReservationReceipt {
  id: string;
  service: string;
  date: string;
  slot: ReservationSlot;
}

interface RpcResult {
  success: boolean;
  reservation?: ReservationReceipt;
  error?: string;
}

/** Place a reservation request. Server validates slot, closed Sundays, past dates. */
export async function createReservation(input: ReservationInput): Promise<ReservationReceipt> {
  if (!supabase) {
    // Demo fallback (no backend): echo a local confirmation.
    return { id: "RSV-DEMO", service: input.service, date: input.date, slot: input.slot };
  }
  const payload = {
    p_customer: {
      name: input.name, phone: input.phone, service: input.service,
      date: input.date, slot: input.slot, notes: input.notes,
    },
  };
  let res: { data: unknown; error: unknown };
  try {
    res = await withTimeout(Promise.resolve(supabase.rpc("create_reservation", payload)));
  } catch (timeout) {
    throw timeout instanceof Error ? timeout : new Error("We couldn't reach the store. Please try again.");
  }
  if (res.error) throw new Error("We couldn't save your reservation. Please try again.");
  const result = res.data as RpcResult;
  if (!result?.success || !result.reservation) {
    throw new Error(result?.error ?? "We couldn't save your reservation. Please try again.");
  }
  return result.reservation;
}

/* ---- Admin ---- */
export interface AdminReservation {
  id: string;
  status: ReservationStatus;
  service: string;
  date: string;
  slot: ReservationSlot;
  createdAt: string;
  customer: { name: string; phone: string };
  notes: string;
}

interface ReservationRow {
  id: string; status: ReservationStatus; service: string;
  reserved_date: string; slot: ReservationSlot; created_at: string;
  customer_name: string; customer_phone: string; notes: string | null;
}

function assertBackend() {
  if (!supabase) throw new Error("No Supabase backend is configured.");
  return supabase;
}

export async function adminListReservations(): Promise<AdminReservation[]> {
  const sb = assertBackend();
  const { data, error } = await sb
    .from("reservations")
    .select("*")
    .order("reserved_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data as ReservationRow[]).map((r) => ({
    id: r.id, status: r.status, service: r.service,
    date: r.reserved_date, slot: r.slot, createdAt: r.created_at,
    customer: { name: r.customer_name, phone: r.customer_phone },
    notes: r.notes ?? "",
  }));
}

export async function adminSetReservationStatus(id: string, status: ReservationStatus): Promise<void> {
  const sb = assertBackend();
  const { error } = await sb.from("reservations").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function adminDeleteReservation(id: string): Promise<void> {
  const sb = assertBackend();
  const { data, error } = await sb.rpc("admin_delete_cancelled_reservation", { p_id: id });
  if (error) throw new Error(error.message);
  const result = data as { success?: boolean; error?: string } | null;
  if (!result?.success) throw new Error(result?.error ?? "Could not delete the reservation.");
}
