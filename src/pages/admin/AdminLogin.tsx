import { useState } from "react";
import type { AdminSession } from "../../lib/adminAuth";
import { IconLock } from "./adminIcons";

interface Props {
  session: AdminSession & {
    signIn: (email: string, password: string) => Promise<string | null>;
    signOut: () => Promise<void>;
  };
}

export function AdminLogin({ session }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const notAuthorised = !!session.email && !session.isAdmin;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const err = await session.signIn(email, password);
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <div className="admin-auth">
      <aside className="admin-auth-brand">
        <div className="admin-auth-brand-top">
          <span className="admin-brand-mark">BIOBINGO</span>
          <span className="admin-auth-brand-tag">Operations Console</span>
        </div>
        <div className="admin-auth-brand-mid">
          <h2 className="admin-auth-brand-h">Everything behind<br />your storefront.</h2>
          <ul className="admin-auth-brand-list">
            <li>Live stock &amp; product catalogue</li>
            <li>Cash-on-delivery orders</li>
            <li>Monthly sales &amp; best-sellers</li>
          </ul>
        </div>
        <p className="admin-auth-brand-foot">Bio Bingo · Parapharmacie — authentic products, chosen with care.</p>
      </aside>

      <div className="admin-auth-panel">
        {session.noBackend ? (
          <div className="admin-auth-card">
            <span className="admin-auth-eyebrow">Admin</span>
            <h1 className="admin-auth-title">Backend not connected</h1>
            <p className="admin-auth-note">The admin panel needs the Supabase backend. Add your <code>.env</code> credentials and reload.</p>
          </div>
        ) : (
          <form className="admin-auth-card" onSubmit={submit}>
            <span className="admin-auth-eyebrow"><IconLock /> Secure area</span>
            <h1 className="admin-auth-title">Sign in</h1>
            <p className="admin-auth-note">Authorised staff only.</p>

            {notAuthorised ? (
              <div className="admin-auth-warn">
                You’re signed in as <strong>{session.email}</strong>, but this account isn’t an admin.
                <button type="button" className="admin-link-btn" onClick={() => session.signOut()}>Sign out</button>
              </div>
            ) : null}

            <label className="admin-field">
              <span>Email</span>
              <input type="email" autoComplete="username" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label className="admin-field">
              <span>Password</span>
              <input type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>

            {error ? <p className="admin-auth-error" role="alert">{error}</p> : null}

            <button type="submit" className="admin-btn admin-btn-primary admin-btn-block" disabled={busy}>
              {busy ? "Signing in…" : "Sign in to console"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
