import Link from "next/link";
import { notFound } from "next/navigation";
import { UserControls } from "@/components/admin/user-controls";
import { Card, OrderStatusPill, PageHeader, PaymentPill, Pill, Table, Td, Th, dateOnly, dateTime } from "@/components/admin/ui";
import { requireOwner } from "@/lib/auth/guards";
import type { OrderStatus } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import { getUserDetail } from "@/services/admin/user-admin.service";

export const metadata = { title: "User" };

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, me] = await Promise.all([params, requireOwner()]);
  const detail = await getUserDetail(id);
  if (!detail) notFound();
  const { user: u, orders, reviewCount, lifetimeValue, paidOrders } = detail;
  const role = (u.role ?? "customer") as "customer" | "owner";

  return (
    <>
      <PageHeader
        back={{ href: "/admin/users", label: "Users" }}
        title={u.name || u.email}
        description={u.email}
        actions={
          <>
            {role === "owner" ? <Pill tone="info">Owner</Pill> : <Pill>Customer</Pill>}
            {u.isBlocked && <Pill tone="bad">Blocked</Pill>}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Lifetime spend", value: formatINR(lifetimeValue) },
              { label: "Paid orders", value: paidOrders },
              { label: "Reviews written", value: reviewCount },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-line bg-paper/60 p-5">
                <p className="text-sm text-muted">{s.label}</p>
                <p className="mt-2 text-2xl font-semibold">{s.value}</p>
              </div>
            ))}
          </div>

          <div>
            <h2 className="mb-3 font-sans text-[15px] font-semibold">Orders</h2>
            {orders.length ? (
              <Table>
                <thead>
                  <tr><Th>Order</Th><Th>Placed</Th><Th>Status</Th><Th>Payment</Th><Th className="text-right">Total</Th></tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={String(o._id)} className="hover:bg-surface/60">
                      <Td><Link className="font-medium hover:underline" href={`/admin/orders/${String(o._id)}`}>{o.orderNumber}</Link></Td>
                      <Td className="whitespace-nowrap text-muted">{dateTime(o.createdAt)}</Td>
                      <Td><OrderStatusPill status={o.status as OrderStatus} /></Td>
                      <Td><PaymentPill status={o.paymentStatus} /></Td>
                      <Td className="text-right tabular-nums">{formatINR(o.total)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted">No orders yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card title="Access">
            <UserControls userId={id} role={role} isBlocked={Boolean(u.isBlocked)} isSelf={me.id === id} />
            {u.isBlocked && u.blockedReason && <p className="mt-3 text-xs text-muted">Reason: {u.blockedReason}</p>}
          </Card>
          <Card title="Profile">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted">Joined</dt><dd>{u.createdAt ? dateOnly(u.createdAt) : "—"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Email verified</dt><dd>{u.emailVerified ? dateOnly(u.emailVerified) : "No"}</dd></div>
              {u.phone && <div className="flex justify-between gap-3"><dt className="text-muted">Phone</dt><dd>{u.phone}</dd></div>}
            </dl>
            {u.addresses?.length ? (
              <address className="mt-4 border-t border-line pt-4 text-sm not-italic text-muted">
                {u.addresses[0]!.line1}, {u.addresses[0]!.city}, {u.addresses[0]!.state} {u.addresses[0]!.pincode}
              </address>
            ) : null}
          </Card>
        </div>
      </div>
    </>
  );
}
