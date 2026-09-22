import { Link } from "react-router-dom";

function openCookieSettings(e: React.MouseEvent) {
  e.preventDefault();
  window.dispatchEvent(new Event("open-cookie-settings"));
}

export function Footer() {
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
            <p>A premium parapharmacie for skincare, cosmetics and wellness — authentic products and professional advice.</p>
          </div>
          <div>
            <h4>Shop</h4>
            <ul>
              <li><Link to="/category/skincare">Skincare</Link></li>
              <li><Link to="/category/face">Face Care</Link></li>
              <li><Link to="/category/hair">Hair Care</Link></li>
              <li><Link to="/category/sun">Sun Protection</Link></li>
              <li><Link to="/category/promotions">Promotions</Link></li>
            </ul>
          </div>
          <div>
            <h4>Customer Service</h4>
            <ul>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/shipping-returns">Shipping &amp; Returns</Link></li>
              <li><Link to="/account">My Account</Link></li>
            </ul>
          </div>
          <div>
            <h4>Company &amp; Legal</h4>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/legal-notice">Legal Notice</Link></li>
              <li><Link to="/privacy-policy">Privacy Policy</Link></li>
              <li><Link to="/cookie-policy">Cookie Policy</Link></li>
              <li><Link to="/terms-and-conditions">Terms &amp; Conditions</Link></li>
              <li><a href="#" onClick={openCookieSettings}>Cookie Settings</a></li>
            </ul>
          </div>
        </div>
        <div className="pay-methods" aria-label="Accepted payment methods">
          <span>Visa</span><span>Mastercard</span><span>e-Dinar</span><span>Cash on Delivery</span>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <span>© {year} BHC Bingo Parapharmacie. All rights reserved.</span>
          <span>
            <Link to="/privacy-policy">Privacy</Link> · <Link to="/cookie-policy">Cookies</Link> · <Link to="/terms-and-conditions">Terms</Link> · <Link to="/legal-notice">Legal Notice</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
