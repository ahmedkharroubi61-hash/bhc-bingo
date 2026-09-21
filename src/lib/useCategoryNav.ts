import { useMemo } from "react";
import { useProducts } from "./useProducts";
import { categories } from "../data/categories";
import type { Category, CategorySlug } from "./types";

/**
 * Category list restricted to the categories that actually have products, so the
 * nav and home tiles never lead to an empty "0 products" dead-end. During the
 * initial load (products still null) the full list is returned to avoid an empty
 * flash; it settles to the in-stock set once products arrive, and auto-includes
 * new categories as inventory grows.
 */
export function useCategoryNav(): Category[] {
  const products = useProducts();
  return useMemo(() => {
    if (!products) return categories;
    const present = new Set<CategorySlug>(products.map((p) => p.category));
    const filtered = categories.filter((c) => present.has(c.slug));
    return filtered.length > 0 ? filtered : categories;
  }, [products]);
}

/** Set of category slugs that currently have at least one product. */
export function useInStockCategorySet(): Set<string> {
  const products = useProducts();
  return useMemo(() => {
    if (!products) return new Set<string>(categories.map((c) => c.slug));
    return new Set<string>(products.map((p) => p.category));
  }, [products]);
}
