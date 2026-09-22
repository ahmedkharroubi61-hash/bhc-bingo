import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";

export interface CustomerUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

/** Result of a sign-in / sign-up attempt. */
export interface AuthResult {
  /** User-safe error message, or null on success. */
  error: string | null;
  /** True when sign-up succeeded but the account still needs email confirmation. */
  needsConfirmation?: boolean;
}

interface AuthContextValue {
  /** null while the initial session check is in flight. */
  loading: boolean;
  /** Signed-in customer, or null when signed out. */
  user: CustomerUser | null;
  /** True when no Supabase backend is configured. */
  noBackend: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface SessionUser {
  id: string;
  email?: string;
  user_metadata?: { first_name?: string; last_name?: string };
}

function toUser(session: { user: SessionUser } | null): CustomerUser | null {
  if (!session?.user?.email) return null;
  const meta = session.user.user_metadata ?? {};
  return {
    id: session.user.id,
    email: session.user.email,
    firstName: (meta.first_name ?? "").trim(),
    lastName: (meta.last_name ?? "").trim(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<CustomerUser | null>(null);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setUser(toUser(data.session));
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toUser(session));
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: "Accounts are unavailable right now." };
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { error: "Incorrect email or password." };
    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, firstName: string, lastName: string): Promise<AuthResult> => {
    if (!supabase) return { error: "Accounts are unavailable right now." };
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { first_name: firstName.trim(), last_name: lastName.trim() } },
    });
    if (error) {
      const msg = /registered|exists/i.test(error.message)
        ? "That email is already registered. Try signing in instead."
        : error.message.replace(/\.$/, "") + ".";
      return { error: msg };
    }
    // When email confirmation is on, signUp returns no session until confirmed.
    if (!data.session) return { error: null, needsConfirmation: true };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ loading, user, noBackend: !supabase, signIn, signUp, signOut }),
    [loading, user, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
