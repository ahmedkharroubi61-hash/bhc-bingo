import { supabase } from "./supabase";

/** A bookable service (admin-managed). */
export interface Service {
  id: string;
  name: string;
  active: boolean;
  sort: number;
  priceMillimes: number | null;
}

interface ServiceRow { id: string; name: string; active: boolean; sort: number; price_millimes: number | null }
function mapService(r: ServiceRow): Service {
  return { id: r.id, name: r.name, active: r.active, sort: r.sort, priceMillimes: r.price_millimes };
}

function assertBackend() {
  if (!supabase) throw new Error("No Supabase backend is configured.");
  return supabase;
}

/** Active services for the public reservation form (empty when none/no backend). */
export async function getActiveServices(): Promise<Service[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("services")
    .select("id, name, active, sort, price_millimes")
    .eq("active", true)
    .order("sort")
    .order("created_at");
  if (error || !data) return [];
  return (data as ServiceRow[]).map(mapService);
}

/** All services (admin view). */
export async function adminListServices(): Promise<Service[]> {
  const sb = assertBackend();
  const { data, error } = await sb
    .from("services")
    .select("id, name, active, sort, price_millimes")
    .order("sort")
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data as ServiceRow[]).map(mapService);
}

export async function adminCreateService(name: string, sort: number, priceMillimes: number | null): Promise<void> {
  const sb = assertBackend();
  const { error } = await sb.from("services").insert({ name: name.trim(), sort, price_millimes: priceMillimes });
  if (error) throw new Error(error.message);
}

export async function adminUpdateService(id: string, patch: Partial<Pick<Service, "name" | "active" | "sort" | "priceMillimes">>): Promise<void> {
  const sb = assertBackend();
  const next: Record<string, unknown> = {};
  if (patch.name != null) next.name = patch.name.trim();
  if (patch.active != null) next.active = patch.active;
  if (patch.sort != null) next.sort = patch.sort;
  if (patch.priceMillimes !== undefined) next.price_millimes = patch.priceMillimes;
  const { error } = await sb.from("services").update(next).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function adminDeleteService(id: string): Promise<void> {
  const sb = assertBackend();
  const { error } = await sb.from("services").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
