import { Link } from "react-router-dom";
import { useT } from "../lib/i18n";

export function Placeholder({ title, note }: { title: string; note?: string }) {
  const t = useT();
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <p className="breadcrumb"><Link to="/shop">{t("Home")}</Link> / {t(title)}</p>
          <p className="eyebrow">BHC Bingo Parapharmacie</p>
          <h1>{t(title)}</h1>
        </div>
      </div>
      <div className="section">
        <div className="container legal">
          <div className="note"><strong>{t("Coming soon.")}</strong> {note ? t(note) : t("This page is being built in the next phase.")}</div>
          <p><Link className="btn btn-gold" to="/shop">{t("Continue shopping")}</Link></p>
        </div>
      </div>
    </>
  );
}
