import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="section">
      <div className="container legal" style={{ textAlign: "center" }}>
        <p className="eyebrow" style={{ justifyContent: "center" }}>404</p>
        <h1>Page not found</h1>
        <p>The page you’re looking for doesn’t exist or has moved.</p>
        <p><Link className="btn btn-gold" to="/shop">Back to shop</Link></p>
      </div>
    </div>
  );
}
