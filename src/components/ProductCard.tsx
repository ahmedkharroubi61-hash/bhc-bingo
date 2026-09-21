import { Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { formatPrice } from "../lib/format";
import { isOutOfStock, OUT_OF_STOCK_LABEL } from "../lib/stock";
import { IconHeart, IconStar } from "./icons";
import { AddToCartButton } from "./AddToCartButton";
import type { Product } from "../lib/types";

export function ProductCard({ product, badge }: { product: Product; badge?: string }) {
  const { addToCart, toggleWishlist, inWishlist } = useStore();
  const pressed = inWishlist(product.id);
  const hasSizes = !!product.sizes && product.sizes.length > 0;
  const soldOut = isOutOfStock(product);
  const href = `/product/${product.id}`;
  const discount = product.oldPriceMillimes
    ? `-${Math.round((1 - product.priceMillimes / product.oldPriceMillimes) * 100)}%`
    : undefined;
  const flag = badge ?? discount;

  return (
    <article className={`product${soldOut ? " is-soldout" : ""}`}>
      <div className="media">
        {soldOut ? <span className="badge-soldout">{OUT_OF_STOCK_LABEL}</span>
          : flag ? <span className="badge-discount">{flag}</span> : null}
        <button
          className="wishlist-btn"
          type="button"
          aria-pressed={pressed}
          onClick={() => toggleWishlist(product.id)}
        >
          <span className="visually-hidden">{pressed ? "Remove from wishlist" : "Add to wishlist"}</span>
          <IconHeart />
        </button>
        <Link className="media-open" to={href} aria-label={`View ${product.title}`}>
          <img src={product.image} alt={product.alt} loading="lazy" />
        </Link>
      </div>
      <div className="body">
        <span className="brand-name">{product.brand}</span>
        <h3 className="title"><Link className="title-open" to={href}>{product.title}</Link></h3>
        <span className="rating" aria-label={`Rated ${product.rating} out of 5`}>
          <IconStar />
          {product.rating.toFixed(1)} <span className="count">({product.ratingCount})</span>
        </span>
        <div className="price-row">
          {hasSizes ? <span className="price-from">from</span> : null}
          <span className="price">{formatPrice(product.priceMillimes)}</span>
          {product.oldPriceMillimes ? (
            <span className="price-old">{formatPrice(product.oldPriceMillimes)}</span>
          ) : null}
        </div>
        <div className="add">
          {soldOut ? (
            <button className="btn btn-outline btn-block" type="button" disabled>{OUT_OF_STOCK_LABEL}</button>
          ) : hasSizes ? (
            <Link className="btn btn-outline btn-block" to={href}>Choose size</Link>
          ) : (
            <AddToCartButton
              className="btn btn-outline btn-block"
              label="Add to Cart"
              onAdd={() => addToCart(product.id)}
            />
          )}
        </div>
      </div>
    </article>
  );
}
