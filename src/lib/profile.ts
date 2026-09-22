import { supabase } from "./supabase";

/** Saved checkout details for a signed-in customer. */
export interface Profile {
  fullName: string;
  phone: string;
  address: string;
  city: string;
}

const EMPTY_PROFILE: Profile = { fullName: "", phone: "", address: "", city: "" };

/**
 * Load the signed-in customer's saved profile. Returns an empty profile when
 * none has been saved yet (RLS guarantees a user only ever sees their own row).
 */
export async function getMyProfile(): Promise<Profile> {
  if (!supabase) return EMPTY_PROFILE;
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, phone, address, city")
    .maybeSingle();
  if (error || !data) return EMPTY_PROFILE;
  return {
    fullName: data.full_name ?? "",
    phone: data.phone ?? "",
    address: data.address ?? "",
    city: data.city ?? "",
  };
}

/** Upsert the signed-in customer's saved profile. Throws on failure. */
export async function saveMyProfile(userId: string, profile: Profile): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    full_name: profile.fullName.trim(),
    phone: profile.phone.trim(),
    address: profile.address.trim(),
    city: profile.city.trim(),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error("We couldn't save your details. Please try again.");
}
