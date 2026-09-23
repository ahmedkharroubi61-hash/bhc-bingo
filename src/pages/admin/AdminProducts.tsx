import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  adminListProducts, adminListOrders, adminSetStock, adminSetActive,
  adminSetHeroRank, adminDeleteProduct, type AdminProduct,
} from "../../lib/admin";
import { formatPrice } from "../../lib/format";
import { ProductForm } from "./ProductForm";

const CATEGORY_LABELS: Record<string, string> = {
  skincare: "Skincare", face: "Face Care", body: "Body Care", hair: "Hair Care",
  makeup: "Makeup", sun: "Sun Protection", baby: "Baby & Mother", wellness: "Wellness",
};

type Editing = { mode: "new" } | { mode: "edit"; product: AdminProduct } | null;

export function AdminProducts() {
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [soldByProduct, setSoldByProduct] = useState<Map<string, number>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const [prods, orders] = await Promise.all([adminListProducts(), adminListOrders()]);
      const sold = new Map<string, number>();
      for (const o of orders) {
        if (o.status === "cancelled") continue;
        for (const it of o.items) sold.set(it.productId, (sold.get(it.productId) ?? 0) + it.qty);
      }
      setProducts(prods);
      setSoldByProduct(sold);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load products.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    if (!products) return [];
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => `${p.title} ${p.brand}`.toLowerCase().includes(q));
  }, [products, query]);

  const outOfStock = products?.filter((p) => p.stock === 0).length ?? 0;

  // Distinct existing brands + size labels, for the pick-or-type lists in the form.
  const brandOptions = useMemo(
    () => Array.from(new Set((products ?? []).map((p) => p.brand).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [products],
  );
  const sizeOptions = useMemo(
    () => Array.from(new Set((products ?? []).flatMap((p) => p.sizes.map((s) => s.label)).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [products],
  );

  const onStockCommit = async (p: AdminProduct, next: number) => {
    if (next === p.stock || Number.isNaN(next)) return;
    setProducts((list) => list?.map((x) => (x.id === p.id ? { ...x, stock: Math.max(0, next) } : x)) ?? null);
    try { await adminSetStock(p.id, next); } catch { load(); }
  };

  const onToggleActive = async (p: AdminProduct) => {
    setProducts((list) => list?.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)) ?? null);
    try { await adminSetActive(p.id, !p.active); } catch { load(); }
  };

  const onHeroRankCommit = async (p: AdminProduct, next: number | null) => {
    if (next === p.heroRank) return;
    setProducts((list) => list?.map((x) => (x.id === p.id ? { ...x, heroRank: next } : x)) ?? null);
    try { await adminSetHeroRank(p.id, next); } catch { load(); }
  };

  const onDelete = async (p: AdminProduct) => {
    if (!window.confirm(`Delete “${p.title}”? This cannot be undone.`)) return;
    try { await adminDeleteProduct(p.id); await load(); }
    catch (e) { window.alert(e instanceof Error ? e.message : "Delete failed. It may be referenced by past orders — set it inactive instead."); }
  };

  if (error) return <div className="admin-page"><p className="admin-error">{error}</p></div>;

  return (
    <div className="admin-page">
      <header className="admin-head">
        <div>
          <h1 className="admin-h1">Stock &amp; Products</h1>
          <p className="admin-sub">
            {products ? `${products.length} products` : "Loading…"}
            {outOfStock > 0 ? <span className="admin-pill-warn"> · {outOfStock} out of stock</span> : null}
          </p>
        </div>
        <div className="admin-head-actions">
          <input className="admin-search" placeholder="Search products…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button type="button" className="admin-btn admin-btn-primary" onClick={() => setEditing({ mode: "new" })}>+ Add product</button>
        </div>
      </header>

      {!products ? (
        <p className="admin-muted">Loading products…</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th><th>Category</th><th>Price</th>
                <th className="ta-c">Stock</th><th className="ta-c">Sold</th>
                <th className="ta-c" title="Homepage hero order — lower shows first, blank hides">Homepage</th>
                <th className="ta-c">Status</th><th className="ta-r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id} className={p.stock === 0 ? "row-oos" : ""}>
                  <td>
                    <div className="admin-prod-cell">
                      <img src={p.image} alt="" loading="lazy" />
                      <div>
                        <span className="admin-prod-title">{p.title}</span>
                        <span className="admin-prod-brand">{p.brand}</span>
                      </div>
                    </div>
                  </td>
                  <td>{CATEGORY_LABELS[p.category] ?? p.category}</td>
                  <td>
                    {formatPrice(p.priceMillimes)}
                    {p.oldPriceMillimes ? <span className="admin-oldprice">{formatPrice(p.oldPriceMillimes)}</span> : null}
                  </td>
                  <td className="ta-c"><StockCell product={p} onCommit={onStockCommit} /></td>
                  <td className="ta-c">
                    {(soldByProduct.get(p.id) ?? 0) > 0
                      ? <Link className="admin-sold-link" to={`/admin/orders?product=${p.id}`} title="View orders for this product">{soldByProduct.get(p.id)}</Link>
                      : <span className="admin-muted">0</span>}
                  </td>
                  <td className="ta-c"><HeroRankCell product={p} onCommit={onHeroRankCommit} /></td>
                  <td className="ta-c">
                    <button
                      type="button"
                      className={`admin-status-toggle${p.active ? " on" : " off"}`}
                      onClick={() => onToggleActive(p)}
                      title={p.active ? "Visible on storefront — click to hide" : "Hidden — click to publish"}
                    >
                      {p.active ? "Live" : "Hidden"}
                    </button>
                  </td>
                  <td className="ta-r">
                    <button type="button" className="admin-link-btn" onClick={() => setEditing({ mode: "edit", product: p })}>Edit</button>
                    <button type="button" className="admin-link-btn danger" onClick={() => onDelete(p)}>Delete</button>
                  </td>
                </tr>
              ))}
              {visible.length === 0 ? <tr><td colSpan={8} className="admin-muted ta-c">No products match “{query}”.</td></tr> : null}
            </tbody>
          </table>
        </div>
      )}

      {editing ? (
        <ProductForm
          product={editing.mode === "edit" ? editing.product : null}
          brandOptions={brandOptions}
          sizeOptions={sizeOptions}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await load(); }}
        />
      ) : null}
    </div>
  );
}

