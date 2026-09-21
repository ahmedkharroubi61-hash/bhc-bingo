import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useStore, lineKey } from "../context/StoreContext";
import { useCartLines } from "../lib/useCartLines";
import { formatPrice } from "../lib/format";

export function CartDrawer() {
  const { drawerOpen, closeDrawer, setQty, removeFromCart } = useStore();
  const { lines, subtotal } = useCartLines();

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen, closeDrawer]);

  return (
    <>
      <div
        className={`drawer-overlay${drawerOpen ? " open" : ""}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />
      <aside
        className={`drawer${drawerOpen ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        aria-hidden={!drawerOpen}
      >
        <div className="drawer-head">
          <h2>Your Cart</h2>
          <button className="drawer-close" type="button" onClick={closeDrawer} aria-label="Close cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="drawer-body">
          {lines.length === 0 ? (
            <p className="drawer-empty">Your cart is empty.</p>
          ) : (
            lines.map(({ line, product, unitPrice, lineTotal }) => (
              <div className="drawer-line" key={lineKey(line.id, line.size)}>
                <span className="thumb"><img src={product.image} alt="" /></span>
                <div>
                  <div className="l-title">{product.title}</div>
                  {line.size ? <div className="l-size">{line.size}</div> : null}
                  <div className="l-price">{formatPrice(unitPrice)}</div>
                  <div className="qty">
                    <button type="button" aria-label={`Decrease quantity of ${product.title}`} onClick={() => setQty(line.id, line.qty - 1, line.size)}>&minus;</button>
                    <span>{line.qty}</span>
                    <button type="button" aria-label={`Increase quantity of ${product.title}`} onClick={() => setQty(line.id, line.qty + 1, line.size)}>+</button>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="price">{formatPrice(lineTotal)}</div>
                  <button className="l-remove" type="button" onClick={() => removeFromCart(line.id, line.size)}>Remove</button>
                </div>
              </div>
            ))
          )}
        </div>

        {lines.length > 0 ? (
          <div className="drawer-foot">
            <div className="row">
              <span className="lbl">Subtotal</span>
              <span className="total">{formatPrice(subtotal)}</span>
            </div>
            <Link className="btn btn-gold btn-block" to="/cart" onClick={closeDrawer}>Checkout (Cash on Delivery)</Link>
            <p className="note-sm">Shipping calculated at checkout · Pay on delivery</p>
          </div>
        ) : null}
      </aside>
    </>
  );
}
