import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { SplitLanding } from "./pages/SplitLanding";
import { Home } from "./pages/Home";
import { ReservationsPage } from "./pages/ReservationsPage";
import { ContactPage } from "./pages/ContactPage";
import { Catalog } from "./pages/Catalog";
import { Brands } from "./pages/Brands";
import { CartPage } from "./pages/CartPage";
import { ProductPage } from "./pages/ProductPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderConfirmed } from "./pages/OrderConfirmed";
import { WishlistPage } from "./pages/WishlistPage";
import { Placeholder } from "./pages/Placeholder";
import { CookiePolicy } from "./pages/CookiePolicy";
import { NotFound } from "./pages/NotFound";
import { AccountPage } from "./pages/account/AccountPage";
import { AdminApp } from "./pages/admin/AdminApp";

export default function App() {
  return (
    <Routes>
      {/* Admin — its own shell (no storefront header/footer), gated by auth. */}
      <Route path="/admin/*" element={<AdminApp />} />

      {/* Entry chooser — full-screen split, its own shell. */}
      <Route path="/" element={<SplitLanding />} />

      <Route element={<Layout />}>
        <Route path="/shop" element={<Home />} />
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="/category/:slug" element={<Catalog />} />
        <Route path="/brands" element={<Brands />} />
        <Route path="/brand/:brand" element={<Catalog />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmed" element={<OrderConfirmed />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about" element={<Placeholder title="About Us" body="BHC Bingo is a parapharmacie based in Sousse, Tunisia, bringing you authentic skincare, hair care, wellness products and food supplements from brands we trust. Every product comes from authorised suppliers, and our team is happy to give you professional advice in store or online. Order from home and pay in cash on delivery anywhere in Tunisia (delivery is 7 DT, free from 100 DT), or pick up your order at our shop." />} />
        <Route path="/shipping-returns" element={<Placeholder title="Shipping & Returns" />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
