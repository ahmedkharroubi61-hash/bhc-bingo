import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface CartLine {
  id: string;
  qty: number;
  /** Chosen size label, when the product has size variants. */
  size?: string;
}

const CART_KEY = "bingo_cart_v1";
const WISH_KEY = "bingo_wishlist_v1";

/** A cart line is unique per product + chosen size. */
export function lineKey(id: string, size?: string): string {
  return `${id}|${size ?? ""}`;
}
const isSame = (l: CartLine, id: string, size?: string): boolean =>
  l.id === id && (l.size ?? "") === (size ?? "");

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / storage disabled — degrade silently */
  }
}

export interface AddToCartOptions {
  qty?: number;
  size?: string;
}

export interface Store {
  cart: CartLine[];
  cartCount: number;
  wishlist: string[];
  drawerOpen: boolean;
  addToCart: (id: string, opts?: AddToCartOptions) => void;
  removeFromCart: (id: string, size?: string) => void;
  setQty: (id: string, qty: number, size?: string) => void;
  clearCart: () => void;
  toggleWishlist: (id: string) => void;
  inWishlist: (id: string) => boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>(() => read<CartLine[]>(CART_KEY, []));
  const [wishlist, setWishlist] = useState<string[]>(() => read<string[]>(WISH_KEY, []));
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => write(CART_KEY, cart), [cart]);
  useEffect(() => write(WISH_KEY, wishlist), [wishlist]);

  const value = useMemo<Store>(
    () => ({
      cart,
      cartCount: cart.reduce((n, l) => n + l.qty, 0),
      wishlist,
      drawerOpen,
      addToCart: (id, opts) => {
        const qty = opts?.qty ?? 1;
        const size = opts?.size;
        setCart((c) => {
          const found = c.find((l) => isSame(l, id, size));
          return found
            ? c.map((l) => (isSame(l, id, size) ? { ...l, qty: l.qty + qty } : l))
            : [...c, { id, qty, size }];
        });
        setDrawerOpen(true);
      },
      removeFromCart: (id, size) => setCart((c) => c.filter((l) => !isSame(l, id, size))),
      setQty: (id, qty, size) =>
        setCart((c) =>
          qty <= 0
            ? c.filter((l) => !isSame(l, id, size))
            : c.map((l) => (isSame(l, id, size) ? { ...l, qty } : l))
        ),
      clearCart: () => setCart([]),
      toggleWishlist: (id) =>
        setWishlist((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id])),
      inWishlist: (id) => wishlist.includes(id),
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }),
    [cart, wishlist, drawerOpen]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
