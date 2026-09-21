import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Null until the project's URL + anon key are provided in .env.
 *  The data layer falls back to local seed data when this is null. */
export const supabase: SupabaseClient | null =
  url && anon ? createClient(url, anon) : null;

export const hasSupabase = supabase !== null;
