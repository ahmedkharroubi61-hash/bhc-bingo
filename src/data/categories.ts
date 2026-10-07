import type { Category } from "../lib/types";

/**
 * Fallback list used before the `categories` table has loaded (or if it can't be
 * reached). The live list — including categories added from the admin — comes
 * from the database via useCategories().
 */
export const categories: Category[] = [
  { slug: "skincare", name: "Skincare", sort: 1, image: "/img/cat-skincare.jpg" },
  { slug: "face", name: "Face Care", sort: 2, image: "/img/cat-face.jpg" },
  { slug: "body", name: "Body Care", sort: 3, image: "/img/cat-body.jpg" },
  { slug: "hair", name: "Hair Care", sort: 4, image: "/img/cat-hair.jpg" },
  { slug: "makeup", name: "Makeup", sort: 5, image: "/img/cat-makeup.jpg" },
  { slug: "sun", name: "Sun Protection", sort: 6, image: "/img/cat-sun.jpg" },
  { slug: "baby", name: "Baby & Mother", sort: 7, image: "/img/lifestyle-1.jpg" },
  { slug: "wellness", name: "Wellness", sort: 8, image: "/img/lifestyle-3.jpg" },
];

const BUILT_IN_IMAGE: Record<string, string> = Object.fromEntries(
  categories.map((c) => [c.slug, c.image as string])
);

/** The picture for a category: its own uploaded image, else the built-in one, else a generic shot. */
export function categoryImage(c: Pick<Category, "slug" | "image">): string {
  return c.image || BUILT_IN_IMAGE[c.slug] || "/img/hero-bg.jpg";
}
