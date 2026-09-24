import { useCallback, useEffect, useMemo, useState } from "react";
import {
  adminListReservations, adminSetReservationStatus, adminDeleteReservation, type AdminReservation,
} from "../../lib/reservations";
import type { ReservationSlot, ReservationStatus } from "../../lib/types";

const STATUS_LABEL: Record<ReservationStatus, string> = {
  received: "Received", confirmed: "Confirmed", cancelled: "Cancelled",
};
const SLOT_LABEL: Record<ReservationSlot, string> = { "10:00": "10:00 AM", "15:00": "3:00 PM" };
const FILTERS: { key: ReservationStatus | "all"; label: string }[] = [
  { key: "all", label: "All" }, { key: "received", label: "Received" },
  { key: "confirmed", label: "Confirmed" }, { key: "cancelled", label: "Cancelled" },
];

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}

export function AdminReservations() {
  const [items, setItems] = useState<AdminReservation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReservationStatus | "all">("all");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try { setItems(await adminListReservations()); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to load reservations."); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    return items.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!q) return true;
      return `${r.id} ${r.customer.name} ${r.customer.phone} ${r.service}`.toLowerCase().includes(q);
    });
  }, [items, filter, query]);

  const setStatus = async (r: AdminReservation, status: ReservationStatus) => {
    setItems((list) => list?.map((x) => (x.id === r.id ? { ...x, status } : x)) ?? null);
    try { await adminSetReservationStatus(r.id, status); } catch { load(); }
  };

  const remove = async (r: AdminReservation) => {
    if (!window.confirm(`Permanently delete cancelled reservation ${r.id}?`)) return;
    const prev = items;
    setItems((list) => list?.filter((x) => x.id !== r.id) ?? null);
    try { await adminDeleteReservation(r.id); }
    catch (e) { setItems(prev); window.alert(e instanceof Error ? e.message : "Delete failed."); }
  };

  if (error) return <div className="admin-page"><p className="admin-error">{error}</p></div>;

  return (
    <div className="admin-page">
      <header className="admin-head">
        <div>
          <h1 className="admin-h1">Reservations</h1>
          <p className="admin-sub">{items ? `${visible.length} of ${items.length} reservations` : "Loading…"}</p>
        </div>
        <input className="admin-search" placeholder="Search name, phone, service, id…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </header>

      <div className="admin-tabs">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" className={`admin-tab${filter === f.key ? " active" : ""}`} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {!items ? <p className="admin-muted">Loading reservations…</p>
        : visible.length === 0 ? <p className="admin-muted">No reservations match.</p>
        : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ref</th><th>Customer</th><th>Service</th><th>When</th>
                  <th className="ta-c">Status</th><th className="ta-r">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id} className={`status-${r.status}`}>
                    <td><span className="admin-order-id">{r.id}</span></td>
                    <td>
                      <div><strong>{r.customer.name}</strong></div>
                      <div className="admin-prod-brand">{r.customer.phone}</div>
                      {r.notes ? <div className="admin-detail-notes"><em>Note:</em> {r.notes}</div> : null}
                    </td>
                    <td>{r.service}</td>
                    <td>{formatDate(r.date)}<br /><strong>{SLOT_LABEL[r.slot]}</strong></td>
                    <td className="ta-c"><span className={`admin-badge badge-${r.status}`}>{STATUS_LABEL[r.status]}</span></td>
                    <td className="ta-r">
                      <button type="button" className="admin-btn sm" disabled={r.status === "confirmed"} onClick={() => setStatus(r, "confirmed")}>Confirm</button>
                      <button type="button" className="admin-btn sm danger" disabled={r.status === "cancelled"} onClick={() => setStatus(r, "cancelled")}>Cancel</button>
                      {r.status === "cancelled" ? (
                        <button type="button" className="admin-btn sm danger admin-btn-del" onClick={() => remove(r)}>Delete</button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
