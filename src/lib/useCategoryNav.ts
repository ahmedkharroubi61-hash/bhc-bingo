import { useEffect, useMemo, useState } from "react";
import { useProducts } from "./useProducts";
import { getCategories } from "./products";
import { categories as fallbackCategories } from "../data/categories";
import type { Category, CategorySlug } from "./types";

/** Every category from the database (admin-managed), in sort order. Built-in list until it loads. */
export function useCategories(): Category[] {
  const [list, setList] = useState<Category[]>(fallbackCategories);
  useEffect(() => {
    let alive = true;
    getCategories().then((c) => { if (alive) setList(c); });
    return () => { alive = false; };
  }, []);
  return list;
}

/**
 * Category list restricted to the categories that actually have products, so the
 * nav and home tiles never lead to an empty "0 products" dead-end. During the
 * initial load (products still null) the full list is returned to avoid an empty
 * flash; it settles to the in-stock set once products arrive, and auto-includes
 * new categories as inventory grows.
 */
export function useCategoryNav(): Category[] {
  const products = useProducts();
  const categories = useCategories();
  return useMemo(() => {
    if (!products) return categories;
    const present = new Set<CategorySlug>(products.map((p) => p.category));
    const filtered = categories.filter((c) => present.has(c.slug));
    return filtered.length > 0 ? filtered : categories;
  }, [products, categories]);
}
