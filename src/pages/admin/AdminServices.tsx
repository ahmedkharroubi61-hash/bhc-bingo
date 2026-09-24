import { useCallback, useEffect, useState } from "react";
import {
  adminListServices, adminCreateService, adminUpdateService, adminDeleteService, type Service,
} from "../../lib/services";

/** dinar string → millimes ("30" → 30000). Empty → null. */
function toMillimes(dt: string): number | null {
  const trimmed = dt.trim();
  if (!trimmed) return null;
  const n = parseFloat(trimmed.replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 1000) : null;
}
function toDt(millimes: number | null): string {
  return millimes == null ? "" : String(millimes / 1000);
}

export function AdminServices() {
  const [services, setServices] = useState<Service[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try { setServices(await adminListServices()); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to load services."); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name || adding) return;
    setAdding(true);
    const nextSort = (services ?? []).reduce((m, s) => Math.max(m, s.sort), 0) + 1;
    try { await adminCreateService(name, nextSort, toMillimes(newPrice)); setNewName(""); setNewPrice(""); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not add service."); }
    finally { setAdding(false); }
  };

  const rename = async (s: Service, name: string) => {
    if (name.trim() === s.name || !name.trim()) return;
    setServices((list) => list?.map((x) => (x.id === s.id ? { ...x, name: name.trim() } : x)) ?? null);
    try { await adminUpdateService(s.id, { name }); } catch { load(); }
  };

  const reprice = async (s: Service, priceMillimes: number | null) => {
    if (priceMillimes === s.priceMillimes) return;
    setServices((list) => list?.map((x) => (x.id === s.id ? { ...x, priceMillimes } : x)) ?? null);
    try { await adminUpdateService(s.id, { priceMillimes }); } catch { load(); }
  };

  const toggleActive = async (s: Service) => {
    setServices((list) => list?.map((x) => (x.id === s.id ? { ...x, active: !x.active } : x)) ?? null);
    try { await adminUpdateService(s.id, { active: !s.active }); } catch { load(); }
  };

  const remove = async (s: Service) => {
    if (!window.confirm(`Delete service “${s.name}”?`)) return;
    setServices((list) => list?.filter((x) => x.id !== s.id) ?? null);
    try { await adminDeleteService(s.id); } catch { load(); }
  };

  if (error) return <div className="admin-page"><p className="admin-error">{error}</p></div>;

  return (
    <div className="admin-page">
      <header className="admin-head">
        <div>
          <h1 className="admin-h1">Services</h1>
          <p className="admin-sub">These are the services customers can reserve. Hidden ones don't show on the booking form.</p>
        </div>
      </header>

      <form className="svc-add" onSubmit={add}>
        <input className="admin-search" placeholder="New service name…" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <input className="admin-search svc-add-price" inputMode="decimal" placeholder="Price DT (optional)" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
        <button type="submit" className="admin-btn admin-btn-primary" disabled={adding || !newName.trim()}>+ Add service</button>
      </form>

      {!services ? (
        <p className="admin-muted">Loading…</p>
      ) : services.length === 0 ? (
        <p className="admin-muted">No services yet — add your first one above.</p>
      ) : (
        <div className="svc-list">
          {services.map((s) => (
            <div className={`svc-row${s.active ? "" : " off"}`} key={s.id}>
              <ServiceName service={s} onCommit={rename} />
              <ServicePrice service={s} onCommit={reprice} />
              <button
                type="button"
                className={`admin-status-toggle${s.active ? " on" : " off"}`}
                onClick={() => toggleActive(s)}
                title={s.active ? "Shown on the booking form — click to hide" : "Hidden — click to show"}
              >
                {s.active ? "Shown" : "Hidden"}
              </button>
              <button type="button" className="admin-link-btn danger" onClick={() => remove(s)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceName({ service, onCommit }: { service: Service; onCommit: (s: Service, name: string) => void }) {
  const [val, setVal] = useState(service.name);
  useEffect(() => { setVal(service.name); }, [service.name]);
  return (
    <input
      className="svc-name"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => onCommit(service, val)}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      aria-label={`Service name: ${service.name}`}
    />
  );
}

function ServicePrice({ service, onCommit }: { service: Service; onCommit: (s: Service, m: number | null) => void }) {
  const [val, setVal] = useState(toDt(service.priceMillimes));
  useEffect(() => { setVal(toDt(service.priceMillimes)); }, [service.priceMillimes]);
  return (
    <input
      className="svc-price" inputMode="decimal" placeholder="Free"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={() => onCommit(service, toMillimes(val))}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      aria-label={`Price (DT) for ${service.name}`}
      title="Price in DT — leave blank for no set price"
    />
  );
}
