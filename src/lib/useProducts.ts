import { useEffect, useState } from "react";
import { getProducts } from "./products";
import type { Product } from "./types";

export function useProducts(): Product[] | null {
  const [products, setProducts] = useState<Product[] | null>(null);
  useEffect(() => {
    let alive = true;
    getProducts().then((p) => { if (alive) setProducts(p); });
    return () => { alive = false; };
  }, []);
  return products;
}
