import { Link } from "react-router-dom";
import { useT } from "../lib/i18n";

export function NotFound() {
  const t = useT();
  return (
    <div className="section">
      <div className="container legal" style={{ textAlign: "center" }}>
        <p className="eyebrow" style={{ justifyContent: "center" }}>404</p>
        <h1>{t("Page not found")}</h1>
        <p>{t("The page you’re looking for doesn’t exist or has moved.")}</p>
        <p><Link className="btn btn-gold" to="/shop">{t("Back to shop")}</Link></p>
      </div>
    </div>
  );
}
