import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { BarList } from "@/components/admin/charts/bar-list";
import { KpiTile } from "@/components/admin/charts/kpi-tile";
import { RevenueChart } from "@/components/admin/charts/revenue-chart";
import { Card, PageHeader, Tabs } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import { getAnalytics, RANGES, type RangeDays } from "@/services/admin/analytics.service";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const requested = Number((await searchParams).range);
  const days: RangeDays = (RANGES as readonly number[]).includes(requested) ? (requested as RangeDays) : 30;
  const a = await getAnalytics(days);
  const period = `previous ${days} days`;

  return (
    <>
      <PageHeader title="Analytics" description="Paid orders only. Refunded and unpaid orders are excluded from revenue." />

      {/* One filter row, above everything it scopes */}
      <Tabs current={String(days)} items={RANGES.map((d) => ({ value: String(d), label: `Last ${d} days`, href: `/admin?range=${d}` }))} />

      {a.pendingApproval > 0 && (
        <Link
          href="/admin/approvals"
          className="mb-6 flex items-center gap-3 rounded-lg border border-mto/30 bg-mto/10 px-4 py-3 text-sm text-mto transition-colors hover:bg-mto/15"
        >
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          <span>
            <strong>{a.pendingApproval}</strong> paid order{a.pendingApproval === 1 ? " is" : "s are"} waiting for your approval.
          </span>
          <span className="ml-auto font-medium underline underline-offset-4">Review</span>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile hero label="Revenue" value={formatINR(a.kpis.revenue.value)} delta={a.kpis.revenue.delta} period={period} />
        <KpiTile label="Paid orders" value={a.kpis.orders.value.toLocaleString("en-IN")} delta={a.kpis.orders.delta} period={period} />
        <KpiTile label="Average order value" value={formatINR(a.kpis.aov.value)} delta={a.kpis.aov.delta} period={period} />
        <KpiTile label="New customers" value={a.kpis.newCustomers.value.toLocaleString("en-IN")} delta={a.kpis.newCustomers.delta} period={period} />
      </div>

      <Card title={`Revenue per day · last ${days} days`} className="mt-6">
        <RevenueChart series={a.series} />
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Top products by revenue" action={<Link href="/admin/products" className="text-sm text-muted hover:text-ink">All products</Link>}>
          <BarList
            rows={a.topProducts.map((p) => ({
              key: p.id,
              label: p.name,
              value: p.revenue,
              display: formatINR(p.revenue),
              sub: `${p.units} sold`,
              href: `/admin/products/${p.id}`,
            }))}
            emptyText="No paid orders in this period yet."
          />
        </Card>
        <Card title="Orders by status" action={<Link href="/admin/orders" className="text-sm text-muted hover:text-ink">All orders</Link>}>
          <BarList
            rows={a.statusCounts.map((s) => ({
              key: s.status,
              label: ORDER_STATUS_LABEL[s.status],
              value: s.count,
              display: s.count.toLocaleString("en-IN"),
              href: `/admin/orders?status=${s.status}`,
            }))}
            emptyText="No orders in this period yet."
          />
        </Card>
      </div>

      <Card
        title="Low stock (ready-to-ship, 2 or fewer)"
        className="mt-6"
        action={<Link href="/admin/products?stock=low" className="text-sm text-muted hover:text-ink">View all</Link>}
      >
        {a.lowStock.length ? (
          <ul className="divide-y divide-line/70">
            {a.lowStock.map((l) => (
              <li key={`${l.id}-${l.sku}`} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <Link href={`/admin/products/${l.id}`} className="min-w-0 truncate hover:underline">
                  {l.name} <span className="text-muted">· {l.sku}</span>
                </Link>
                <span className={l.stock === 0 ? "font-medium text-danger" : "text-mto"}>{l.stock === 0 ? "Out of stock" : `${l.stock} left`}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Every ready-to-ship variant has more than 2 in stock.</p>
        )}
      </Card>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild><Link href="/admin/products/new">Add a product</Link></Button>
        <Button asChild variant="secondary"><Link href="/admin/categories">Manage categories</Link></Button>
      </div>
    </>
  );
}
