import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminListOrders, adminListProducts, type AdminOrder } from "../../lib/admin";
import { computeStats } from "../../lib/adminStats";
import { formatPrice } from "../../lib/format";
import { AreaChart, Gauge } from "./charts";
import { IconRevenue, IconTrend, IconReceipt, IconClock } from "./adminIcons";

export function AdminDashboard() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [images, setImages] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([adminListOrders(), adminListProducts()])
      .then(([o, prods]) => {
        if (!alive) return;
        setOrders(o);
        setImages(new Map(prods.map((p) => [p.id, p.image])));
      })
      .catch((e) => { if (alive) setError(e instanceof Error ? e.message : "Failed to load."); });
    return () => { alive = false; };
  }, []);

  const stats = useMemo(() => (orders ? computeStats(orders) : null), [orders]);
  const maxQty = useMemo(
    () => (stats ? Math.max(1, ...stats.topProducts.map((p) => p.qtySold)) : 1),
    [stats]
  );

  if (error) return <div className="admin-page"><p className="admin-error">{error}</p></div>;
  if (!stats) return <div className="admin-page"><p className="admin-muted">Loading dashboard…</p></div>;

  const delta = stats.momChangePct;

  return (
    <div className="admin-page">
      <header className="admin-head">
        <div>
          <h1 className="admin-h1">Dashboard</h1>
          <p className="admin-sub">Sales overview · cash on delivery</p>
        </div>
        <Link to="/admin/orders" className="admin-btn admin-btn-primary">View all orders</Link>
      </header>

      {/* STAT CHIPS */}
      <div className="admin-stats">
        <div className="admin-stat c-accent">
          <span className="admin-stat-icon"><IconRevenue /></span>
          <span className="admin-stat-label">Revenue this month</span>
          <span className="admin-stat-value">{formatPrice(stats.thisMonthRevenueMillimes)}</span>
          <span className="admin-stat-sub">{stats.thisMonthOrders} orders</span>
        </div>
        <div className="admin-stat c-green">
          <span className="admin-stat-icon"><IconTrend /></span>
          <span className="admin-stat-label">Total revenue</span>
          <span className="admin-stat-value">{formatPrice(stats.totalRevenueMillimes)}</span>
          <span className="admin-stat-sub">All time</span>
        </div>
        <div className="admin-stat c-blue">
          <span className="admin-stat-icon"><IconReceipt /></span>
          <span className="admin-stat-label">Orders</span>
          <span className="admin-stat-value">{stats.totalOrders}</span>
          <span className="admin-stat-sub">Paid on delivery</span>
        </div>
        <div className="admin-stat c-amber">
          <span className="admin-stat-icon"><IconClock /></span>
          <span className="admin-stat-label">Pending</span>
          <span className="admin-stat-value">{stats.pendingOrders}</span>
          <span className="admin-stat-sub">Awaiting confirmation</span>
        </div>
      </div>

      {/* HERO CHART + GAUGE */}
      <div className="admin-grid" style={{ marginBottom: 16 }}>
        <section className="admin-card">
          <div className="admin-card-head">
            <div>
              <h2 className="admin-card-title">Revenue</h2>
              <p className="admin-card-sub">Last 6 months · in dinars</p>
            </div>
            <span className="admin-card-menu">···</span>
          </div>
          <div className="admin-hero-row">
            <span className="admin-hero-value">{formatPrice(stats.thisMonthRevenueMillimes)}</span>
            {delta !== null ? (
              <span className={`admin-delta ${delta > 0 ? "up" : delta < 0 ? "down" : "flat"}`}>
                {delta > 0 ? "▲" : delta < 0 ? "▼" : "•"} {Math.abs(delta)}%
              </span>
            ) : null}
            <span className="admin-muted">vs last month</span>
          </div>
          <AreaChart points={stats.monthly.map((m) => ({ label: m.label.split(" ")[0], value: m.revenueMillimes }))} />
        </section>

        <section className="admin-card">
          <div className="admin-card-head">
            <div>
              <h2 className="admin-card-title">Orders confirmed</h2>
              <p className="admin-card-sub">Of decided orders</p>
            </div>
          </div>
          <Gauge percent={stats.confirmedRate} />
          <div className="agauge-center">
            <div className="agauge-pct">{stats.confirmedRate}%</div>
            <div className="agauge-note">{stats.confirmedCount} confirmed · {stats.pendingOrders} pending</div>
          </div>
          {stats.cancelledCount > 0 ? (
            <p className="admin-muted" style={{ textAlign: "center", fontSize: ".82rem", margin: "10px 0 0" }}>
              {stats.cancelledCount} cancelled
            </p>
          ) : null}
        </section>
      </div>

      {/* BEST SELLERS */}
      <section className="admin-card">
        <div className="admin-card-head">
          <div>
            <h2 className="admin-card-title">Best selling products</h2>
            <p className="admin-card-sub">By units sold · all time</p>
          </div>
          <Link to="/admin/products" className="admin-link-btn">Manage stock</Link>
        </div>
        {stats.topProducts.length === 0 ? (
          <p className="admin-muted">No sales recorded yet.</p>
        ) : (
          <ul className="admin-sellers">
            {stats.topProducts.map((p, i) => (
              <li key={p.productId} className="admin-seller">
                <span className="admin-seller-rank">{i + 1}</span>
                <img className="admin-seller-thumb" src={images.get(p.productId) ?? ""} alt="" loading="lazy" />
                <span style={{ minWidth: 0 }}>
                  <Link to={`/admin/orders?product=${p.productId}`} className="admin-seller-name">{p.title}</Link>
                  <span className="admin-seller-sold">
                    <span className="admin-top-bar" style={{ display: "inline-block", width: 90, height: 5, verticalAlign: "middle", background: "var(--adm-line-2)", borderRadius: 4, overflow: "hidden", marginRight: 8 }}>
                      <span style={{ display: "block", height: "100%", width: `${(p.qtySold / maxQty) * 100}%`, background: "var(--adm-accent)", borderRadius: 4 }} />
                    </span>
                    {p.qtySold} sold
                  </span>
                </span>
                <span className="admin-seller-metrics">
                  <span className="admin-seller-qty">{p.qtySold}</span>
                  <span className="admin-seller-rev">{formatPrice(p.revenueMillimes)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
