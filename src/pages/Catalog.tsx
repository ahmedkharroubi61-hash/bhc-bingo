import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useProducts } from "../lib/useProducts";
import { ProductGrid } from "../components/ProductGrid";
import { categories } from "../data/categories";
import { productMatches } from "../lib/search";
import type { Product } from "../lib/types";

type SortKey = "featured" | "price-asc" | "price-desc" | "rating";

interface CatMeta {
  sub: string;
  banner: string;
}

const CAT_META: Record<string, CatMeta> = {
  all: { sub: "Our full edit of skincare, cosmetics and wellness — authentic products, chosen with care.", banner: "/img/hero-bg.jpg" },
  promotions: { sub: "A considered selection of the pieces we love right now — thoughtfully priced.", banner: "/img/lifestyle-2.jpg" },
  skincare: { sub: "Cleansers, serums and daily rituals for healthy, radiant skin.", banner: "/img/cat-skincare.jpg" },
  face: { sub: "Targeted face care — hydration, anti-age and everyday glow.", banner: "/img/cat-face.jpg" },
  body: { sub: "Nourishing body and foot care for everyday comfort.", banner: "/img/cat-body.jpg" },
  hair: { sub: "Shampoos, masques and serums for softer, stronger hair.", banner: "/img/cat-hair.jpg" },
  sun: { sub: "High-protection sun care for face and body.", banner: "/img/cat-sun.jpg" },
  baby: { sub: "Gentle, dermatologist-loved care for babies and mothers.", banner: "/img/lifestyle-1.jpg" },
  wellness: { sub: "Supplements and wellness essentials for daily balance.", banner: "/img/lifestyle-3.jpg" },
};

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(categories.map((c) => [c.slug, c.name]));

const SORTS: [SortKey, string][] = [
  ["featured", "Featured"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
  ["rating", "Top rated"],
];

interface Facet {
  value: string;
  label: string;
}

function sortProducts(list: Product[], sort: SortKey): Product[] {
  const copy = [...list];
  switch (sort) {
    case "price-asc": return copy.sort((a, b) => a.priceMillimes - b.priceMillimes);
    case "price-desc": return copy.sort((a, b) => b.priceMillimes - a.priceMillimes);
    case "rating": return copy.sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount);
    default: return copy;
  }
}

export function Catalog() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const searchMode = query.length > 0;
  const brandParam = params.brand ? decodeURIComponent(params.brand) : undefined;
  const slug = params.slug ?? "all";
  const brandMode = !searchMode && !!brandParam;
  const routeKey = searchMode ? `q:${query.toLowerCase()}` : brandMode ? `brand:${brandParam}` : slug;

  const products = useProducts();
  const [facet, setFacet] = useState("all");
  const [sort, setSort] = useState<SortKey>("featured");

  // Reset filters whenever the category or brand changes.
  useEffect(() => { setFacet("all"); setSort("featured"); }, [routeKey]);

  const title = searchMode
    ? "Search results"
    : brandMode ? brandParam!
    : slug === "all" ? "All products"
    : slug === "promotions" ? "Promotions"
    : CATEGORY_LABEL[slug] ?? "Products";

  const meta: CatMeta = searchMode
    ? { sub: `Showing products matching “${query}”.`, banner: "/img/cat-makeup.jpg" }
    : brandMode
    ? { sub: `The full ${brandParam} range — authentic products, in stock and ready to ship.`, banner: "/img/cat-makeup.jpg" }
    : CAT_META[slug] ?? CAT_META.all;

  const baseList = useMemo(
    () => (products ?? []).filter((p) =>
      searchMode ? productMatches(p, query)
      : brandMode ? p.brand === brandParam
      : slug === "all" ? true
      : slug === "promotions" ? p.oldPriceMillimes != null
      : p.category === slug
    ),
    [products, slug, brandParam, brandMode, searchMode, query]
  );

  // In brand mode the pills filter by category; otherwise by brand.
  const facets = useMemo<Facet[]>(() => {
    if (brandMode) {
      const cats = Array.from(new Set(baseList.map((p) => p.category)));
      return cats
        .map((c) => ({ value: c, label: CATEGORY_LABEL[c] ?? c }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    return Array.from(new Set(baseList.map((p) => p.brand)))
      .sort((a, b) => a.localeCompare(b))
      .map((b) => ({ value: b, label: b }));
  }, [baseList, brandMode]);

  const list = useMemo(() => {
    const filtered = facet === "all"
      ? baseList
      : baseList.filter((p) => (brandMode ? p.category : p.brand) === facet);
    return sortProducts(filtered, sort);
  }, [baseList, facet, brandMode, sort]);

  const filterLabel = brandMode ? "Filter by category" : "Filter by brand";

  return (
    <div className="nu-page">
      {/* BANNER */}
      <section className="cat-hero" aria-labelledby="cat-hero-title">
        <img className="cat-hero-bg" src={meta.banner} alt="" aria-hidden="true" loading="eager" />
        <div className="cat-hero-scrim" aria-hidden="true" />
        <div className="container cat-hero-inner">
          <p className="cat-hero-kicker">{searchMode ? "Search" : brandMode ? "Our Brands" : "Bio Bingo · Parapharmacie"}</p>
          <h1 className="cat-hero-title" id="cat-hero-title">{title}</h1>
          <p className="cat-hero-sub">{meta.sub}</p>
        </div>
      </section>

      {/* FILTER PILLS */}
      {facets.length > 1 ? (
        <nav className="filter-pills" aria-label={filterLabel}>
          <button
            className={`pill${facet === "all" ? " active" : ""}`}
            type="button"
            aria-pressed={facet === "all"}
            onClick={() => setFacet("all")}
          >
            All
          </button>
          {facets.map((f) => (
            <button
              key={f.value}
              className={`pill${facet === f.value ? " active" : ""}`}
              type="button"
              aria-pressed={facet === f.value}
              onClick={() => setFacet(f.value)}
            >
              {f.label}
            </button>
          ))}
        </nav>
      ) : null}

      {/* TOOLBAR + GRID */}
      <section className="section catalog-section">
        <div className="container">
          <div className="catalog-toolbar">
            <span className="catalog-count">
              {products == null ? "Loading…" : `${list.length} ${list.length === 1 ? "product" : "products"}`}
            </span>
            <label className="sort-control">
              <span className="sort-label">Sort</span>
              <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort products">
                {SORTS.map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
              </select>
            </label>
          </div>

          {products == null ? <p className="muted">Loading…</p>
            : list.length === 0 ? <p className="muted">{searchMode ? `No products match “${query}”. Try a brand or product name.` : "No products match this filter yet."}</p>
            : <ProductGrid products={list} />}
        </div>
      </section>
    </div>
  );
}
