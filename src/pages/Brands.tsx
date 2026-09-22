import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "../lib/useProducts";
import { IconArrow } from "../components/icons";

interface BrandInfo {
  name: string;
  count: number;
  image: string;
}

export function Brands() {
  const products = useProducts();

  const brands = useMemo<BrandInfo[]>(() => {
    const map = new Map<string, BrandInfo>();
    (products ?? []).forEach((p) => {
      const existing = map.get(p.brand);
      if (existing) existing.count += 1;
      else map.set(p.brand, { name: p.brand, count: 1, image: p.image });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  return (
    <div className="nu-page">
      <section className="cat-hero" aria-labelledby="brands-title">
        <img className="cat-hero-bg" src="/img/cat-makeup.jpg" alt="" aria-hidden="true" loading="eager" />
        <div className="cat-hero-scrim" aria-hidden="true" />
        <div className="container cat-hero-inner">
          <p className="cat-hero-kicker">BHC Bingo · Parapharmacie</p>
          <h1 className="cat-hero-title" id="brands-title">Our Brands</h1>
          <p className="cat-hero-sub">The dermatologist-loved houses we curate — explore each brand's full range.</p>
        </div>
      </section>

      <section className="section catalog-section">
        <div className="container">
          {products == null ? (
            <p className="muted">Loading…</p>
          ) : brands.length === 0 ? (
            <p className="muted">No brands yet.</p>
          ) : (
            <div className="brand-grid">
              {brands.map((b) => (
                <Link key={b.name} className="brand-card" to={`/brand/${encodeURIComponent(b.name)}`}>
                  <span className="brand-card-media"><img src={b.image} alt="" loading="lazy" /></span>
                  <span className="brand-card-body">
                    <span className="brand-card-name">{b.name}</span>
                    <span className="brand-card-count">{b.count} {b.count === 1 ? "product" : "products"}</span>
                  </span>
                  <span className="brand-card-arrow" aria-hidden="true"><IconArrow /></span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
