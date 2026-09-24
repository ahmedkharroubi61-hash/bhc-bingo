import { supabase } from "./supabase";

/** A bookable service (admin-managed). */
export interface Service {
  id: string;
  name: string;
  active: boolean;
  sort: number;
}

interface ServiceRow { id: string; name: string; active: boolean; sort: number }

function assertBackend() {
  if (!supabase) throw new Error("No Supabase backend is configured.");
  return supabase;
}

/** Active services for the public reservation form (empty when none/no backend). */
export async function getActiveServices(): Promise<Service[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("services")
    .select("id, name, active, sort")
    .eq("active", true)
    .order("sort")
    .order("created_at");
  if (error || !data) return [];
  return data as ServiceRow[];
}

/** All services (admin view). */
export async function adminListServices(): Promise<Service[]> {
  const sb = assertBackend();
  const { data, error } = await sb
    .from("services")
    .select("id, name, active, sort")
    .order("sort")
    .order("created_at");
  if (error) throw new Error(error.message);
  return data as ServiceRow[];
}

export async function adminCreateService(name: string, sort: number): Promise<void> {
  const sb = assertBackend();
  const { error } = await sb.from("services").insert({ name: name.trim(), sort });
  if (error) throw new Error(error.message);
}

export async function adminUpdateService(id: string, patch: Partial<Pick<Service, "name" | "active" | "sort">>): Promise<void> {
  const sb = assertBackend();
  const next = { ...patch, ...(patch.name != null ? { name: patch.name.trim() } : {}) };
  const { error } = await sb.from("services").update(next).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function adminDeleteService(id: string): Promise<void> {
  const sb = assertBackend();
  const { error } = await sb.from("services").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
