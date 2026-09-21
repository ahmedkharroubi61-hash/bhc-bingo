import type { AdminOrder } from "./admin";

export interface MonthlySales {
  key: string;        // "2026-09"
  label: string;      // "Sep 2026"
  orders: number;
  revenueMillimes: number;
}

export interface TopProduct {
  productId: string;
  title: string;
  qtySold: number;
  revenueMillimes: number;
}

export interface AdminStats {
  totalRevenueMillimes: number;
  totalOrders: number;
  thisMonthRevenueMillimes: number;
  thisMonthOrders: number;
  pendingOrders: number;
  /** This month's revenue vs last month, in %. null when last month had no sales. */
  momChangePct: number | null;
  confirmedCount: number;
  cancelledCount: number;
  /** Confirmed ÷ (received + confirmed), in % — the "orders confirmed" gauge. */
  confirmedRate: number;
  monthly: MonthlySales[];       // chronological, last 6 months
  topProducts: TopProduct[];     // most sold first, top 8
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

/** Cancelled orders are excluded from revenue and best-sellers. */
export function computeStats(orders: AdminOrder[]): AdminStats {
  const live = orders.filter((o) => o.status !== "cancelled");
  const nowKey = monthKey(new Date().toISOString());

  let totalRevenue = 0;
  let thisMonthRevenue = 0;
  let thisMonthOrders = 0;
  const byMonth = new Map<string, MonthlySales>();
  const byProduct = new Map<string, TopProduct>();

  for (const o of live) {
    totalRevenue += o.totalMillimes;
    const key = monthKey(o.createdAt);
    if (key === nowKey) { thisMonthRevenue += o.totalMillimes; thisMonthOrders += 1; }

    const m = byMonth.get(key) ?? { key, label: monthLabel(key), orders: 0, revenueMillimes: 0 };
    m.orders += 1;
    m.revenueMillimes += o.totalMillimes;
    byMonth.set(key, m);

    for (const it of o.items) {
      const p = byProduct.get(it.productId)
        ?? { productId: it.productId, title: it.title, qtySold: 0, revenueMillimes: 0 };
      p.qtySold += it.qty;
      p.revenueMillimes += it.lineMillimes;
      byProduct.set(it.productId, p);
    }
  }

  const monthly = buildRecentMonths(6, byMonth);
  const topProducts = [...byProduct.values()]
    .sort((a, b) => b.qtySold - a.qtySold || b.revenueMillimes - a.revenueMillimes)
    .slice(0, 8);

  const lastMonth = monthly.length >= 2 ? monthly[monthly.length - 2].revenueMillimes : 0;
  const momChangePct = lastMonth > 0
    ? Math.round(((thisMonthRevenue - lastMonth) / lastMonth) * 1000) / 10
    : null;

  const receivedCount = orders.filter((o) => o.status === "received").length;
  const confirmedCount = orders.filter((o) => o.status === "confirmed").length;
  const cancelledCount = orders.filter((o) => o.status === "cancelled").length;
  const decidable = receivedCount + confirmedCount;

  return {
    totalRevenueMillimes: totalRevenue,
    totalOrders: live.length,
    thisMonthRevenueMillimes: thisMonthRevenue,
    thisMonthOrders,
    pendingOrders: receivedCount,
    momChangePct,
    confirmedCount,
    cancelledCount,
    confirmedRate: decidable > 0 ? Math.round((confirmedCount / decidable) * 100) : 0,
    monthly,
    topProducts,
  };
}

/** The last `count` calendar months up to now, zero-filled for months with no sales. */
function buildRecentMonths(count: number, byMonth: Map<string, MonthlySales>): MonthlySales[] {
  const out: MonthlySales[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out.push(byMonth.get(key) ?? { key, label: monthLabel(key), orders: 0, revenueMillimes: 0 });
  }
  return out;
}
