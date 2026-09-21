import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Catalog } from "./pages/Catalog";
import { Brands } from "./pages/Brands";
import { CartPage } from "./pages/CartPage";
import { ProductPage } from "./pages/ProductPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderConfirmed } from "./pages/OrderConfirmed";
import { WishlistPage } from "./pages/WishlistPage";
import { Placeholder } from "./pages/Placeholder";
import { NotFound } from "./pages/NotFound";
import { AdminApp } from "./pages/admin/AdminApp";

export default function App() {
  return (
    <Routes>
      {/* Admin — its own shell (no storefront header/footer), gated by auth. */}
      <Route path="/admin/*" element={<AdminApp />} />

      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/category/:slug" element={<Catalog />} />
        <Route path="/brands" element={<Brands />} />
        <Route path="/brand/:brand" element={<Catalog />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmed" element={<OrderConfirmed />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/account" element={<Placeholder title="My Account" note="Sign-in and order history arrive with the accounts phase (Supabase Auth)." />} />
        <Route path="/contact" element={<Placeholder title="Contact Us" />} />
        <Route path="/about" element={<Placeholder title="About Us" />} />
        <Route path="/shipping-returns" element={<Placeholder title="Shipping & Returns" />} />
        <Route path="/legal-notice" element={<Placeholder title="Legal Notice" note="Legal pages are being ported from the previous build next." />} />
        <Route path="/privacy-policy" element={<Placeholder title="Privacy Policy" note="Legal pages are being ported from the previous build next." />} />
        <Route path="/cookie-policy" element={<Placeholder title="Cookie Policy" note="Legal pages are being ported from the previous build next." />} />
        <Route path="/terms-and-conditions" element={<Placeholder title="Terms & Conditions" note="Legal pages are being ported from the previous build next." />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
