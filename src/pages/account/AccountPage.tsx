import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMyProfile, saveMyProfile, type Profile } from "../../lib/profile";
import { listMyOrders, type MyOrder } from "../../lib/customerOrders";
import { formatPrice } from "../../lib/format";
import { SectionHead } from "../../components/SectionHead";
import { AuthForm } from "./AuthForm";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso.slice(0, 10);
  }
}

function SavedDetails({ userId, fallbackName }: { userId: string; fallbackName: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    getMyProfile().then((p) => { if (alive) setProfile({ ...p, fullName: p.fullName || fallbackName }); });
    return () => { alive = false; };
  }, [fallbackName]);

  if (!profile) return <p className="muted">Loading your details…</p>;

  const set = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setProfile((p) => (p ? { ...p, [k]: e.target.value } : p));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setStatus(null);
    try {
      await saveMyProfile(userId, profile);
      setStatus({ msg: "Saved. We'll prefill these at checkout.", ok: true });
    } catch (err) {
      setStatus({ msg: err instanceof Error ? err.message : "Could not save.", ok: false });
    }
    setSaving(false);
  };

  return (
    <form className="acct-panel" onSubmit={save} noValidate>
      <h3 className="summary-h">Saved delivery details</h3>
      <p className="note-sm" style={{ marginTop: -4 }}>These prefill your next Cash-on-Delivery checkout.</p>
      <div className="field"><label htmlFor="pf-name">Full name</label><input id="pf-name" value={profile.fullName} onChange={set("fullName")} autoComplete="name" /></div>
      <div className="field"><label htmlFor="pf-phone">Phone</label><input id="pf-phone" type="tel" value={profile.phone} onChange={set("phone")} autoComplete="tel" /></div>
      <div className="field"><label htmlFor="pf-address">Address</label><input id="pf-address" value={profile.address} onChange={set("address")} autoComplete="street-address" /></div>
      <div className="field"><label htmlFor="pf-city">City</label><input id="pf-city" value={profile.city} onChange={set("city")} autoComplete="address-level2" /></div>
      {status ? <p className={`form-status ${status.ok ? "ok" : "err"}`} role="status">{status.msg}</p> : null}
      <button className="btn btn-gold" type="submit" disabled={saving} style={{ marginTop: 8 }}>{saving ? "Saving…" : "Save details"}</button>
    </form>
  );
}

function OrderHistory() {
  const [orders, setOrders] = useState<MyOrder[] | null>(null);

  useEffect(() => {
    let alive = true;
    listMyOrders().then((o) => { if (alive) setOrders(o); });
    return () => { alive = false; };
  }, []);

  if (orders == null) return <p className="muted">Loading your orders…</p>;
  if (orders.length === 0) {
    return (
      <div className="acct-panel">
        <h3 className="summary-h">Your orders</h3>
        <p className="muted">No orders yet.</p>
        <p><Link className="btn btn-outline" to="/category/all">Start shopping</Link></p>
      </div>
    );
  }

  return (
    <div className="acct-panel">
      <h3 className="summary-h">Your orders</h3>
      <ul className="acct-orders">
        {orders.map((o) => (
          <li className="acct-order" key={o.id}>
            <div className="acct-order-head">
              <span className="acct-order-id">{o.id}</span>
              <span className={`acct-status acct-status-${o.status.toLowerCase()}`}>{o.status}</span>
            </div>
            <div className="acct-order-meta">
              <span>{formatDate(o.createdAt)}</span>
              <span>{formatPrice(o.total)} · COD</span>
            </div>
            <ul className="acct-order-items">
              {o.items.map((i, idx) => (
                <li key={idx}><span>{i.qty}× {i.title}</span><span>{formatPrice(i.lineTotal)}</span></li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AccountPage() {
  const { loading, user, noBackend, signOut } = useAuth();

  if (loading) {
    return (
      <section className="section">
        <div className="container"><p className="muted">Loading…</p></div>
      </section>
    );
  }

  if (noBackend) {
    return (
      <section className="section">
        <div className="container legal">
          <SectionHead idx="—" title="My Account" />
          <p className="muted">Accounts need the store backend, which isn't connected in this preview.</p>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="section">
        <div className="container">
          <SectionHead idx="—" title="My Account" meta="Sign in or create an account" />
          <div className="acct-auth-wrap">
            <AuthForm />
          </div>
        </div>
      </section>
    );
  }

  const greetingName = user.firstName || user.email.split("@")[0];

  return (
    <section className="section">
      <div className="container">
        <div className="acct-header">
          <SectionHead idx="—" title={`Welcome, ${greetingName}`} meta={user.email} />
          <button className="btn btn-outline btn-sm" type="button" onClick={() => signOut()}>Sign out</button>
        </div>
        <div className="acct-grid">
          <OrderHistory />
          <SavedDetails userId={user.id} fallbackName={[user.firstName, user.lastName].filter(Boolean).join(" ")} />
        </div>
      </div>
    </section>
  );
}
