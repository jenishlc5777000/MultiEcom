import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderActions } from "@/components/admin/order-actions";
import { Card, OrderStatusPill, PageHeader, PaymentPill, Pill, dateTime } from "@/components/admin/ui";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import { allowedActions, getOrderDetail } from "@/services/admin/order-admin.service";
import { getReturnsForOrder } from "@/services/return.service";

export const metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getOrderDetail(id);
  if (!detail) notFound();
  const { order: o, customer, payment } = detail;
  const returns = await getReturnsForOrder(id);
  const status = o.status as OrderStatus;
  const a = o.shippingAddress;
  const refundPending = o.refund?.status === "PENDING" || o.refund?.status === "FAILED";

  return (
    <>
      <PageHeader
        back={{ href: "/admin/orders", label: "Orders" }}
        title={o.orderNumber}
        description={`Placed ${dateTime(o.createdAt)}`}
        actions={
          <>
            <OrderStatusPill status={status} />
            <PaymentPill status={o.paymentStatus} />
          </>
        }
      />

      {status === "AWAITING_APPROVAL" && (
        <p className="mb-6 rounded-lg border border-mto/30 bg-mto/10 px-4 py-3 text-sm text-mto">
          This order is paid and waiting for you. Approve it to start fulfilment, or reject it to cancel and refund.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card title={`Items (${o.items.reduce((n, i) => n + i.qty, 0)})`} padded={false}>
            <ul className="divide-y divide-line/70">
              {o.items.map((i) => (
                <li key={String(i._id)} className="flex gap-4 px-5 py-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-surface">
                    {i.imageUrl && <Image src={i.imageUrl} alt="" fill sizes="64px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/products/${String(i.product)}`} className="font-medium hover:underline">{i.productName}</Link>
                    <p className="text-sm text-muted">{[i.glazeName, i.sizeLabel].filter(Boolean).join(" · ") || "Standard"} · SKU {i.sku}</p>
                    {i.availability === "MADE_TO_ORDER" && <Pill tone="warn" className="mt-1">Made to order</Pill>}
                  </div>
                  <div className="text-right text-sm tabular-nums">
                    <p>{formatINR(i.unitPrice)} × {i.qty}</p>
                    <p className="font-medium">{formatINR(i.lineTotal)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-line px-5 py-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{formatINR(o.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd className="tabular-nums">{o.shippingFee ? formatINR(o.shippingFee) : "Free"}</dd></div>
              {o.discount ? <div className="flex justify-between"><dt className="text-muted">Discount</dt><dd className="tabular-nums">−{formatINR(o.discount)}</dd></div> : null}
              <div className="flex justify-between pt-1 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatINR(o.total)}</dd></div>
            </dl>
          </Card>

          <Card title="Timeline">
            <ol className="relative space-y-5 border-l border-line pl-6">
              {[...(o.timeline ?? [])].reverse().map((t, i) => (
                <li key={i} className="relative">
                  <span className={`absolute -left-[29px] top-1 size-2.5 rounded-full ring-4 ring-canvas ${i === 0 ? "bg-ink" : "bg-line"}`} aria-hidden />
                  <p className="text-sm font-medium">
                    {t.internal ? "Note" : ORDER_STATUS_LABEL[t.status as OrderStatus] ?? t.status}
                    <span className="ml-2 font-normal text-muted">· {t.by}</span>
                    {t.internal && <span className="ml-2 text-xs text-muted">(internal)</span>}
                  </p>
                  {t.note && <p className="text-sm text-muted">{t.note}</p>}
                  <p className="text-xs text-muted">{dateTime(t.at)}</p>
                </li>
              ))}
              {!o.timeline?.length && <li className="text-sm text-muted">No history recorded for this order.</li>}
            </ol>
          </Card>

          {returns.length > 0 && (
            <Card title="Return requests" action={<Link href="/admin/approvals?tab=returns" className="text-sm text-muted hover:text-ink">Open approvals</Link>}>
              <ul className="space-y-3 text-sm">
                {returns.map((r) => (
                  <li key={String(r._id)} className="flex flex-wrap items-center justify-between gap-2">
                    <span>{r.reason.replaceAll("_", " ").toLowerCase()} · {dateTime(r.createdAt ?? new Date())}</span>
                    <Pill tone={r.status === "REFUNDED" ? "good" : r.status === "REJECTED" ? "bad" : "warn"}>{r.status.toLowerCase()}</Pill>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Actions">
            <OrderActions orderId={id} actions={allowedActions(status) as never} refundPending={refundPending} />
          </Card>

          <Card title="Customer" action={customer && <Link href={`/admin/users/${String(customer._id)}`} className="text-sm text-muted hover:text-ink">Profile</Link>}>
            <p className="font-medium">{a.fullName}</p>
            <p className="text-sm"><a className="hover:underline" href={`mailto:${o.email}`}>{o.email}</a></p>
            <p className="text-sm"><a className="hover:underline" href={`tel:${a.phone}`}>{a.phone}</a></p>
            {customer?.isBlocked && <Pill tone="bad" className="mt-2">Blocked account</Pill>}
            <address className="mt-4 border-t border-line pt-4 text-sm not-italic leading-relaxed text-muted">
              {a.line1}<br />
              {a.line2 && <>{a.line2}<br /></>}
              {a.city}, {a.state} {a.pincode}
            </address>
          </Card>

          <Card title="Payment">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted">Status</dt><dd><PaymentPill status={o.paymentStatus} /></dd></div>
              {payment && (
                <>
                  <div className="flex justify-between gap-3"><dt className="text-muted">Gateway</dt><dd className="capitalize">{payment.provider}</dd></div>
                  {payment.method && <div className="flex justify-between gap-3"><dt className="text-muted">Method</dt><dd className="uppercase">{payment.method}</dd></div>}
                  {payment.providerPaymentId && <div className="flex justify-between gap-3"><dt className="text-muted">Payment ID</dt><dd className="truncate font-mono text-xs">{payment.providerPaymentId}</dd></div>}
                </>
              )}
              {o.refund?.status && (
                <div className="flex justify-between gap-3 border-t border-line pt-2">
                  <dt className="text-muted">Refund</dt>
                  <dd className="text-right">
                    <Pill tone={o.refund.status === "PROCESSED" ? "good" : o.refund.status === "FAILED" ? "bad" : "warn"}>{o.refund.status.toLowerCase()}</Pill>
                    {o.refund.amount ? <p className="mt-1 tabular-nums">{formatINR(o.refund.amount)}</p> : null}
                    {o.refund.note && <p className="mt-1 text-xs text-muted">{o.refund.note}</p>}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {o.dispatch?.trackingNumber && (
            <Card title="Shipment">
              <p className="text-sm">{o.dispatch.courier} · <span className="font-mono">{o.dispatch.trackingNumber}</span></p>
              {o.dispatch.trackingUrl && <a href={o.dispatch.trackingUrl} target="_blank" rel="noreferrer" className="text-sm text-accent underline">Track parcel</a>}
              {o.dispatch.dispatchedAt && <p className="mt-2 text-xs text-muted">Dispatched {dateTime(o.dispatch.dispatchedAt)}</p>}
              {o.dispatch.deliveredAt && <p className="text-xs text-muted">Delivered {dateTime(o.dispatch.deliveredAt)}</p>}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
