import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { makeLoginGuard, formatCountdown, type LockStatus } from "../../lib/loginGuard";
import { checkPassword, isStrongPassword } from "../../lib/password";

type Mode = "signin" | "signup";

export function AuthForm() {
  const { signIn, signUp } = useAuth();
  const guard = useMemo(() => makeLoginGuard("client"), []);

  const [mode, setMode] = useState<Mode>("signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lock, setLock] = useState<LockStatus>(() => guard.getLockStatus());

  const pwRules = checkPassword(password);

  // While locked, tick so the countdown updates and the form re-enables on expiry.
  useEffect(() => {
    if (!lock.locked) return;
    const id = window.setInterval(() => setLock(guard.getLockStatus()), 1000);
    return () => window.clearInterval(id);
  }, [lock.locked, guard]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (guard.getLockStatus().locked) { setLock(guard.getLockStatus()); return; }
    setError(null);
    setNotice(null);

    if (mode === "signup") {
      if (!firstName.trim() || !lastName.trim()) {
        setError("Please enter your first and last name.");
        return;
      }
      if (!isStrongPassword(password)) {
        setError("Please choose a stronger password — see the checklist below.");
        return;
      }
    }

    setBusy(true);
    const result = mode === "signin"
      ? await signIn(email, password)
      : await signUp(email, password, firstName, lastName);
    setBusy(false);

    if (result.error) {
      setError(result.error);
      setLock(guard.recordFailure());
      return;
    }
    guard.resetGuard();
    setLock(guard.getLockStatus());
    if (result.needsConfirmation) {
      setNotice("Account created. Check your inbox to confirm your email, then sign in.");
      setMode("signin");
      setPassword("");
    }
    // On a successful sign-in the AuthProvider flips `user`, and AccountPage
    // swaps this form out for the dashboard — no navigation needed here.
  };

  return (
    <form className="acct-auth-card" onSubmit={submit} noValidate>
      <div className="acct-tabs" role="tablist" aria-label="Account access">
        <button type="button" role="tab" aria-selected={mode === "signin"}
          className={`acct-tab${mode === "signin" ? " active" : ""}`} onClick={() => switchMode("signin")}>
          Sign in
        </button>
        <button type="button" role="tab" aria-selected={mode === "signup"}
          className={`acct-tab${mode === "signup" ? " active" : ""}`} onClick={() => switchMode("signup")}>
          Create account
        </button>
      </div>

      <p className="acct-auth-lead">
        {mode === "signin"
          ? "Sign in to see your orders and check out faster."
          : "Create an account to track your orders and save your delivery details."}
      </p>

      {mode === "signup" ? (
        <div className="acct-name-row">
          <div className="field">
            <label htmlFor="acct-first">First name</label>
            <input id="acct-first" autoComplete="given-name" placeholder="Amira"
              value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={lock.locked} required />
          </div>
          <div className="field">
            <label htmlFor="acct-last">Last name</label>
            <input id="acct-last" autoComplete="family-name" placeholder="Ben Salah"
              value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={lock.locked} required />
          </div>
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="acct-email">Email</label>
        <input id="acct-email" type="email" autoComplete="email" placeholder="you@email.com"
          value={email} onChange={(e) => setEmail(e.target.value)} disabled={lock.locked} required />
      </div>
      <div className="field">
        <label htmlFor="acct-password">Password</label>
        <input id="acct-password" type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder={mode === "signup" ? "Create a strong password" : "••••••••"}
          value={password} onChange={(e) => setPassword(e.target.value)} disabled={lock.locked} required />
      </div>

      {mode === "signup" && password.length > 0 ? (
        <ul className="acct-pw-rules" aria-label="Password requirements">
          {pwRules.map((r) => (
            <li key={r.key} className={r.met ? "met" : ""}>
              <span aria-hidden="true">{r.met ? "✓" : "○"}</span> {r.label}
            </li>
          ))}
        </ul>
      ) : null}

      {lock.locked ? (
        <p className="form-status err" role="alert">
          Too many attempts. Try again in <strong>{formatCountdown(lock.remainingMs)}</strong>.
        </p>
      ) : error ? (
        <>
          <p className="form-status err" role="alert">{error}</p>
          {lock.attempts > 0 && lock.attemptsLeft <= 2 ? (
            <p className="note-sm">
              {lock.attemptsLeft > 0
                ? `${lock.attemptsLeft} attempt${lock.attemptsLeft === 1 ? "" : "s"} left before a temporary lock.`
                : "The next failed attempt will temporarily lock this form."}
            </p>
          ) : null}
        </>
      ) : notice ? (
        <p className="form-status ok" role="status">{notice}</p>
      ) : null}

      <button className="btn btn-gold btn-block" type="submit" disabled={busy || lock.locked} style={{ marginTop: 16 }}>
        {lock.locked ? `Locked · ${formatCountdown(lock.remainingMs)}`
          : busy ? (mode === "signin" ? "Signing in…" : "Creating account…")
          : mode === "signin" ? "Sign in" : "Create account"}
      </button>

      <p className="note-sm" style={{ textAlign: "center", marginTop: 12 }}>
        You can still order as a guest — an account just makes it faster next time.
      </p>
    </form>
  );
}
