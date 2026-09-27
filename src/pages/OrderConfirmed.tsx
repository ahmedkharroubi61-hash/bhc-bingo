import { Link, useLocation } from "react-router-dom";
import { formatPrice } from "../lib/format";
import { hasSupabase } from "../lib/supabase";
import { StoreMap } from "../components/StoreMap";
import { useT } from "../lib/i18n";
import type { Order } from "../lib/types";

export function OrderConfirmed() {
  const location = useLocation();
  const t = useT();
  const order = (location.state as { order?: Order } | null)?.order;
  const isPickup = order?.fulfillment === "pickup";

  return (
    <section className="section">
      <div className="container legal" style={{ maxWidth: 680 }}>
        <p className="kicker">{t("Order received")}</p>
        <h1>{t("Thank you")}{order ? `, ${order.customer.name.split(" ")[0]}` : ""}.</h1>
        {order ? (
          <>
            <p className="muted">
              {isPickup ? (
                <>Your order <strong>{order.id}</strong> is confirmed for <strong>in-store pickup</strong>. We’ll call{" "}
                <strong>{order.customer.phone}</strong> when it’s ready to collect. Pay in cash when you pick it up.</>
              ) : (
                <>Your order <strong>{order.id}</strong> is confirmed. We’ll call <strong>{order.customer.phone}</strong> to
                arrange delivery to {order.customer.address}, {order.customer.city}. Pay in cash on delivery.</>
              )}
            </p>
            <div className="cart-summary" style={{ marginTop: 24 }}>
              <h3 className="summary-h">{t("Order")} {order.id}</h3>
              {order.items.map((i, n) => (
                <div className="summary-row" key={n}><span>{i.qty}× {i.title}</span><span>{formatPrice(i.lineTotal)}</span></div>
              ))}
              <div className="summary-row"><span>{t("Subtotal")}</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="summary-row"><span>{isPickup ? t("Pickup in store") : t("Delivery")}</span><span>{order.delivery === 0 ? t("Free") : formatPrice(order.delivery)}</span></div>
              <div className="summary-row total"><span>{t("Total (Cash on Delivery)")}</span><span>{formatPrice(order.total)}</span></div>
            </div>
            {isPickup ? (
              <div style={{ marginTop: 24 }}>
                <h3 className="summary-h">{t("Where to collect")}</h3>
                <StoreMap height={220} />
              </div>
            ) : null}
            <div className="note" style={{ marginTop: 24 }}>
              {hasSupabase ? (
                <><strong>Order recorded.</strong> Your order is saved and the shop will call you on {order.customer.phone} to
                confirm delivery. Payment is collected in cash when your order arrives.</>
              ) : (
                <><strong>Demo note:</strong> this is a demonstration checkout — no order was transmitted or stored. In production
                this becomes a real order in the database and a notification to the shop.</>
              )}
            </div>
          </>
        ) : (
          <p className="muted">{t("Your order has been received. (No order details to display — this page was opened directly.)")}</p>
        )}
        <p style={{ marginTop: 24 }}><Link className="btn btn-gold" to="/category/all">{t("Continue shopping")}</Link></p>
      </div>
    </section>
  );
}
