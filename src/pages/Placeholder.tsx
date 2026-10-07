import { Link } from "react-router-dom";
import { useT } from "../lib/i18n";

/** Simple content page. With `body` it shows that paragraph; without it, a "coming soon" note. */
export function Placeholder({ title, note, body }: { title: string; note?: string; body?: string }) {
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
          {body ? <p>{t(body)}</p> : (
            <div className="note"><strong>{t("Coming soon.")}</strong> {note ? t(note) : t("This page is being built in the next phase.")}</div>
          )}
          <p><Link className="btn btn-gold" to="/shop">{t("Continue shopping")}</Link></p>
        </div>
      </div>
    </>
  );
}
