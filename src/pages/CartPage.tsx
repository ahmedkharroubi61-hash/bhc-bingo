import { Link } from "react-router-dom";
import { useStore, lineKey } from "../context/StoreContext";
import { useCartLines } from "../lib/useCartLines";
import { formatPrice } from "../lib/format";
import { SectionHead } from "../components/SectionHead";

export function CartPage() {
  const { setQty, removeFromCart } = useStore();
  const { lines, subtotal } = useCartLines();

  return (
    <section className="section">
      <div className="container">
        <SectionHead idx="—" title="Your cart" meta={`${lines.length} item${lines.length === 1 ? "" : "s"}`} />

        {lines.length === 0 ? (
          <div className="legal">
            <p className="muted">Your cart is empty.</p>
            <p><Link className="btn btn-gold" to="/category/all">Browse products</Link></p>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-lines">
              {lines.map(({ line, product, unitPrice, lineTotal }) => (
                <div className="cart-row" key={lineKey(line.id, line.size)}>
                  <span className="cart-thumb"><img src={product.image} alt="" /></span>
                  <div className="cart-info">
                    <span className="brand-name">{product.brand}</span>
                    <h3 className="cart-title">{product.title}</h3>
                    {line.size ? <span className="l-size">Size: {line.size}</span> : null}
                    <span className="l-price">{formatPrice(unitPrice)}</span>
                    <div className="qty">
                      <button type="button" aria-label={`Decrease quantity of ${product.title}`} onClick={() => setQty(line.id, line.qty - 1, line.size)}>&minus;</button>
                      <span>{line.qty}</span>
                      <button type="button" aria-label={`Increase quantity of ${product.title}`} onClick={() => setQty(line.id, line.qty + 1, line.size)}>+</button>
                    </div>
                  </div>
                  <div className="cart-line-end">
                    <span className="price">{formatPrice(lineTotal)}</span>
                    <button className="l-remove" type="button" onClick={() => removeFromCart(line.id, line.size)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <aside className="cart-summary">
              <h3 className="summary-h">Order summary</h3>
              <div className="summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              <div className="summary-row muted"><span>Delivery</span><span>Calculated at checkout</span></div>
              <div className="summary-row total"><span>Total</span><span>{formatPrice(subtotal)}</span></div>
              <Link className="btn btn-gold btn-block" to="/checkout">Proceed to checkout</Link>
              <Link className="link-arrow" to="/category/all" style={{ marginTop: 16 }}>Continue shopping</Link>
              <p className="note-sm">Cash on Delivery available · Secure order</p>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
