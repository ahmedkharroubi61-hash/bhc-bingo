import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { useProducts } from "../lib/useProducts";
import { unitPriceFor } from "../lib/useCartLines";
import { formatPrice } from "../lib/format";
import { isOutOfStock, OUT_OF_STOCK_LABEL } from "../lib/stock";
import { ProductGrid } from "../components/ProductGrid";
import { AddToCartButton } from "../components/AddToCartButton";
import { ProductRating } from "../components/ProductRating";
import { IconHeart, IconShield, IconTruck, IconLock } from "../components/icons";
import { NotFound } from "./NotFound";
import type { Product } from "../lib/types";

const CATEGORY_LABELS: Record<string, string> = {
  skincare: "Skincare", face: "Face Care", body: "Body Care", hair: "Hair Care",
  makeup: "Makeup", sun: "Sun Protection", baby: "Baby & Mother", wellness: "Wellness",
};

const MAX_RELATED = 4;

interface Tab {
  key: string;
  label: string;
  body: string;
}

function buildTabs(product: Product): Tab[] {
  const tabs: Tab[] = [];
  const description = product.description
    ?? "A considered, dermatologist-loved formula — authentic and chosen for your everyday routine.";
  tabs.push({ key: "description", label: "Description", body: description });
  if (product.howToUse) tabs.push({ key: "how", label: "How to use", body: product.howToUse });
  if (product.ingredients) tabs.push({ key: "ingredients", label: "Ingredients", body: product.ingredients });
  return tabs;
}

export function ProductPage() {
  const { id } = useParams();
  const products = useProducts();
  const { addToCart, toggleWishlist, inWishlist } = useStore();
  const [size, setSize] = useState<string | undefined>(undefined);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("description");

  const product = (products ?? []).find((p) => p.id === id);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);
  useEffect(() => {
    setSize(product?.sizes?.length ? product.sizes[0].label : undefined);
    setQty(1);
    setTab("description");
  }, [product?.id]);

  const related = useMemo(() => {
    if (!product || !products) return [];
    const same = products.filter((p) => p.id !== product.id && p.category === product.category);
    const others = products.filter((p) => p.id !== product.id && p.category !== product.category);
    return [...same, ...others].slice(0, MAX_RELATED);
  }, [products, product]);

  if (products === null) {
    return (
      <section className="section"><div className="container"><p className="muted">Loading…</p></div></section>
    );
  }
  if (!product) return <NotFound />;

  const unit = unitPriceFor(product, size);
  const pressed = inWishlist(product.id);
  const soldOut = isOutOfStock(product);
  const hasSizes = !!product.sizes && product.sizes.length > 0;
  const tabs = buildTabs(product);
  const activeTab = tabs.find((t) => t.key === tab) ?? tabs[0];

  return (
    <>
      <section className="section pdp">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/shop">Home</Link> <span aria-hidden="true">/</span>{" "}
            <Link to={`/category/${product.category}`}>{CATEGORY_LABELS[product.category] ?? "Shop"}</Link>{" "}
            <span aria-hidden="true">/</span> <span className="crumb-current">{product.brand}</span>
          </nav>

          <div className="pdp-grid">
            {/* INFO — left */}
            <div className="pdp-info">
              <span className="brand-name">{product.brand}</span>
              <h1 className="pdp-title">{product.title}</h1>
              <ProductRating productId={product.id} rating={product.rating} ratingCount={product.ratingCount} />

              <div className="pdp-price">
                {hasSizes && !size ? <span className="price-from">from </span> : null}
                {product.oldPriceMillimes ? (
                  <span className="pdp-price-old">{formatPrice(product.oldPriceMillimes)}</span>
                ) : null}
                <span className={product.oldPriceMillimes ? "pdp-price-now" : undefined}>{formatPrice(unit)}</span>
              </div>

              {/* Tabs */}
              <div className="pdp-tabs" role="tablist" aria-label="Product information">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    className={`pdp-tab${activeTab.key === t.key ? " active" : ""}`}
                    role="tab"
                    type="button"
                    aria-selected={activeTab.key === t.key}
                    onClick={() => setTab(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="pdp-tabpanel" role="tabpanel">
                {product.bestFor && activeTab.key === "description" ? (
                  <p className="pdp-bestfor"><span className="pm-label" style={{ marginBottom: 4 }}>Best for</span>{product.bestFor}</p>
                ) : null}
                <p className="pdp-desc">{activeTab.body}</p>
              </div>

              {hasSizes ? (
                <div className="pm-field">
                  <span className="pm-label">Size</span>
                  <div className="pm-sizes" role="radiogroup" aria-label="Choose a size">
                    {product.sizes!.map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        role="radio"
                        aria-checked={size === s.label}
                        className={`pm-size${size === s.label ? " is-sel" : ""}`}
                        onClick={() => setSize(s.label)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Quantity + add to cart */}
              {soldOut ? (
                <div className="pdp-buy pdp-soldout">
                  <span className="pdp-soldout-badge">{OUT_OF_STOCK_LABEL}</span>
                  <p className="pdp-soldout-note">This product is temporarily out of stock. Check back soon.</p>
                  <button className={`icon-btn pdp-save${pressed ? " is-saved" : ""}`} type="button" aria-pressed={pressed} aria-label={pressed ? "Saved to wishlist" : "Save to wishlist"} onClick={() => toggleWishlist(product.id)}>
                    <IconHeart />
                  </button>
                </div>
              ) : (
                <div className="pdp-buy">
                  <div className="qty pdp-qty">
                    <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>&minus;</button>
                    <span>{qty}</span>
                    <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => q + 1)}>+</button>
                  </div>
                  <AddToCartButton
                    className="btn btn-accent pdp-add"
                    label={`Add to cart — ${formatPrice(unit * qty)}`}
                    onAdd={() => addToCart(product.id, { qty, size })}
                  />
                  <button className={`icon-btn pdp-save${pressed ? " is-saved" : ""}`} type="button" aria-pressed={pressed} aria-label={pressed ? "Saved to wishlist" : "Save to wishlist"} onClick={() => toggleWishlist(product.id)}>
                    <IconHeart />
                  </button>
                </div>
              )}

              <ul className="pdp-trust">
                <li><IconShield /> 100% authentic, from authorised suppliers</li>
                <li><IconTruck /> Fast delivery · free over 100 DT</li>
                <li><IconLock /> Cash on delivery — pay when it arrives</li>
              </ul>
            </div>

            {/* MEDIA — right */}
            <div className="pdp-media"><img src={product.image} alt={product.alt} /></div>
          </div>
        </div>
      </section>

      {/* YOU MAY ALSO LIKE */}
      {related.length > 0 ? (
        <section className="section alt pdp-related" aria-labelledby="related-title">
          <div className="container">
            <h2 className="pdp-related-title" id="related-title">You may also like</h2>
            <ProductGrid products={related} />
          </div>
        </section>
      ) : null}
    </>
  );
}
