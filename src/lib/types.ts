/** Category slugs live in the `categories` table, so admins can add new ones. */
export type CategorySlug = string;

export type ProductTag = "featured" | "best" | "new" | "trending" | "showcase";

export interface Category {
  slug: CategorySlug;
  name: string;
  sort: number;
  /** Tile / banner picture; falls back to a built-in image for the original categories. */
  image?: string | null;
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
  /** Homepage hero priority: undefined = not featured; lower number shows first. */
  heroRank?: number;
  /** Optional size variants; when present, a size must be chosen before adding to cart. */
  sizes?: ProductSize[];
  /** Editorial detail-page content (attached by the repository from productContent). */
  description?: string;
  bestFor?: string;
  ingredients?: string;
  howToUse?: string;
  /** French detail-page content; shown when the language is French, else the base fields. */
  descriptionFr?: string;
  ingredientsFr?: string;
  howToUseFr?: string;
}

/** How the order reaches the customer. */
export type FulfillmentMethod = "delivery" | "pickup";

/** Reservations (the "Services" side). */
export type ReservationSlot = "10:00" | "15:00";
export type ReservationStatus = "received" | "confirmed" | "cancelled";
export interface ReservationInput {
  name: string;
  phone: string;
  service: string;
  date: string;   // YYYY-MM-DD
  slot: ReservationSlot;
  notes: string;
}

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
