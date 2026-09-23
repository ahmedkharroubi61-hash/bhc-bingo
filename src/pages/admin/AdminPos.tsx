import { useEffect, useMemo, useState } from "react";
import { getProducts } from "../../lib/products";
import { unitPriceFor } from "../../lib/useCartLines";
import { isOutOfStock } from "../../lib/stock";
import { formatPrice } from "../../lib/format";
import { placeOrder, getErrorMessage, type OrderLineInput } from "../../lib/orders";
import { DELIVERY_FEE_MILLIMES, FREE_DELIVERY_OVER_MILLIMES } from "../../lib/config";
import type { CustomerDetails, FulfillmentMethod, Order, Product } from "../../lib/types";
import { IconPin } from "./adminIcons";

interface TicketLine {
  product: Product;
  size: string | null;
  qty: number;
}

const keyOf = (l: TicketLine): string => `${l.product.id}|${l.size ?? ""}`;
const maxFor = (p: Product): number => (typeof p.stock === "number" ? p.stock : Infinity);

const EMPTY_CUSTOMER: CustomerDetails = {
  name: "", phone: "", address: "", city: "", notes: "", fulfillment: "pickup",
};

export function AdminPos() {
  const [catalog, setCatalog] = useState<Product[] | null>(null);
  const [query, setQuery] = useState("");
  const [ticket, setTicket] = useState<TicketLine[]>([]);
  const [customer, setCustomer] = useState<CustomerDetails>(EMPTY_CUSTOMER);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Order | null>(null);

  const loadCatalog = () => {
    setCatalog(null);
    getProducts().then(setCatalog).catch(() => setCatalog([]));
  };
  useEffect(loadCatalog, []);

  const isPickup = customer.fulfillment === "pickup";
  const subtotal = ticket.reduce((sum, l) => sum + unitPriceFor(l.product, l.size ?? undefined) * l.qty, 0);
  const delivery = isPickup ? 0 : subtotal >= FREE_DELIVERY_OVER_MILLIMES ? 0 : DELIVERY_FEE_MILLIMES;
  const total = subtotal + delivery;
  const itemCount = ticket.reduce((n, l) => n + l.qty, 0);

  const results = useMemo(() => {
    const list = catalog ?? [];
    const q = query.trim().toLowerCase();
    const filtered = q
      ? list.filter((p) => `${p.brand} ${p.title}`.toLowerCase().includes(q))
      : list;
    return filtered.slice(0, 60);
  }, [catalog, query]);

  const addProduct = (p: Product) => {
    if (isOutOfStock(p)) return;
    setError(null);
    setTicket((t) => {
      const size = p.sizes?.[0]?.label ?? null;
      const k = `${p.id}|${size ?? ""}`;
      const idx = t.findIndex((l) => keyOf(l) === k);
      if (idx >= 0) {
        const next = [...t];
        next[idx] = { ...next[idx], qty: Math.min(maxFor(p), next[idx].qty + 1) };
        return next;
      }
      return [...t, { product: p, size, qty: 1 }];
    });
  };

  const changeQty = (k: string, delta: number) => {
    setTicket((t) => t.flatMap((l) => {
      if (keyOf(l) !== k) return [l];
      const q = Math.min(maxFor(l.product), Math.max(0, l.qty + delta));
      return q === 0 ? [] : [{ ...l, qty: q }];
    }));
  };

  const removeLine = (k: string) => setTicket((t) => t.filter((l) => keyOf(l) !== k));

  const changeSize = (k: string, newSize: string) => {
    setTicket((t) => {
      const line = t.find((l) => keyOf(l) === k);
      if (!line) return t;
      const rest = t.filter((l) => keyOf(l) !== k);
      const targetKey = `${line.product.id}|${newSize}`;
      const existing = rest.find((l) => keyOf(l) === targetKey);
      if (existing) {
        return rest.map((l) => keyOf(l) === targetKey
          ? { ...l, qty: Math.min(maxFor(l.product), l.qty + line.qty) } : l);
      }
      return [...rest, { ...line, size: newSize }];
    });
  };

  const setField = (field: keyof CustomerDetails) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setCustomer((c) => ({ ...c, [field]: e.target.value }));
  const setFulfillment = (fulfillment: FulfillmentMethod) => setCustomer((c) => ({ ...c, fulfillment }));

  const place = async () => {
    if (placing) return;
    if (ticket.length === 0) { setError("Add at least one product to the ticket."); return; }
    if (!customer.name.trim() || !customer.phone.trim()) { setError("Enter the customer's name and phone."); return; }
    if (!isPickup && (!customer.address.trim() || !customer.city.trim())) {
      setError("Enter the delivery address and city, or switch to pickup."); return;
    }
    setError(null);
    setPlacing(true);
    const items: OrderLineInput[] = ticket.map((l) => ({
      productId: l.product.id,
      qty: l.qty,
      size: l.size,
      title: l.product.title,
      unitMillimes: unitPriceFor(l.product, l.size ?? undefined),
    }));
    try {
      const order = await placeOrder(items, customer);
      setDone(order);
      setTicket([]);
      setCustomer(EMPTY_CUSTOMER);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPlacing(false);
    }
  };

  const newSale = () => {
    setDone(null);
    setError(null);
    setQuery("");
    loadCatalog(); // stock changed server-side — refresh
  };

  if (done) {
    return (
      <div className="admin-page">
        <div className="pos-done">
          <div className="pos-done-check" aria-hidden="true">✓</div>
          <h1 className="admin-h1">Sale placed</h1>
          <p className="admin-sub">Order <strong>{done.id}</strong> · {done.fulfillment === "pickup" ? "In-store pickup" : "Home delivery"}</p>
          <div className="pos-done-total">{formatPrice(done.total)} <span>Cash on {done.fulfillment === "pickup" ? "pickup" : "delivery"}</span></div>
          <ul className="pos-done-items">
            {done.items.map((i, n) => (
              <li key={n}><span>{i.qty}× {i.title}</span><span>{formatPrice(i.lineTotal)}</span></li>
            ))}
          </ul>
          <button type="button" className="admin-btn primary" onClick={newSale}>New sale</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page pos">
      <header className="admin-head">
        <div>
          <h1 className="admin-h1">New sale</h1>
          <p className="admin-sub">Ring up a walk-in or phone order — same stock, prices and orders as the shop.</p>
        </div>
      </header>

      <div className="pos-grid">
        {/* Catalogue */}
        <section className="pos-catalog" aria-label="Products">
          <input
            className="admin-search pos-search"
            placeholder="Search products by name or brand…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {catalog === null ? (
            <p className="admin-muted">Loading products…</p>
          ) : results.length === 0 ? (
            <p className="admin-muted">No products match “{query}”.</p>
          ) : (
            <div className="pos-products">
              {results.map((p) => {
                const oos = isOutOfStock(p);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`pos-prod${oos ? " oos" : ""}`}
                    onClick={() => addProduct(p)}
                    disabled={oos}
                    title={oos ? "Out of stock" : "Add to ticket"}
                  >
                    <span className="pos-prod-img"><img src={p.image} alt="" loading="lazy" /></span>
                    <span className="pos-prod-brand">{p.brand}</span>
                    <span className="pos-prod-title">{p.title}</span>
                    <span className="pos-prod-foot">
                      <span className="pos-prod-price">{formatPrice(p.priceMillimes)}</span>
                      <span className={`pos-prod-stock${oos ? " out" : ""}`}>{oos ? "Rupture" : typeof p.stock === "number" ? `${p.stock} left` : "In stock"}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Ticket */}
        <aside className="pos-ticket" aria-label="Current sale">
          <h2 className="pos-ticket-h">Ticket {itemCount > 0 ? <span className="pos-ticket-count">{itemCount}</span> : null}</h2>

          {ticket.length === 0 ? (
            <p className="pos-empty">Tap a product to add it to the sale.</p>
          ) : (
            <div className="pos-lines">
              {ticket.map((l) => {
                const k = keyOf(l);
                const unit = unitPriceFor(l.product, l.size ?? undefined);
                return (
                  <div className="pos-line" key={k}>
                    <div className="pos-line-main">
                      <span className="pos-line-title">{l.product.title}</span>
                      {l.product.sizes && l.product.sizes.length > 0 ? (
                        <select className="pos-line-size" value={l.size ?? ""} onChange={(e) => changeSize(k, e.target.value)}>
                          {l.product.sizes.map((s) => <option key={s.label} value={s.label}>{s.label}</option>)}
                        </select>
                      ) : null}
                      <span className="pos-line-unit">{formatPrice(unit)} each</span>
                    </div>
                    <div className="pos-qty">
                      <button type="button" onClick={() => changeQty(k, -1)} aria-label="Decrease">−</button>
                      <span>{l.qty}</span>
                      <button type="button" onClick={() => changeQty(k, +1)} aria-label="Increase" disabled={l.qty >= maxFor(l.product)}>+</button>
                    </div>
                    <span className="pos-line-total">{formatPrice(unit * l.qty)}</span>
                    <button type="button" className="pos-line-x" onClick={() => removeLine(k)} aria-label="Remove">×</button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pos-fulfil" role="tablist" aria-label="Fulfilment">
            <button type="button" role="tab" aria-selected={isPickup} className={`pos-fulfil-opt${isPickup ? " active" : ""}`} onClick={() => setFulfillment("pickup")}>
              <IconPin size={15} /> Pickup
            </button>
            <button type="button" role="tab" aria-selected={!isPickup} className={`pos-fulfil-opt${!isPickup ? " active" : ""}`} onClick={() => setFulfillment("delivery")}>
              Delivery
            </button>
          </div>

          <div className="pos-cust">
            <div className="pos-cust-row">
              <input placeholder="Customer name *" value={customer.name} onChange={setField("name")} autoComplete="off" />
              <input placeholder="Phone *" type="tel" value={customer.phone} onChange={setField("phone")} autoComplete="off" />
            </div>
            {!isPickup ? (
              <div className="pos-cust-row">
                <input placeholder="Address *" value={customer.address} onChange={setField("address")} autoComplete="off" />
                <input placeholder="City *" value={customer.city} onChange={setField("city")} autoComplete="off" />
              </div>
            ) : null}
            <input className="pos-cust-notes" placeholder="Notes (optional)" value={customer.notes} onChange={setField("notes")} autoComplete="off" />
          </div>

          <div className="pos-totals">
            <div className="pos-tot-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="pos-tot-row"><span>{isPickup ? "Pickup" : "Delivery"}</span><span>{delivery === 0 ? "Free" : formatPrice(delivery)}</span></div>
            <div className="pos-tot-row grand"><span>Total (COD)</span><span>{formatPrice(total)}</span></div>
          </div>

          {error ? <p className="admin-error pos-error" role="alert">{error}</p> : null}

          <button type="button" className="admin-btn primary pos-place" onClick={place} disabled={placing || ticket.length === 0}>
            {placing ? "Placing…" : `Place order · ${formatPrice(total)}`}
          </button>
        </aside>
      </div>
    </div>
  );
}
