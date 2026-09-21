import { useEffect } from "react";
import { NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAdminSession } from "../../lib/adminAuth";
import { AdminLogin } from "./AdminLogin";
import { AdminDashboard } from "./AdminDashboard";
import { AdminProducts } from "./AdminProducts";
import { AdminOrders } from "./AdminOrders";
import { IconGrid, IconBox, IconReceipt, IconExternal } from "./adminIcons";

const NAV = [
  { to: "/admin", label: "Dashboard", end: true, icon: IconGrid },
  { to: "/admin/products", label: "Stock & Products", end: false, icon: IconBox },
  { to: "/admin/orders", label: "Orders", end: false, icon: IconReceipt },
];

export function AdminApp() {
  const session = useAdminSession();
  const { pathname } = useLocation();

  // The admin area is its own visual world — force a light document background.
  useEffect(() => {
    document.body.classList.add("admin-mode");
    return () => document.body.classList.remove("admin-mode");
  }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  if (session.loading) {
    return <div className="admin-boot"><span className="admin-spin" aria-hidden="true" />Loading admin…</div>;
  }
  if (!session.isAdmin) {
    return <AdminLogin session={session} />;
  }

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="admin-brand">
          <span className="admin-brand-mark">BIOBINGO</span>
          <span className="admin-brand-tag">Admin</span>
        </div>
        <nav className="admin-nav" aria-label="Admin sections">
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`}>
                <Icon /> {n.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="admin-side-foot">
          <a className="admin-back" href="/" target="_blank" rel="noreferrer">View storefront <IconExternal /></a>
          <div className="admin-user">
            <span className="admin-user-email" title={session.email ?? ""}>{session.email}</span>
            <button type="button" className="admin-signout" onClick={() => session.signOut()}>Sign out</button>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}
