import { Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { useProducts } from "../lib/useProducts";
import { ProductGrid } from "../components/ProductGrid";
import { SectionHead } from "../components/SectionHead";

export function WishlistPage() {
  const { wishlist } = useStore();
  const products = useProducts();
  const items = (products ?? []).filter((p) => wishlist.includes(p.id));

  return (
    <section className="section">
      <div className="container">
        <SectionHead idx="—" title="My wishlist" meta={`${items.length} saved`} />
        {items.length === 0 ? (
          <div className="legal">
            <p className="muted">Your wishlist is empty. Tap the heart on any product to save it here.</p>
            <p><Link className="btn btn-gold" to="/category/all">Browse products</Link></p>
          </div>
        ) : (
          <ProductGrid products={items} />
        )}
      </div>
    </section>
  );
}