/** Inline homepage-hero priority. Blank = not featured; a number = order (1 first). */
function HeroRankCell({ product, onCommit }: { product: AdminProduct; onCommit: (p: AdminProduct, n: number | null) => void }) {
  const [val, setVal] = useState(product.heroRank == null ? "" : String(product.heroRank));
  useEffect(() => { setVal(product.heroRank == null ? "" : String(product.heroRank)); }, [product.heroRank]);
  const commit = () => {
    const trimmed = val.trim();
    onCommit(product, trimmed === "" ? null : parseInt(trimmed, 10));
  };
  return (
    <input
      className={`admin-stock-input admin-hero-input${product.heroRank != null ? " on" : ""}`}
      type="number" min={1} inputMode="numeric" placeholder="—"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      aria-label={`Homepage priority for ${product.title}`}
      title="Homepage hero order — lower shows first, blank hides"
    />
  );
}

/** Inline stock editor — commits on blur or Enter. */
function StockCell({ product, onCommit }: { product: AdminProduct; onCommit: (p: AdminProduct, n: number) => void }) {
  const [val, setVal] = useState(String(product.stock));
  useEffect(() => { setVal(String(product.stock)); }, [product.stock]);
  return (
    <input
      className={`admin-stock-input${product.stock === 0 ? " zero" : ""}`}
      type="number" min={0} inputMode="numeric"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={() => onCommit(product, parseInt(val, 10))}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      aria-label={`Stock for ${product.title}`}
    />
  );
}
