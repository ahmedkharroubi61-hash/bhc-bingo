import { Link } from "react-router-dom";

export function Placeholder({ title, note }: { title: string; note?: string }) {
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <p className="breadcrumb"><Link to="/shop">Home</Link> / {title}</p>
          <p className="eyebrow">BHC Bingo Parapharmacie</p>
          <h1>{title}</h1>
        </div>
      </div>
      <div className="section">
        <div className="container legal">
          <div className="note"><strong>Coming soon.</strong> {note ?? "This page is being built in the next phase."}</div>
          <p><Link className="btn btn-gold" to="/shop">Continue shopping</Link></p>
        </div>
      </div>
    </>
  );
}
