import Link from "next/link";
import { EmptyState, FilterBar, OrderStatusPill, PageHeader, Pagination, PaymentPill, SearchInput, Table, Tabs, Td, Th, dateTime } from "@/components/admin/ui";
import { ORDER_STATUS, ORDER_STATUS_LABEL } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import { listOrders } from "@/services/admin/order-admin.service";

export const metadata = { title: "Orders" };

type Search = { status?: string; q?: string; page?: string };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const status = ORDER_STATUS.includes(sp.status as never) || sp.status === "ALL" ? sp.status! : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const { orders, total, pageCount, counts } = await listOrders({ status, q: sp.q?.trim(), page });

  const qs = (extra: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const merged = { status, q: sp.q, ...extra };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, String(v));
    return `/admin/orders${p.size ? `?${p}` : ""}`;
  };

  const tabs = [
    { value: "", label: "All", href: qs({ status: undefined, page: undefined }) },
    ...ORDER_STATUS.filter((s) => s !== "PENDING_PAYMENT").map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s], count: counts[s] ?? 0, href: qs({ status: s, page: undefined }) })),
    { value: "PENDING_PAYMENT", label: "Unpaid", count: counts.PENDING_PAYMENT ?? 0, href: qs({ status: "PENDING_PAYMENT", page: undefined }) },
  ];

  return (
    <>
      <PageHeader title="Orders" description={`${total} order${total === 1 ? "" : "s"}${status ? ` · ${ORDER_STATUS_LABEL[status as keyof typeof ORDER_STATUS_LABEL] ?? "all statuses"}` : ""}`} />
      <Tabs items={tabs} current={status} />
      <FilterBar>
        {status && <input type="hidden" name="status" value={status} />}
        <SearchInput defaultValue={sp.q} placeholder="Search order number, email, name or phone" />
      </FilterBar>

      {orders.length === 0 ? (
        <EmptyState title="No orders found">Try another status or search.</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Order</Th>
              <Th>Customer</Th>
              <Th>Placed</Th>
              <Th>Status</Th>
              <Th>Payment</Th>
              <Th className="text-right">Total</Th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="group transition-colors hover:bg-surface/60">
                <Td>
                  <Link href={`/admin/orders/${o.id}`} className="font-medium underline-offset-4 group-hover:underline">
                    {o.orderNumber}
                  </Link>
                  <p className="text-xs text-muted">{o.itemCount} item{o.itemCount === 1 ? "" : "s"}</p>
                </Td>
                <Td>
                  <p>{o.customer}</p>
                  <p className="text-xs text-muted">{o.email}</p>
                </Td>
                <Td className="whitespace-nowrap text-muted">{dateTime(o.createdAt)}</Td>
                <Td><OrderStatusPill status={o.status} /></Td>
                <Td><PaymentPill status={o.paymentStatus} /></Td>
                <Td className="text-right font-medium tabular-nums">{formatINR(o.total)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Pagination page={page} pageCount={pageCount} href={(p) => qs({ page: p })} />
    </>
  );
}
