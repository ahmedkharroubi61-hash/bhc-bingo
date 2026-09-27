import { Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { useProducts } from "../lib/useProducts";
import { ProductGrid } from "../components/ProductGrid";
import { SectionHead } from "../components/SectionHead";
import { useT } from "../lib/i18n";

export function WishlistPage() {
  const { wishlist } = useStore();
  const products = useProducts();
  const t = useT();
  const items = (products ?? []).filter((p) => wishlist.includes(p.id));

  return (
    <section className="section">
      <div className="container">
        <SectionHead idx="—" title={t("My wishlist")} meta={`${items.length} ${t("saved")}`} />
        {items.length === 0 ? (
          <div className="legal">
            <p className="muted">{t("Your wishlist is empty. Tap the heart on any product to save it here.")}</p>
            <p><Link className="btn btn-gold" to="/category/all">{t("Browse products")}</Link></p>
          </div>
        ) : (
          <ProductGrid products={items} />
        )}
      </div>
    </section>
  );
}
