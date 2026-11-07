import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CancelOrderButton } from "@/components/account/cancel-order-button";
import { ReturnRequestForm } from "@/components/account/return-request-form";
import { PageHero } from "@/components/content/page-hero";
import { requireUser } from "@/lib/auth/guards";
import { connectDB } from "@/lib/db/connect";
import { ORDER_STATUS_LABEL, RETURN_REASON_LABEL, type OrderStatus } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import { objectId } from "@/lib/validations";
import { Order } from "@/models";
import { customerCanCancel, customerProgress, stepLabel } from "@/lib/order-flow";
import { getOrderFlow } from "@/services/order-flow.service";
import { getReturnEligibility, getReturnsForOrder } from "@/services/return.service";

export const metadata = { title: "Your order" };

export default async function CustomerOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/profile/orders/${id}`);
  if (!objectId.safeParse(id).success) notFound();
  await connectDB();
  const order = await Order.findOne({ _id: id, user: user.id }).lean();
  if (!order) notFound();

  const status = order.status as OrderStatus;
  const [eligibility, returns, flow] = await Promise.all([getReturnEligibility(user.id, id), getReturnsForOrder(id), getOrderFlow()]);
  // Admin → Orders → Order steps: names, messages, courier stages, cancel rule.
  const steps = customerProgress(flow, order);
  const lastStage = status === "DISPATCHED" ? order.dispatch?.stages?.at(-1) : undefined;
  const stageMsg = lastStage ? flow.shipping.stages.find((x) => x.id === lastStage.id)?.message : undefined;
  const message = lastStage ? lastStage.note || stageMsg : (flow.steps as Record<string, { message: string } | undefined>)[status]?.message;
  const title = lastStage?.label ?? stepLabel(flow, status, ORDER_STATUS_LABEL[status]);
  const history = flow.customer.showHistory ? (order.timeline ?? []).filter((t) => !t.internal) : [];
  const canCancel = customerCanCancel(flow, status, order.paymentStatus);
  const closed = status === "CANCELLED" || status === "RETURNED" || status === "PENDING_PAYMENT";

  return (
    <div>
      <PageHero eyebrow={`Order ${order.orderNumber}`} title={title} lead={`Placed ${order.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · ${formatINR(order.total)}`} />

      <div className="container grid gap-12 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-7">
          {!closed && (
            <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-label="Order progress">
              {steps.map((s) => (
                <li key={s.key} className="space-y-2">
                  <div className={`h-1 rounded-full transition-colors duration-700 ${s.done ? "bg-ink" : "bg-line"}`} />
                  <p className={`text-xs leading-snug ${s.current ? "font-medium text-ink" : s.done ? "text-ink" : "text-muted"}`}>
                    {s.label}
                    {s.current && <span className="sr-only"> (current)</span>}
                  </p>
                </li>
              ))}
            </ol>
          )}
          {message && status !== "PENDING_PAYMENT" && <p className="text-muted">{message}</p>}
          {canCancel && <CancelOrderButton orderId={id} />}

          {order.dispatch?.trackingNumber && (
            <div className="rounded-lg bg-surface p-5">
              <p className="font-medium">{order.dispatch.courier} · {order.dispatch.trackingNumber}</p>
              {order.dispatch.trackingUrl && <a href={order.dispatch.trackingUrl} target="_blank" rel="noreferrer" className="text-accent underline">Track your parcel</a>}
            </div>
          )}

          <ul className="divide-y divide-line border-y border-line">
            {order.items.map((i) => (
              <li key={String(i._id)} className="flex gap-4 py-4">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-surface">
                  {i.imageUrl && <Image src={i.imageUrl} alt="" fill sizes="80px" className="object-cover" />}
                </div>
                <div className="flex-1">
                  <Link href={`/products/${i.productSlug}`} className="font-medium hover:underline">{i.productName}</Link>
                  <p className="text-sm text-muted">{[i.glazeName, i.sizeLabel].filter(Boolean).join(" · ")}{i.qty > 1 ? ` · ×${i.qty}` : ""}</p>
                  {status === "DELIVERED" && <Link href={`/products/${i.productSlug}#reviews`} className="text-sm text-accent underline">Write a review</Link>}
                </div>
                <p className="tabular-nums">{formatINR(i.lineTotal)}</p>
              </li>
            ))}
          </ul>

          <section aria-labelledby="returns-h" className="space-y-4">
            <h2 id="returns-h" className="text-h3">Returns</h2>
            {returns.map((r) => (
              <div key={String(r._id)} className="rounded-lg border border-line p-4 text-sm">
                <p className="font-medium">{RETURN_REASON_LABEL[r.reason as keyof typeof RETURN_REASON_LABEL]} · <span className="capitalize">{r.status.toLowerCase()}</span></p>
                {r.ownerNote && <p className="mt-1 text-muted">From the studio: {r.ownerNote}</p>}
                {r.refundAmount ? <p className="mt-1">Refunded {formatINR(r.refundAmount)}</p> : null}
              </div>
            ))}
            {eligibility.ok ? (
              <ReturnRequestForm
                orderId={id}
                deadline={eligibility.deadline}
                lines={order.items.map((i) => ({ id: String(i._id), name: [i.productName, i.glazeName].filter(Boolean).join(" · "), qty: i.qty }))}
              />
            ) : (
              !returns.length && <p className="text-sm text-muted">{eligibility.reason}</p>
            )}
          </section>
        </div>

        <aside className="space-y-8 lg:col-span-4 lg:col-start-9">
          {history.length > 0 && <div>
            <p className="eyebrow mb-3">History</p>
            <ol className="space-y-4 border-l border-line pl-5">
              {[...history].reverse().map((t, i) => (
                <li key={i} className="relative text-sm">
                  <span className={`absolute -left-[25px] top-1.5 size-2 rounded-full ${i === 0 ? "bg-ink" : "bg-line"}`} aria-hidden />
                  <p className="font-medium">{t.label ?? stepLabel(flow, t.status ?? "", ORDER_STATUS_LABEL[t.status as OrderStatus] ?? t.status ?? "")}</p>
                  {t.note && t.by !== "system" && flow.customer.showNotes && <p className="text-muted">{t.note}</p>}
                  <p className="text-xs text-muted">{new Date(t.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
                </li>
              ))}
            </ol>
          </div>}
          <div>
            <p className="eyebrow mb-3">Delivering to</p>
            <address className="text-sm not-italic leading-relaxed">
              {order.shippingAddress.fullName}<br />
              {order.shippingAddress.line1}<br />
              {order.shippingAddress.line2 && <>{order.shippingAddress.line2}<br /></>}
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
            </address>
          </div>
          <dl className="space-y-1 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatINR(order.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{order.shippingFee ? formatINR(order.shippingFee) : "Free"}</dd></div>
            <div className="flex justify-between font-semibold"><dt>Total</dt><dd>{formatINR(order.total)}</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
