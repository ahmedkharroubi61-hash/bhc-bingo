import { useEffect, useState } from "react";
import type { AdminSession } from "../../lib/adminAuth";
import { getLockStatus, recordFailure, resetGuard, formatCountdown, type LockStatus } from "../../lib/loginGuard";
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
  const [lock, setLock] = useState<LockStatus>(() => getLockStatus());

  const notAuthorised = !!session.email && !session.isAdmin;

  // While locked, tick every second so the countdown updates and the form
  // re-enables the moment the cooldown expires.
  useEffect(() => {
    if (!lock.locked) return;
    const id = window.setInterval(() => setLock(getLockStatus()), 1000);
    return () => window.clearInterval(id);
  }, [lock.locked]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (getLockStatus().locked) { setLock(getLockStatus()); return; }
    setBusy(true);
    setError(null);
    const err = await session.signIn(email, password);
    setBusy(false);
    if (err) {
      setError(err);
      setLock(recordFailure());
    } else {
      resetGuard();
      setLock(getLockStatus());
    }
  };

  return (
    <div className="admin-auth">
      <aside className="admin-auth-brand">
        <div className="admin-auth-brand-top">
          <img className="admin-auth-brand-logo" src="/img/logo-light.png" alt="BHC Bingo" width={52} height={44} />
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
        <p className="admin-auth-brand-foot">BHC Bingo · Parapharmacie — authentic products, chosen with care.</p>
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
              <input type="email" autoComplete="username" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={lock.locked} required />
            </label>
            <label className="admin-field">
              <span>Password</span>
              <input type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={lock.locked} required />
            </label>

            {lock.locked ? (
              <p className="admin-auth-error" role="alert">
                Too many failed attempts. Try again in <strong>{formatCountdown(lock.remainingMs)}</strong>.
              </p>
            ) : error ? (
              <>
                <p className="admin-auth-error" role="alert">{error}</p>
                {lock.attempts > 0 && lock.attemptsLeft <= 2 ? (
                  <p className="admin-auth-note">
                    {lock.attemptsLeft > 0
                      ? `${lock.attemptsLeft} attempt${lock.attemptsLeft === 1 ? "" : "s"} left before a temporary lock.`
                      : "The next failed attempt will temporarily lock sign-in."}
                  </p>
                ) : null}
              </>
            ) : null}

            <button type="submit" className="admin-btn admin-btn-primary admin-btn-block" disabled={busy || lock.locked}>
              {lock.locked ? `Locked · ${formatCountdown(lock.remainingMs)}` : busy ? "Signing in…" : "Sign in to console"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
