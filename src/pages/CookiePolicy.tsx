import { Link } from "react-router-dom";
import { useT } from "../lib/i18n";

// Mirrors what the site really stores (see CookieBanner, StoreContext, i18n,
// ratings, loginGuard, Supabase auth) — update this list if that changes.
const STORED = [
  "Your cookie choice, so we don't ask you again on every visit.",
  "Your cart and wishlist, so they're still there when you come back.",
  "Your language (French or English).",
  "Your sign-in session, only if you create an account and log in.",
  "An anonymous rating ID, so you can rate a product once without an account.",
  "A login-attempt counter that protects accounts against repeated wrong passwords.",
];

export function CookiePolicy() {
  const t = useT();
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <p className="breadcrumb"><Link to="/shop">{t("Home")}</Link> / {t("Cookie Policy")}</p>
          <p className="eyebrow">BHC Bingo Parapharmacie</p>
          <h1>{t("Cookie Policy")}</h1>
        </div>
      </div>
      <div className="section">
        <div className="container legal">
          <p>{t("This page explains what BHC Bingo stores on your device when you use bhc-bingo.com, and why.")}</p>

          <h2>{t("What we use")}</h2>
          <p>{t("We do not use advertising or tracking cookies, and no analytics run on this site. We only keep what the shop needs to work, saved in your browser's local storage:")}</p>
          <ul>{STORED.map((s) => <li key={s}>{t(s)}</li>)}</ul>

          <h2>{t("Third-party services")}</h2>
          <p>{t("Some pages load content from other providers, which may set their own cookies under their own policies: Google Fonts (the site's typefaces), Google Maps (the map of our shop on the contact and pickup pages) and Supabase (our secure product and order database).")}</p>

          <h2>{t("Your choices")}</h2>
          <p>{t("You can change your choice at any time with “Cookie Settings” at the bottom of every page. You can also clear this site's data in your browser settings; this empties your cart and wishlist and signs you out.")}</p>

          <h2>{t("Contact")}</h2>
          <p>{t("Questions about this policy? Message us on WhatsApp or Instagram; the details are on our")} <Link to="/contact">{t("Contact page")}</Link>.</p>

          <p className="note-sm">{t("Last updated: October 2026")}</p>
        </div>
      </div>
    </>
  );
}
