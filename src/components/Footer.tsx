import { Link } from "react-router-dom";
import { useT } from "../lib/i18n";

function openCookieSettings(e: React.MouseEvent) {
  e.preventDefault();
  window.dispatchEvent(new Event("open-cookie-settings"));
}

export function Footer() {
  const t = useT();
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link className="brand" to="/" aria-label="BHC Bingo — home">
              <img className="brand-logo brand-logo-footer" src="/img/logo-light.png" alt="" width={343} height={283} />
              <span className="brand-name brand-name-footer">BINGO</span>
            </Link>
            <p>{t("A premium parapharmacie for skincare, cosmetics and wellness — authentic products and professional advice.")}</p>
          </div>
          <div>
            <h4>{t("Shop")}</h4>
            <ul>
              <li><Link to="/category/skincare">{t("Skincare")}</Link></li>
              <li><Link to="/category/face">{t("Face Care")}</Link></li>
              <li><Link to="/category/hair">{t("Hair Care")}</Link></li>
              <li><Link to="/category/sun">{t("Sun Protection")}</Link></li>
              <li><Link to="/category/promotions">{t("Promotions")}</Link></li>
            </ul>
          </div>
          <div>
            <h4>{t("Customer Service")}</h4>
            <ul>
              <li><Link to="/contact">{t("Contact Us")}</Link></li>
              <li><Link to="/shipping-returns">{t("Shipping & Returns")}</Link></li>
              <li><Link to="/account">{t("My Account")}</Link></li>
            </ul>
          </div>
          <div>
            <h4>{t("Company & Legal")}</h4>
            <ul>
              <li><Link to="/about">{t("About Us")}</Link></li>
              <li><Link to="/legal-notice">{t("Legal Notice")}</Link></li>
              <li><Link to="/privacy-policy">{t("Privacy Policy")}</Link></li>
              <li><Link to="/cookie-policy">{t("Cookie Policy")}</Link></li>
              <li><Link to="/terms-and-conditions">{t("Terms & Conditions")}</Link></li>
              <li><a href="#" onClick={openCookieSettings}>{t("Cookie Settings")}</a></li>
            </ul>
          </div>
        </div>
        <div className="pay-methods" aria-label="Accepted payment methods">
          <span>{t("Cash on Delivery")}</span>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <span>© {year} BHC Bingo Parapharmacie. {t("All rights reserved.")}</span>
          <span>
            <Link to="/privacy-policy">{t("Privacy")}</Link> · <Link to="/cookie-policy">{t("Cookies")}</Link> · <Link to="/terms-and-conditions">{t("Terms")}</Link> · <Link to="/legal-notice">{t("Legal Notice")}</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
