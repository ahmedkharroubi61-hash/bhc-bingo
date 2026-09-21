import { useState } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "../lib/useProducts";
import { useInStockCategorySet } from "../lib/useCategoryNav";
import { formatPrice } from "../lib/format";
import { isOutOfStock } from "../lib/stock";
import { IconArrow } from "../components/icons";
import type { Product, ProductTag } from "../lib/types";

const needTiles = [
  { slug: "skincare", name: "Daily Skincare", img: "/img/cat-skincare.jpg" },
  { slug: "face", name: "Face Care", img: "/img/cat-face.jpg" },
  { slug: "hair", name: "Hair & Scalp", img: "/img/cat-hair.jpg" },
  { slug: "body", name: "Body Care", img: "/img/cat-body.jpg" },
  { slug: "sun", name: "Sun Protection", img: "/img/cat-sun.jpg" },
];

const stats = [
  { n: "19+", l: "Curated products" },
  { n: "100%", l: "Authentic sourcing" },
  { n: "COD", l: "Pay on delivery" },
  { n: "48h", l: "Fast nationwide" },
];

const marqueeItems = [
  "Free delivery over 100 DT", "Dermatologist-loved", "Cash on delivery",
  "Authentic products only", "Fast 48h shipping", "Professional advice",
];

function Marquee() {
  const items = [...marqueeItems, ...marqueeItems];
  return (
    <div className="nu-marquee" aria-hidden="true">
      <div className="nu-marquee-track">
        {items.map((t, i) => (
          <span className="nu-marquee-item" key={i}>{t}<i className="nu-marquee-star">✦</i></span>
        ))}
      </div>
    </div>
  );
}

