import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { adminListOrders, adminSetOrderStatus, type AdminOrder, type OrderStatus } from "../../lib/admin";
import { formatPrice } from "../../lib/format";

const STATUS_LABEL: Record<OrderStatus, string> = {
  received: "Received", confirmed: "Confirmed", cancelled: "Cancelled",
};
const FILTERS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all", label: "All" }, { key: "received", label: "Received" },
  { key: "confirmed", label: "Confirmed" }, { key: "cancelled", label: "Cancelled" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const productFilter = searchParams.get("product");

  const load = useCallback(async () => {
    try { setOrders(await adminListOrders()); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to load orders."); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const productName = useMemo(() => {
    if (!productFilter || !orders) return null;
    for (const o of orders) {
      const hit = o.items.find((i) => i.productId === productFilter);
      if (hit) return hit.title;
    }
    return productFilter;
  }, [productFilter, orders]);

  const visible = useMemo(() => {
    if (!orders) return [];
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (productFilter && !o.items.some((i) => i.productId === productFilter)) return false;
      if (!q) return true;
      return `${o.id} ${o.customer.name} ${o.customer.phone} ${o.customer.city}`.toLowerCase().includes(q);
    });
  }, [orders, filter, query, productFilter]);

  const setStatus = async (o: AdminOrder, status: OrderStatus) => {
    setOrders((list) => list?.map((x) => (x.id === o.id ? { ...x, status } : x)) ?? null);
    try { await adminSetOrderStatus(o.id, status); } catch { load(); }
  };

  if (error) return <div className="admin-page"><p className="admin-error">{error}</p></div>;

  return (
    <div className="admin-page">
      <header className="admin-head">
        <div>
          <h1 className="admin-h1">Orders</h1>
          <p className="admin-sub">{orders ? `${visible.length} of ${orders.length} orders` : "Loading…"}</p>
        </div>
        <input className="admin-search" placeholder="Search name, phone, city, id…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </header>

      {productFilter ? (
        <div className="admin-filter-banner">
          Showing orders for <strong>{productName}</strong>
          <button type="button" className="admin-link-btn" onClick={() => setSearchParams({})}>Clear</button>
        </div>
      ) : null}

      <div className="admin-tabs">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" className={`admin-tab${filter === f.key ? " active" : ""}`} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {!orders ? <p className="admin-muted">Loading orders…</p>
        : visible.length === 0 ? <p className="admin-muted">No orders match.</p>
        : (
          <div className="admin-orders">
            {visible.map((o) => (
              <article key={o.id} className={`admin-order status-${o.status}`}>
                <button type="button" className="admin-order-top" onClick={() => setExpanded(expanded === o.id ? null : o.id)} aria-expanded={expanded === o.id}>
                  <span className="admin-order-id">{o.id}</span>
                  <span className="admin-order-cust">
                    <strong>{o.customer.name}</strong>
                    <span className="admin-order-meta">{o.customer.city} · {o.customer.phone}</span>
                  </span>
                  <span className="admin-order-when">{formatDate(o.createdAt)}</span>
                  <span className="admin-order-count">{o.items.reduce((n, i) => n + i.qty, 0)} items</span>
                  <span className="admin-order-total">{formatPrice(o.totalMillimes)}</span>
                  <span className={`admin-badge badge-${o.status}`}>{STATUS_LABEL[o.status]}</span>
                </button>

                {expanded === o.id ? (
                  <div className="admin-order-detail">
                    <div className="admin-order-cols">
                      <div>
                        <h3 className="admin-detail-h">Items</h3>
                        <ul className="admin-detail-items">
                          {o.items.map((i, idx) => (
                            <li key={idx}><span>{i.qty}× {i.title}</span><span>{formatPrice(i.lineMillimes)}</span></li>
                          ))}
                        </ul>
                        <div className="admin-detail-totals">
                          <span>Subtotal</span><span>{formatPrice(o.subtotalMillimes)}</span>
                          <span>Delivery</span><span>{o.deliveryMillimes === 0 ? "Free" : formatPrice(o.deliveryMillimes)}</span>
                          <span className="tot">Total (COD)</span><span className="tot">{formatPrice(o.totalMillimes)}</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="admin-detail-h">Delivery</h3>
                        <p className="admin-detail-addr">
                          <strong>{o.customer.name}</strong><br />
                          {o.customer.phone}<br />
                          {o.customer.address}<br />
                          {o.customer.city}
                        </p>
                        {o.notes ? <p className="admin-detail-notes"><em>Note:</em> {o.notes}</p> : null}
                      </div>
                    </div>
                    <div className="admin-order-actions">
                      <span className="admin-detail-h">Update status:</span>
                      <button type="button" className="admin-btn sm" disabled={o.status === "confirmed"} onClick={() => setStatus(o, "confirmed")}>Mark confirmed</button>
                      <button type="button" className="admin-btn sm" disabled={o.status === "received"} onClick={() => setStatus(o, "received")}>Mark received</button>
                      <button type="button" className="admin-btn sm danger" disabled={o.status === "cancelled"} onClick={() => setStatus(o, "cancelled")}>Cancel order</button>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
    </div>
  );
}
