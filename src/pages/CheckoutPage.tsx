import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore, lineKey } from "../context/StoreContext";
import { useCartLines } from "../lib/useCartLines";
import { formatPrice } from "../lib/format";
import { SectionHead } from "../components/SectionHead";
import { WHATSAPP_NUMBER, DELIVERY_FEE_MILLIMES, FREE_DELIVERY_OVER_MILLIMES } from "../lib/config";
import { createOrder, getErrorMessage } from "../lib/orders";
import type { CustomerDetails, Order } from "../lib/types";

function whatsappHref(order: Order): string {
  const lines = order.items.map((i) => `• ${i.qty}× ${i.title} — ${formatPrice(i.lineTotal)}`).join("\n");
  const msg =
    `New order ${order.id}\n${lines}\n\n` +
    `Subtotal: ${formatPrice(order.subtotal)}\n` +
    `Delivery: ${order.delivery === 0 ? "Free" : formatPrice(order.delivery)}\n` +
    `Total: ${formatPrice(order.total)} (Cash on Delivery)\n\n` +
    `Name: ${order.customer.name}\nPhone: ${order.customer.phone}\n` +
    `Address: ${order.customer.address}, ${order.customer.city}` +
    (order.customer.notes ? `\nNotes: ${order.customer.notes}` : "");
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { clearCart } = useStore();
  const { lines, subtotal } = useCartLines();
  const [form, setForm] = useState<CustomerDetails>({ name: "", phone: "", address: "", city: "", notes: "" });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const delivery = subtotal >= FREE_DELIVERY_OVER_MILLIMES ? 0 : DELIVERY_FEE_MILLIMES;
  const total = subtotal + delivery;
  const set = (k: keyof CustomerDetails) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = (): boolean => {
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim()) {
      setError("Please fill in your name, phone, address and city.");
      return false;
    }
    if (!consent) {
      setError("Please accept the order terms to continue.");
      return false;
    }
    setError("");
    return true;
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0 || !validate() || submitting) return;
    setSubmitting(true);
    try {
      const order = await createOrder(lines, form);
      clearCart();
      navigate("/order-confirmed", { state: { order } });
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  const orderOnWhatsapp = async () => {
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      const order = await createOrder(lines, form);
      window.open(whatsappHref(order), "_blank", "noopener");
      clearCart();
      navigate("/order-confirmed", { state: { order } });
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  if (lines.length === 0) {
    return (
      <section className="section">
        <div className="container legal">
          <SectionHead idx="—" title="Checkout" />
          <p className="muted">Your cart is empty — nothing to check out.</p>
          <p><Link className="btn btn-gold" to="/category/all">Browse products</Link></p>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <SectionHead idx="—" title="Checkout" meta="Cash on Delivery" />
        <div className="cart-layout">
          <form className="checkout-form" onSubmit={placeOrder} noValidate>
            <h3 className="summary-h">Delivery details</h3>
            <div className="field"><label htmlFor="co-name">Full name <span className="req" aria-hidden="true">*</span></label><input id="co-name" value={form.name} onChange={set("name")} autoComplete="name" required /></div>
            <div className="field"><label htmlFor="co-phone">Phone <span className="req" aria-hidden="true">*</span></label><input id="co-phone" type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" required /></div>
            <div className="field"><label htmlFor="co-address">Address <span className="req" aria-hidden="true">*</span></label><input id="co-address" value={form.address} onChange={set("address")} autoComplete="street-address" required /></div>
            <div className="field"><label htmlFor="co-city">City <span className="req" aria-hidden="true">*</span></label><input id="co-city" value={form.city} onChange={set("city")} autoComplete="address-level2" required /></div>
            <div className="field"><label htmlFor="co-notes">Order notes (optional)</label><textarea id="co-notes" rows={3} value={form.notes} onChange={set("notes")} /></div>

            <div className="consent-line" style={{ marginTop: 4 }}>
              <input id="co-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <label htmlFor="co-consent">I confirm my details are correct and agree to the <Link to="/terms-and-conditions">order terms</Link> and <Link to="/privacy-policy">Privacy Policy</Link>.</label>
            </div>
            {error ? <p className="form-status err" role="alert">{error}</p> : null}

            <button className="btn btn-gold btn-block" type="submit" style={{ marginTop: 18 }} disabled={submitting}>{submitting ? "Placing order…" : "Place order · Cash on Delivery"}</button>
            {WHATSAPP_NUMBER ? (
              <button className="btn btn-outline btn-block" type="button" onClick={orderOnWhatsapp} style={{ marginTop: 10 }} disabled={submitting}>Order on WhatsApp</button>
            ) : null}
            <p className="note-sm" style={{ textAlign: "center", marginTop: 12 }}>Secure order · No online payment · Pay in cash when it arrives.</p>
          </form>

          <aside className="cart-summary">
            <h3 className="summary-h">Your order</h3>
            {lines.map(({ line, product, lineTotal }) => (
              <div className="summary-row" key={lineKey(line.id, line.size)}>
                <span>{line.qty}× {product.title}{line.size ? ` — ${line.size}` : ""}</span><span>{formatPrice(lineTotal)}</span>
              </div>
            ))}
            <div className="summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="summary-row"><span>Delivery</span><span>{delivery === 0 ? "Free" : formatPrice(delivery)}</span></div>
            <div className="summary-row total"><span>Total</span><span>{formatPrice(total)}</span></div>
            <p className="note-sm">Pay in cash when your order arrives.</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
