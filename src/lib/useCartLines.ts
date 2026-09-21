import { useStore } from "../context/StoreContext";
import { useProducts } from "./useProducts";
import type { Product } from "./types";
import type { CartLine } from "../context/StoreContext";

export interface ResolvedLine {
  line: CartLine;
  product: Product;
  unitPrice: number;
  lineTotal: number;
}

/** Unit price for a cart line, honouring the chosen size variant. */
export function unitPriceFor(product: Product, size?: string): number {
  if (size && product.sizes) {
    const match = product.sizes.find((s) => s.label === size);
    if (match) return match.priceMillimes;
  }
  return product.priceMillimes;
}

/** Single source of truth for cart line resolution + subtotal (millimes). */
export function useCartLines(): { lines: ResolvedLine[]; subtotal: number; loading: boolean } {
  const { cart } = useStore();
  const products = useProducts();
  const byId = new Map((products ?? []).map((p) => [p.id, p]));
  const lines: ResolvedLine[] = cart
    .map((line) => {
      const product = byId.get(line.id);
      if (!product) return null;
      const unitPrice = unitPriceFor(product, line.size);
      return { line, product, unitPrice, lineTotal: unitPrice * line.qty };
    })
    .filter((x): x is ResolvedLine => x !== null);
  const subtotal = lines.reduce((sum, x) => sum + x.lineTotal, 0);
  return { lines, subtotal, loading: products === null };
}
