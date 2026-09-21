import { ProductCard } from "./ProductCard";
import type { Product } from "../lib/types";

export function ProductGrid({ products, badge }: { products: Product[]; badge?: string }) {
  return (
    <div className="grid products">
      {products.map((p) => (<ProductCard key={p.id} product={p} badge={badge} />))}
    </div>
  );
}
