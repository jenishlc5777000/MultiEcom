"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { useState, useTransition } from "react";
import { orderActionAction } from "@/actions/admin/order.actions";
import { returnDecisionAction, reviewDecisionAction, reviewReplyAction } from "@/actions/admin/people.actions";
import { Button } from "@/components/ui/button";
import { RETURN_REASON_LABEL, type ReturnStatus, type ReviewStatus } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import type { ActionResult } from "@/types/dto";
import { Field, TextArea, TextInput } from "./form";
import { Pill, ReturnStatusPill, ReviewStatusPill, dateTime } from "./ui";

function useAct() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const act = (fn: () => Promise<ActionResult<unknown>>, ok: string) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) return setError(res.error);
      setDone(ok);
      router.refresh();
    });
  return { pending, error, done, act };
}

const card = "rounded-lg border border-line bg-paper/60 p-5 transition-opacity";

/* ───────────── Orders awaiting approval ───────────── */

type PendingOrder = {
  id: string; orderNumber: string; customer: string; city: string; total: number; createdAt: string;
  items: { name: string; qty: number; variant: string; madeToOrder: boolean }[];
};

export function OrderApprovalCard({ order }: { order: PendingOrder }) {
  const { pending, error, done, act } = useAct();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  if (done) return <p className={`${card} text-sm text-ready`} role="status">{order.orderNumber}: {done}</p>;

  return (
    <article className={card} aria-busy={pending}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/admin/orders/${order.id}`} className="font-medium hover:underline">{order.orderNumber}</Link>
          <p className="text-sm text-muted">{order.customer}{order.city ? ` · ${order.city}` : ""} · {dateTime(order.createdAt)}</p>
        </div>
        <p className="text-lg font-semibold tabular-nums">{formatINR(order.total)}</p>
      </div>
      <ul className="mt-3 space-y-1 text-sm">
        {order.items.map((i, k) => (
          <li key={k} className="flex flex-wrap items-center gap-2">
            <span>{i.qty} × {i.name}</span>
            {i.variant && <span className="text-muted">· {i.variant}</span>}
            {i.madeToOrder && <Pill tone="warn">Made to order</Pill>}
          </li>
        ))}
      </ul>

      {rejecting ? (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            act(() => orderActionAction(order.id, { action: "reject", reason }), "rejected and refund started.");
          }}
        >
          <Field label="Reason for the customer" htmlFor={`rr-${order.id}`}>
            <TextArea id={`rr-${order.id}`} required minLength={3} className="min-h-16" value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <div className="flex gap-2">
            <Button size="sm" variant="accent" type="submit" disabled={pending}>Reject &amp; refund</Button>
            <Button size="sm" variant="quiet" type="button" onClick={() => setRejecting(false)}>Back</Button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" disabled={pending} onClick={() => act(() => orderActionAction(order.id, { action: "approve" }), "approved.")}>Approve</Button>
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => setRejecting(true)}>Reject</Button>
          <Button size="sm" variant="quiet" asChild><Link href={`/admin/orders/${order.id}`}>Details</Link></Button>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    </article>
  );
}

/* ───────────── Reviews ───────────── */

type ReviewItem = { id: string; rating: number; text: string; status: ReviewStatus; hideReason: string; reply: string; createdAt: string; product: { name: string; slug: string } | null; author: string };

export function ReviewCard({ review }: { review: ReviewItem }) {
  const { pending, error, done, act } = useAct();
  const [reply, setReply] = useState(review.reply);
  const [reason, setReason] = useState(review.hideReason);

  return (
    <article className={card} aria-busy={pending}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1" aria-label={`${review.rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className={`size-4 ${i <= review.rating ? "fill-ink text-ink" : "text-line"}`} aria-hidden />
            ))}
            <span className="ml-1 text-sm font-medium">{review.rating}/5</span>
          </p>
          <p className="mt-1 text-sm text-muted">
            {review.author} on {review.product ? <Link className="underline-offset-4 hover:underline" href={`/products/${review.product.slug}`} target="_blank">{review.product.name}</Link> : "a deleted product"} · {dateTime(review.createdAt)}
          </p>
        </div>
        <ReviewStatusPill status={review.status} />
      </div>
      <p className="mt-3 whitespace-pre-line text-[15px]">{review.text || <span className="text-muted">No written review, just a rating.</span>}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Field label="Public reply (optional)" htmlFor={`rp-${review.id}`}>
          <TextArea id={`rp-${review.id}`} className="min-h-16" value={reply} onChange={(e) => setReply(e.target.value)} />
        </Field>
        <Field label="Rejection note (internal)" htmlFor={`rn-${review.id}`}>
          <TextInput id={`rn-${review.id}`} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {review.status !== "APPROVED" && (
          <Button size="sm" disabled={pending} onClick={() => act(() => reviewDecisionAction({ reviewId: review.id, decision: "APPROVED" }), "Approved. It's live on the product page.")}>Approve</Button>
        )}
        {review.status !== "REJECTED" && (
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => act(() => reviewDecisionAction({ reviewId: review.id, decision: "REJECTED", reason }), "Rejected. It stays hidden.")}>
            {review.status === "APPROVED" ? "Hide" : "Reject"}
          </Button>
        )}
        <Button size="sm" variant="quiet" disabled={pending || reply === review.reply} onClick={() => act(() => reviewReplyAction({ reviewId: review.id, text: reply }), "Reply saved.")}>Save reply</Button>
      </div>
      {(error || done) && <p role={error ? "alert" : "status"} className={`mt-2 text-sm ${error ? "text-danger" : "text-ready"}`}>{error ?? done}</p>}
    </article>
  );
}

