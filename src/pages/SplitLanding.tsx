import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useT } from "../lib/i18n";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

/**
 * Full-screen entry chooser — the site opens split between the shop ("Our
 * Products") and reservations ("Our Services"). Hovering a side expands it;
 * clicking enters. Stacks vertically on phones.
 */
export function SplitLanding() {
  const t = useT();
  // Own visual world: no storefront chrome, dark full-bleed background.
  useEffect(() => {
    document.body.classList.add("split-mode");
    return () => document.body.classList.remove("split-mode");
  }, []);

  return (
    <div className="split">
      <Link className="split-panel split-products" to="/shop">
        <span className="split-bg" style={{ backgroundImage: "url(/img/lifestyle-1.jpg)" }} aria-hidden="true" />
        <span className="split-scrim" aria-hidden="true" />
        <span className="split-content">
          <span className="split-eyebrow">{t("The shop")}</span>
          <span className="split-title">{t("Our Products")}</span>
          <span className="split-sub">{t("Authentic parapharmacie — delivered, or pick up in store.")}</span>
          <span className="split-cta">{t("Enter the shop")} <b aria-hidden="true">→</b></span>
        </span>
      </Link>

      <Link className="split-panel split-services" to="/reservations">
        <span className="split-bg" style={{ backgroundImage: "url(/img/lifestyle-2.jpg)" }} aria-hidden="true" />
        <span className="split-scrim" aria-hidden="true" />
        <span className="split-content">
          <span className="split-eyebrow">{t("Book a visit")}</span>
          <span className="split-title">{t("Our Services")}</span>
          <span className="split-sub">{t("Reserve a consultation or session at the shop.")}</span>
          <span className="split-cta">{t("Make a reservation")} <b aria-hidden="true">→</b></span>
        </span>
      </Link>

      <div className="split-center" aria-hidden="true">
        <img className="split-logo" src="/img/logo-light.png" alt="" />
        <span className="split-brand">BINGO<i>.</i></span>
      </div>

      <div className="split-lang"><LanguageSwitcher variant="light" /></div>
    </div>
  );
}
