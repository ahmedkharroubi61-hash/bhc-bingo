import { useEffect, useMemo, useState } from "react";
import { getProducts } from "../../lib/products";
import { unitPriceFor } from "../../lib/useCartLines";
import { isOutOfStock } from "../../lib/stock";
import { formatPrice } from "../../lib/format";
import { createPosSale, getErrorMessage, type OrderLineInput } from "../../lib/orders";
import { STORE } from "../../lib/config";
import type { Order, Product } from "../../lib/types";

interface TicketLine {
  product: Product;
  size: string | null;
  qty: number;
}

const keyOf = (l: TicketLine): string => `${l.product.id}|${l.size ?? ""}`;
const maxFor = (p: Product): number => (typeof p.stock === "number" ? p.stock : Infinity);

function ticketDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function AdminPos() {
  const [catalog, setCatalog] = useState<Product[] | null>(null);
  const [query, setQuery] = useState("");
  const [ticket, setTicket] = useState<TicketLine[]>([]);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Order | null>(null);

  const loadCatalog = () => {
    setCatalog(null);
    getProducts().then(setCatalog).catch(() => setCatalog([]));
  };
  useEffect(loadCatalog, []);

  const subtotal = ticket.reduce((sum, l) => sum + unitPriceFor(l.product, l.size ?? undefined) * l.qty, 0);
  const itemCount = ticket.reduce((n, l) => n + l.qty, 0);

  const results = useMemo(() => {
    const list = catalog ?? [];
    const q = query.trim().toLowerCase();
    const filtered = q ? list.filter((p) => `${p.brand} ${p.title}`.toLowerCase().includes(q)) : list;
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

  const completeSale = async () => {
    if (placing) return;
    if (ticket.length === 0) { setError("Add at least one product."); return; }
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
      const order = await createPosSale(items);
      setDone(order);
      setTicket([]);
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
    loadCatalog(); // stock changed — refresh
  };

  if (done) {
    return (
      <div className="admin-page">
        <div className="pos-done no-print">
          <div className="pos-done-check" aria-hidden="true">✓</div>
          <h1 className="admin-h1">Sale complete</h1>
          <p className="admin-sub">Ticket <strong>{done.id}</strong> · stock updated</p>
        </div>

        {/* Printable ticket */}
        <div className="pos-receipt" id="pos-receipt">
          <div className="rcpt-head">
            <div className="rcpt-store">{STORE.name}</div>
            <div className="rcpt-sub">{STORE.area}</div>
          </div>
          <div className="rcpt-meta">
            <span>Ticket {done.id}</span>
            <span>{ticketDate(done.createdAt)}</span>
          </div>
          <div className="rcpt-rule" />
          <ul className="rcpt-items">
            {done.items.map((i, n) => (
              <li key={n}>
                <span className="rcpt-q">{i.qty}×</span>
                <span className="rcpt-t">{i.title}</span>
                <span className="rcpt-p">{formatPrice(i.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="rcpt-rule" />
          <div className="rcpt-total"><span>TOTAL</span><span>{formatPrice(done.total)}</span></div>
          <div className="rcpt-foot">Paid in cash · Thank you!</div>
        </div>

        <div className="pos-done-actions no-print">
          <button type="button" className="admin-btn primary" onClick={() => window.print()}>Print ticket</button>
          <button type="button" className="admin-btn" onClick={newSale}>New sale</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page pos">
      <header className="admin-head">
        <div>
          <h1 className="admin-h1">New sale</h1>
          <p className="admin-sub">Pick products to sell in store — completing the sale removes them from stock and prints a ticket.</p>
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

          <div className="pos-totals">
            <div className="pos-tot-row grand"><span>Total</span><span>{formatPrice(subtotal)}</span></div>
          </div>

          {error ? <p className="admin-error pos-error" role="alert">{error}</p> : null}

          <button type="button" className="admin-btn primary pos-place" onClick={completeSale} disabled={placing || ticket.length === 0}>
            {placing ? "Completing…" : `Complete sale · ${formatPrice(subtotal)}`}
          </button>
        </aside>
      </div>
    </div>
  );
}
