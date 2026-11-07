import "server-only";
import { connectDB } from "@/lib/db/connect";
import { ORDER_STATUS, type OrderStatus } from "@/lib/constants";
import { Order, Product, User } from "@/models";

export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];

const TZ = "Asia/Kolkata";
const DAY = 86_400_000;

/** Revenue counts paid orders only; refunded and unpaid orders are excluded. */
const PAID = { paymentStatus: "PAID" };

function dayKey(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export async function getAnalytics(days: RangeDays) {
  await connectDB();
  const now = new Date();
  const start = new Date(now.getTime() - days * DAY);
  const prevStart = new Date(start.getTime() - days * DAY);

  const sumPaid = (from: Date, to: Date) =>
    Order.aggregate<{ revenue: number; orders: number }>([
      { $match: { ...PAID, createdAt: { $gte: from, $lt: to } } },
      { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
    ]).then((r) => r[0] ?? { revenue: 0, orders: 0 });

  const [cur, prev, byDay, byStatus, top, newCustomers, prevCustomers, lowStock, pendingApproval] = await Promise.all([
    sumPaid(start, now),
    sumPaid(prevStart, start),
    Order.aggregate<{ _id: string; revenue: number; orders: number }>([
      { $match: { ...PAID, createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TZ } }, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
    ]),
    Order.aggregate<{ _id: OrderStatus; n: number }>([
      { $match: { createdAt: { $gte: start }, status: { $ne: "PENDING_PAYMENT" } } },
      { $group: { _id: "$status", n: { $sum: 1 } } },
    ]),
    Order.aggregate<{ _id: string; name: string; slug: string; revenue: number; units: number }>([
      { $match: { ...PAID, createdAt: { $gte: start } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.product", name: { $last: "$items.productName" }, slug: { $last: "$items.productSlug" }, revenue: { $sum: "$items.lineTotal" }, units: { $sum: "$items.qty" } } },
      { $sort: { revenue: -1 } },
      { $limit: 6 },
    ]),
    User.countDocuments({ createdAt: { $gte: start }, role: { $ne: "owner" } }),
    User.countDocuments({ createdAt: { $gte: prevStart, $lt: start }, role: { $ne: "owner" } }),
    Product.aggregate<{ _id: string; name: string; slug: string; sku: string; stock: number }>([
      { $match: { status: "ACTIVE", availability: "READY_STOCK" } },
      { $unwind: "$variants" },
      { $match: { "variants.isActive": { $ne: false }, "variants.stock": { $lte: 2 } } },
      { $project: { name: 1, slug: 1, sku: "$variants.sku", stock: "$variants.stock" } },
      { $sort: { stock: 1 } },
      { $limit: 8 },
    ]),
    Order.countDocuments({ status: "AWAITING_APPROVAL" }),
  ]);

  // Fill every day in the range so gaps show as zero, not as missing bars.
  const byKey = new Map(byDay.map((d) => [d._id, d]));
  const series: { date: string; revenue: number; orders: number }[] = [];
  for (let t = start.getTime() + DAY; t <= now.getTime() + 1; t += DAY) {
    const key = dayKey(new Date(t));
    if (series.at(-1)?.date === key) continue;
    series.push({ date: key, revenue: byKey.get(key)?.revenue ?? 0, orders: byKey.get(key)?.orders ?? 0 });
  }

  const statusCounts = ORDER_STATUS.filter((s) => s !== "PENDING_PAYMENT")
    .map((s) => ({ status: s, count: byStatus.find((b) => b._id === s)?.n ?? 0 }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);

  const delta = (a: number, b: number) => (b === 0 ? null : (a - b) / b);
  const aov = cur.orders ? Math.round(cur.revenue / cur.orders) : 0;
  const prevAov = prev.orders ? Math.round(prev.revenue / prev.orders) : 0;

  return {
    days,
    kpis: {
      revenue: { value: cur.revenue, delta: delta(cur.revenue, prev.revenue) },
      orders: { value: cur.orders, delta: delta(cur.orders, prev.orders) },
      aov: { value: aov, delta: delta(aov, prevAov) },
      newCustomers: { value: newCustomers, delta: delta(newCustomers, prevCustomers) },
    },
    series,
    statusCounts,
    topProducts: top.map((t) => ({ id: String(t._id), name: t.name, slug: t.slug, revenue: t.revenue, units: t.units })),
    lowStock: lowStock.map((l) => ({ id: String(l._id), name: l.name, sku: l.sku, stock: l.stock })),
    pendingApproval,
  };
}
export type Analytics = Awaited<ReturnType<typeof getAnalytics>>;