/* ───────────── Returns ───────────── */

type ReturnItem = {
  id: string; orderId: string; orderNumber: string; customer: string; reason: keyof typeof RETURN_REASON_LABEL; details: string; status: ReturnStatus;
  ownerNote: string; refundAmount: number | null; suggestedRefund: number; items: { name: string; qty: number; unitPrice: number }[]; photos: string[]; createdAt: string;
};

const NEXT_LABEL: Record<ReturnStatus, string> = { APPROVED: "Approve return", REJECTED: "Reject", RECEIVED: "Mark item received", REFUNDED: "Mark refunded", REQUESTED: "" };

export function ReturnCard({ item, next }: { item: ReturnItem; next: ReturnStatus[] }) {
  const { pending, error, done, act } = useAct();
  const [note, setNote] = useState(item.ownerNote);
  const [refund, setRefund] = useState(String((item.refundAmount ?? item.suggestedRefund) / 100));

  return (
    <article className={card} aria-busy={pending}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">
            <Link href={`/admin/orders/${item.orderId}`} className="hover:underline">{item.orderNumber}</Link>
            <span className="font-normal text-muted"> · {item.customer}</span>
          </p>
          <p className="text-sm text-muted">{RETURN_REASON_LABEL[item.reason]} · {dateTime(item.createdAt)}</p>
        </div>
        <ReturnStatusPill status={item.status} />
      </div>
      <ul className="mt-3 space-y-1 text-sm">
        {item.items.map((i, k) => <li key={k}>{i.qty} × {i.name} <span className="text-muted">({formatINR(i.unitPrice)} each)</span></li>)}
      </ul>
      {item.details && <p className="mt-3 whitespace-pre-line rounded-md bg-surface/60 p-3 text-sm">{item.details}</p>}

      {next.length > 0 && (
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px]">
          <Field label="Note to the customer" htmlFor={`rn-${item.id}`}>
            <TextInput id={`rn-${item.id}`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Please ship it back to…" />
          </Field>
          {next.includes("REFUNDED") && (
            <Field label="Refund amount (₹)" htmlFor={`ra-${item.id}`} hint="Issue it in Razorpay first.">
              <TextInput id={`ra-${item.id}`} type="number" min={0} step="0.01" value={refund} onChange={(e) => setRefund(e.target.value)} />
            </Field>
          )}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {next.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={s === "REJECTED" ? "secondary" : "primary"}
            disabled={pending}
            onClick={() => act(() => returnDecisionAction({ returnId: item.id, status: s, ownerNote: note, refundAmount: s === "REFUNDED" ? refund : undefined }), `Return ${s.toLowerCase()}.`)}
          >
            {NEXT_LABEL[s]}
          </Button>
        ))}
        {next.length === 0 && <p className="text-sm text-muted">Closed{item.refundAmount ? ` · refunded ${formatINR(item.refundAmount)}` : ""}.</p>}
      </div>
      {(error || done) && <p role={error ? "alert" : "status"} className={`mt-2 text-sm ${error ? "text-danger" : "text-ready"}`}>{error ?? done}</p>}
    </article>
  );
}
