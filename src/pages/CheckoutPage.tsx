import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore, lineKey } from "../context/StoreContext";
import { useAuth } from "../context/AuthContext";
import { useCartLines } from "../lib/useCartLines";
import { getMyProfile, saveMyProfile } from "../lib/profile";
import { formatPrice } from "../lib/format";
import { SectionHead } from "../components/SectionHead";
import { StoreMap } from "../components/StoreMap";
import { useT } from "../lib/i18n";
import { WHATSAPP_NUMBER, DELIVERY_FEE_MILLIMES, FREE_DELIVERY_OVER_MILLIMES, STORE } from "../lib/config";
import { createOrder, getErrorMessage } from "../lib/orders";
import type { CustomerDetails, FulfillmentMethod, Order } from "../lib/types";

function whatsappHref(order: Order): string {
  const lines = order.items.map((i) => `• ${i.qty}× ${i.title} — ${formatPrice(i.lineTotal)}`).join("\n");
  const fulfilment =
    order.fulfillment === "pickup"
      ? `Pickup in store (${STORE.name})`
      : `Delivery: ${order.customer.address}, ${order.customer.city}`;
  const msg =
    `New order ${order.id}\n${lines}\n\n` +
    `Subtotal: ${formatPrice(order.subtotal)}\n` +
    `Delivery: ${order.delivery === 0 ? (order.fulfillment === "pickup" ? "Pickup" : "Free") : formatPrice(order.delivery)}\n` +
    `Total: ${formatPrice(order.total)} (Cash on Delivery)\n\n` +
    `Name: ${order.customer.name}\nPhone: ${order.customer.phone}\n` +
    fulfilment +
    (order.customer.notes ? `\nNotes: ${order.customer.notes}` : "");
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

export function CheckoutPage() {
  const t = useT();
  const navigate = useNavigate();
  const { clearCart } = useStore();
  const { user } = useAuth();
  const { lines, subtotal } = useCartLines();
  const [form, setForm] = useState<CustomerDetails>({ name: "", phone: "", address: "", city: "", notes: "", fulfillment: "delivery" });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Prefill from the signed-in customer's saved details, without clobbering
  // anything they've already typed.
  useEffect(() => {
    if (!user) return;
    let alive = true;
    const accountName = [user.firstName, user.lastName].filter(Boolean).join(" ");
    getMyProfile().then((p) => {
      if (!alive) return;
      setForm((f) => ({
        ...f,
        name: f.name || p.fullName || accountName,
        phone: f.phone || p.phone,
        address: f.address || p.address,
        city: f.city || p.city,
      }));
    });
    return () => { alive = false; };
  }, [user]);

  const isPickup = form.fulfillment === "pickup";
  const delivery = isPickup ? 0 : subtotal >= FREE_DELIVERY_OVER_MILLIMES ? 0 : DELIVERY_FEE_MILLIMES;
  const total = subtotal + delivery;
  const set = (k: keyof CustomerDetails) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const setFulfillment = (fulfillment: FulfillmentMethod) => setForm((f) => ({ ...f, fulfillment }));

  const validate = (): boolean => {
    if (!form.name.trim() || !form.phone.trim()) {
      setError(t("Please fill in your name and phone number."));
      return false;
    }
    if (!isPickup && (!form.address.trim() || !form.city.trim())) {
      setError(t("Please fill in your delivery address and city."));
      return false;
    }
    if (!consent) {
      setError(t("Please accept the order terms to continue."));
      return false;
    }
    setError("");
    return true;
  };

  // Best-effort: keep the signed-in customer's saved details fresh for next time.
  // Never blocks or fails the order.
  const persistProfile = async () => {
    if (!user) return;
    try {
      await saveMyProfile(user.id, { fullName: form.name, phone: form.phone, address: form.address, city: form.city });
    } catch {
      /* ignore — the order already succeeded */
    }
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0 || !validate() || submitting) return;
    setSubmitting(true);
    try {
      const order = await createOrder(lines, form);
      await persistProfile();
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
      await persistProfile();
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
          <SectionHead idx="—" title={t("Checkout")} />
          <p className="muted">{t("Your cart is empty — nothing to check out.")}</p>
          <p><Link className="btn btn-gold" to="/category/all">{t("Browse products")}</Link></p>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <SectionHead idx="—" title={t("Checkout")} meta={t("Cash on Delivery")} />
        <div className="cart-layout">
          <form className="checkout-form" onSubmit={placeOrder} noValidate>
            <h3 className="summary-h">{t("How would you like it?")}</h3>
            <div className="fulfil-toggle" role="tablist" aria-label="Delivery method">
              <button type="button" role="tab" aria-selected={!isPickup}
                className={`fulfil-opt${!isPickup ? " active" : ""}`} onClick={() => setFulfillment("delivery")}>
                <span className="fulfil-opt-t">{t("Home delivery")}</span>
                <span className="fulfil-opt-s">{subtotal >= FREE_DELIVERY_OVER_MILLIMES ? t("Free over 100 DT") : `${formatPrice(DELIVERY_FEE_MILLIMES)} · ${t("pay on delivery")}`}</span>
              </button>
              <button type="button" role="tab" aria-selected={isPickup}
                className={`fulfil-opt${isPickup ? " active" : ""}`} onClick={() => setFulfillment("pickup")}>
                <span className="fulfil-opt-t">{t("Pickup in store")}</span>
                <span className="fulfil-opt-s">{t("Free · pay when you collect")}</span>
              </button>
            </div>

            <h3 className="summary-h" style={{ marginTop: 22 }}>{isPickup ? t("Your contact details") : t("Delivery details")}</h3>
            <div className="field"><label htmlFor="co-name">{t("Full name")} <span className="req" aria-hidden="true">*</span></label><input id="co-name" value={form.name} onChange={set("name")} autoComplete="name" required /></div>
            <div className="field"><label htmlFor="co-phone">{t("Phone")} <span className="req" aria-hidden="true">*</span></label><input id="co-phone" type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" required /></div>
            {isPickup ? (
              <div className="pickup-panel">
                <p className="pickup-lead">{t("Collect your order at our shop — we'll call")} <strong>{form.phone || t("you")}</strong> {t("when it's ready.")}</p>
                <StoreMap height={190} />
              </div>
            ) : (
              <>
                <div className="field"><label htmlFor="co-address">{t("Address")} <span className="req" aria-hidden="true">*</span></label><input id="co-address" value={form.address} onChange={set("address")} autoComplete="street-address" required /></div>
                <div className="field"><label htmlFor="co-city">{t("City")} <span className="req" aria-hidden="true">*</span></label><input id="co-city" value={form.city} onChange={set("city")} autoComplete="address-level2" required /></div>
              </>
            )}
            <div className="field"><label htmlFor="co-notes">{t("Order notes (optional)")}</label><textarea id="co-notes" rows={3} value={form.notes} onChange={set("notes")} /></div>

            <div className="consent-line" style={{ marginTop: 4 }}>
              <input id="co-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <label htmlFor="co-consent">{t("I confirm my details are correct and agree to the")} <Link to="/terms-and-conditions">{t("order terms")}</Link> {t("and")} <Link to="/privacy-policy">{t("Privacy Policy")}</Link>.</label>
            </div>
            {error ? <p className="form-status err" role="alert">{error}</p> : null}

            <button className="btn btn-gold btn-block" type="submit" style={{ marginTop: 18 }} disabled={submitting}>{submitting ? t("Placing order…") : t("Place order · Cash on Delivery")}</button>
            {WHATSAPP_NUMBER ? (
              <button className="btn btn-outline btn-block" type="button" onClick={orderOnWhatsapp} style={{ marginTop: 10 }} disabled={submitting}>{t("Order on WhatsApp")}</button>
            ) : null}
            <p className="note-sm" style={{ textAlign: "center", marginTop: 12 }}>{t("Secure order · No online payment · Pay in cash when it arrives.")}</p>
          </form>

          <aside className="cart-summary">
            <h3 className="summary-h">{t("Your order")}</h3>
            {lines.map(({ line, product, lineTotal }) => (
              <div className="summary-row" key={lineKey(line.id, line.size)}>
                <span>{line.qty}× {product.title}{line.size ? ` — ${line.size}` : ""}</span><span>{formatPrice(lineTotal)}</span>
              </div>
            ))}
            <div className="summary-row"><span>{t("Subtotal")}</span><span>{formatPrice(subtotal)}</span></div>
            <div className="summary-row"><span>{isPickup ? t("Pickup in store") : t("Delivery")}</span><span>{isPickup ? t("Free") : delivery === 0 ? t("Free") : formatPrice(delivery)}</span></div>
            <div className="summary-row total"><span>{t("Total")}</span><span>{formatPrice(total)}</span></div>
            <p className="note-sm">{isPickup ? t("Pay in cash when you collect your order.") : t("Pay in cash when your order arrives.")}</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