export function Home() {
  const products = useProducts();
  const inStock = useInStockCategorySet();
  const tiles = needTiles.filter((c) => inStock.has(c.slug));
  const [tab, setTab] = useState<ProductTag>("best");
  const by = (t: ProductTag): Product[] => (products ?? []).filter((p) => p.tags.includes(t));

  const heroProduct = (by("featured")[0] ?? (products ?? [])[0]);
  const feats = by("featured");
  const grid = (feats.length >= 6 ? feats : (products ?? [])).slice(0, 6);
  const tabItems = by(tab).slice(0, 6);

  return (
    <div className="nu">
      {/* HERO */}
      <section className="nu-hero" aria-labelledby="nu-hero-title">
        <span className="nu-hero-word" aria-hidden="true">BIOBINGO</span>
        <div className="container nu-hero-grid">
          <div className="nu-hero-figure">
            {heroProduct ? (
              <Link to={`/product/${heroProduct.id}`} className="nu-hero-shot" aria-label={heroProduct.title}>
                <img src={heroProduct.image} alt={heroProduct.alt} loading="eager" />
              </Link>
            ) : null}
            <span className="nu-hero-pedestal" aria-hidden="true" />
          </div>

          <div className="nu-hero-copy">
            <h1 className="nu-hero-title" id="nu-hero-title">
              Professionally chosen skincare &amp; wellness, delivered to your door.
            </h1>
            <p className="nu-hero-lead">
              A considered edit of authentic parapharmacie products — dermatologist-loved,
              transparently sourced, and paid for only when it arrives.
            </p>
            <Link className="nu-pill" to="/category/all">
              Shop by need <IconArrow />
            </Link>
          </div>
        </div>
      </section>

      <Marquee />

      {/* SHOP BY NEED */}
      <section className="section nu-needs" aria-labelledby="nu-needs-title">
        <div className="container">
          <div className="nu-head">
            <h2 className="nu-h2" id="nu-needs-title">Find what works for you</h2>
            <Link className="nu-link" to="/category/all">All departments <IconArrow /></Link>
          </div>
          <div className="nu-circles">
            {tiles.map((c, i) => (
              <Link key={c.slug} to={`/category/${c.slug}`} className="nu-circle" style={{ ["--i" as string]: i }}>
                <span className="nu-circle-img"><img src={c.img} alt="" loading="lazy" /></span>
                <span className="nu-circle-name">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="section nu-band" aria-labelledby="nu-stats-title">
        <div className="container nu-band-grid">
          <h2 className="nu-band-h" id="nu-stats-title">
            Science-backed formulations, transparent sourcing, and the confidence of verified quality.
          </h2>
          <div className="nu-stats">
            {stats.map((s) => (
              <div className="nu-stat" key={s.l}>
                <span className="nu-stat-n">{s.n}</span>
                <span className="nu-stat-l">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT GRID */}
      <section className="section nu-shop" aria-labelledby="nu-shop-title">
        <div className="container">
          <div className="nu-head">
            <div>
              <p className="nu-eyebrow">The edit</p>
              <h2 className="nu-h2" id="nu-shop-title">Bestsellers</h2>
            </div>
            <div className="nu-tabs" role="tablist" aria-label="Collections">
              {([["best", "Popular"], ["new", "New"], ["trending", "Trending"]] as [ProductTag, string][]).map(([k, label]) => (
                <button key={k} role="tab" aria-selected={tab === k} className={`nu-tab${tab === k ? " active" : ""}`} onClick={() => setTab(k)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="nu-products" role="tabpanel">
            {(tabItems.length ? tabItems : grid).map((p) => (
              <Link key={p.id} to={`/product/${p.id}`} className={`nu-card${isOutOfStock(p) ? " oos" : ""}`}>
                <span className="nu-card-media">
                  <img src={p.image} alt={p.alt} loading="lazy" />
                  {isOutOfStock(p) ? <span className="nu-card-oos">Rupture</span> : null}
                </span>
                <span className="nu-card-brand">{p.brand}</span>
                <span className="nu-card-title">{p.title}</span>
                <span className="nu-card-price">{formatPrice(p.priceMillimes)}</span>
              </Link>
            ))}
          </div>
          <div className="nu-shop-foot">
            <Link className="nu-pill nu-pill-dark" to="/category/all">View all products <IconArrow /></Link>
          </div>
        </div>
      </section>

      {/* INGREDIENTS BAND */}
      <section className="nu-ingredients" aria-labelledby="nu-ing-title">
        <img className="nu-ingredients-bg" src="/img/lifestyle-2.jpg" alt="" aria-hidden="true" loading="lazy" />
        <div className="nu-ingredients-scrim" aria-hidden="true" />
        <div className="container nu-ingredients-inner">
          <p className="nu-eyebrow light">What's inside matters</p>
          <h2 className="nu-ingredients-word" id="nu-ing-title">CLEAN&nbsp;FORMULAS</h2>
          <div className="nu-ingredients-notes">
            <div><strong>Dermatologist-loved</strong><span>Formulas trusted by professionals</span></div>
            <div><strong>Authorised suppliers</strong><span>Every product, genuinely sourced</span></div>
          </div>
        </div>
      </section>

      <Newsletter />
    </div>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setStatus({ msg: "Please enter a valid email address.", ok: false }); return; }
    if (!consent) { setStatus({ msg: "Please tick the consent box so we can email you.", ok: false }); return; }
    setStatus({ msg: "Thank you — you're on the list. (Demo: no data was sent.)", ok: true });
    setEmail(""); setConsent(false);
  };

  return (
    <section className="section nu-news" aria-labelledby="news-title">
      <div className="container">
        <div className="nu-news-card">
          <p className="nu-eyebrow">Join the community</p>
          <h2 className="nu-h2" id="news-title">Beauty updates &amp; exclusive offers</h2>
          <p className="nu-dim">Occasional emails on new arrivals and offers. Unsubscribe any time.</p>
          <form onSubmit={submit} noValidate className="nu-news-form">
            <label htmlFor="news-email" className="visually-hidden">Your email address</label>
            <input id="news-email" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <button className="nu-pill nu-pill-dark" type="submit">Subscribe</button>
          </form>
          <div className="nu-consent">
            <input id="news-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <label htmlFor="news-consent">I agree to receive marketing emails from Bio Bingo and I have read the <Link to="/privacy-policy">Privacy Policy</Link>.</label>
          </div>
          {status ? <p className={`form-status ${status.ok ? "ok" : "err"}`} role="status" aria-live="polite">{status.msg}</p> : null}
        </div>
      </div>
    </section>
  );
}
