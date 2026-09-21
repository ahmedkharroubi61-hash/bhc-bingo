import type { Product } from "./types";

/** Shown on the storefront when a product has zero stock. */
export const OUT_OF_STOCK_LABEL = "Rupture de stock";

/**
 * A product is out of stock only when the backend reports exactly 0 units.
 * Undefined stock (local seed / demo mode) is treated as available so the
 * storefront always works without a backend.
 */
export function isOutOfStock(product: Product): boolean {
  return product.stock === 0;
}
