import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface AdminSession {
  /** null while the initial session check is in flight. */
  loading: boolean;
  /** Signed-in user's email, or null when signed out. */
  email: string | null;
  /** True only when signed in AND on the server-side admin allowlist. */
  isAdmin: boolean;
  /** True when no Supabase backend is configured (admin needs a real backend). */
  noBackend: boolean;
}

async function checkIsAdmin(): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("is_admin");
  return !error && data === true;
}

/**
 * Admin auth state. Wraps Supabase Auth and verifies the signed-in user is on
 * the DB `admins` allowlist via the is_admin() RPC — being merely authenticated
 * is never enough to see the admin panel.
 */
export function useAdminSession(): AdminSession & {
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
} {
  const [state, setState] = useState<AdminSession>({
    loading: true,
    email: null,
    isAdmin: false,
    noBackend: !supabase,
  });

  const refresh = useCallback(async () => {
    if (!supabase) {
      setState({ loading: false, email: null, isAdmin: false, noBackend: true });
      return;
    }
    const { data } = await supabase.auth.getSession();
    const email = data.session?.user.email ?? null;
    const isAdmin = email ? await checkIsAdmin() : false;
    setState({ loading: false, email, isAdmin, noBackend: false });
  }, []);

  useEffect(() => {
    refresh();
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange(() => { refresh(); });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    if (!supabase) return "No backend is configured.";
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return "Incorrect email or password.";
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      await supabase.auth.signOut();
      return "This account is not authorised for the admin area.";
    }
    return null;
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
  }, []);

  return { ...state, signIn, signOut };
}
