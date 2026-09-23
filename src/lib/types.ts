export type CategorySlug =
  | "skincare" | "face" | "body" | "hair"
  | "makeup" | "sun" | "baby" | "wellness";

export type ProductTag = "featured" | "best" | "new" | "trending" | "showcase";

export interface Category {
  slug: CategorySlug;
  name: string;
  sort: number;
}

export interface ProductSize {
  label: string;
  priceMillimes: number;
}

export interface Product {
  id: string;
  brand: string;
  title: string;
  category: CategorySlug;
  priceMillimes: number;
  oldPriceMillimes?: number;
  rating: number;
  ratingCount: number;
  image: string;
  alt: string;
  tags: ProductTag[];
  /** Units in stock. Undefined in local seed/demo mode (treated as available). 0 → out of stock. */
  stock?: number;
  /** Whether the product is listed on the storefront (admin toggle). */
  active?: boolean;
  /** Optional size variants; when present, a size must be chosen before adding to cart. */
  sizes?: ProductSize[];
  /** Editorial detail-page content (attached by the repository from productContent). */
  description?: string;
  bestFor?: string;
  ingredients?: string;
  howToUse?: string;
}

/** How the order reaches the customer. */
export type FulfillmentMethod = "delivery" | "pickup";

export interface CustomerDetails {
  name: string;
  phone: string;
  address: string;
  city: string;
  notes: string;
  fulfillment: FulfillmentMethod;
}

export interface Order {
  id: string;
  createdAt: string;
  items: { title: string; qty: number; lineTotal: number }[];
  subtotal: number;
  delivery: number;
  total: number;
  customer: CustomerDetails;
  method: "COD";
  fulfillment: FulfillmentMethod;
}
