import "server-only";
import { DomainError } from "@/lib/errors";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import type { ReturnStatus, ReviewStatus } from "@/lib/constants";
import { Order, ReturnRequest, Review } from "@/models";
import { recomputeProductRating } from "../review.service";

export class ApprovalError extends DomainError {}

/** Counts for the sidebar badges and the approvals tabs. */
export async function getPendingCounts() {
  await connectDB();
  const [orders, returns, reviews] = await Promise.all([
    Order.countDocuments({ status: "AWAITING_APPROVAL" }),
    ReturnRequest.countDocuments({ status: { $in: ["REQUESTED", "APPROVED", "RECEIVED"] } }),
    Review.countDocuments({ status: "PENDING" }),
  ]);
  return { orders, returns, reviews, total: orders + returns + reviews };
}

export async function listOrdersAwaitingApproval() {
  await connectDB();
  const rows = await Order.find({ status: "AWAITING_APPROVAL" })
    .select("orderNumber email shippingAddress.fullName shippingAddress.city total items createdAt")
    .sort({ createdAt: 1 })
    .lean();
  return rows.map((o) => ({
    id: String(o._id),
    orderNumber: o.orderNumber,
    customer: o.shippingAddress?.fullName ?? o.email,
    city: o.shippingAddress?.city ?? "",
    total: o.total,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((i) => ({ name: i.productName, qty: i.qty, variant: [i.glazeName, i.sizeLabel].filter(Boolean).join(" · "), madeToOrder: i.availability === "MADE_TO_ORDER" })),
  }));
}

/* ───────────── Reviews ───────────── */

export async function listReviews(status: ReviewStatus | "ALL" = "PENDING") {
  await connectDB();
  const rows = await Review.find(status === "ALL" ? {} : { status })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("productId", "name slug")
    .populate("userId", "name email")
    .lean<
      {
        _id: Types.ObjectId; rating: number; text: string; status: ReviewStatus; hideReason?: string; createdAt: Date;
        ownerReply?: { text?: string; repliedAt?: Date };
        productId: { _id: Types.ObjectId; name: string; slug: string } | null;
        userId: { name?: string; email: string } | null;
      }[]
    >();
  return rows.map((r) => ({
    id: String(r._id),
    rating: r.rating,
    text: r.text,
    status: r.status,
    hideReason: r.hideReason ?? "",
    reply: r.ownerReply?.text ?? "",
    createdAt: r.createdAt.toISOString(),
    product: r.productId ? { name: r.productId.name, slug: r.productId.slug } : null,
    author: r.userId?.name || r.userId?.email || "Customer",
  }));
}

export async function decideReview(reviewId: string, decision: ReviewStatus, reason?: string) {
  await connectDB();
  const review = await Review.findByIdAndUpdate(
    reviewId,
    decision === "REJECTED" ? { $set: { status: decision, hideReason: reason } } : { $set: { status: decision }, $unset: { hideReason: 1 } },
    { new: true },
  ).lean();
  if (!review) throw new ApprovalError("Review not found.");
  await recomputeProductRating(String(review.productId));
}

export async function replyToReview(reviewId: string, text: string) {
  await connectDB();
  const res = await Review.updateOne(
    { _id: reviewId },
    text ? { $set: { ownerReply: { text, repliedAt: new Date() } } } : { $unset: { ownerReply: 1 } },
  );
  if (res.matchedCount === 0) throw new ApprovalError("Review not found.");
}

/* ───────────── Returns ───────────── */

/** Allowed return moves: requested → approved/rejected → received → refunded. */
const RETURN_FLOW: Record<ReturnStatus, ReturnStatus[]> = {
  REQUESTED: ["APPROVED", "REJECTED"],
  APPROVED: ["RECEIVED", "REFUNDED", "REJECTED"],
  RECEIVED: ["REFUNDED"],
  REJECTED: [],
  REFUNDED: [],
};

export function nextReturnStatuses(s: ReturnStatus) {
  return RETURN_FLOW[s];
}

export async function listReturns(status: "OPEN" | "ALL" = "OPEN") {
  await connectDB();
  const rows = await ReturnRequest.find(status === "OPEN" ? { status: { $in: ["REQUESTED", "APPROVED", "RECEIVED"] } } : {})
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  const orders = await Order.find({ _id: { $in: rows.map((r) => r.order) } }).select("orderNumber email shippingAddress.fullName items total").lean();
  const byId = new Map(orders.map((o) => [String(o._id), o]));

  return rows.map((r) => {
    const o = byId.get(String(r.order));
    const items = r.items.map((ri) => {
      const line = o?.items.find((i) => String(i._id) === String(ri.orderItem));
      return { name: line?.productName ?? "Item", qty: ri.qty, unitPrice: line?.unitPrice ?? 0 };
    });
    return {
      id: String(r._id),
      orderId: String(r.order),
      orderNumber: o?.orderNumber ?? "",
      customer: o?.shippingAddress?.fullName ?? o?.email ?? "",
      reason: r.reason,
      details: r.details ?? "",
      status: r.status as ReturnStatus,
      ownerNote: r.ownerNote ?? "",
      refundAmount: r.refundAmount ?? null,
      suggestedRefund: items.reduce((n, i) => n + i.unitPrice * i.qty, 0),
      items,
      photos: (r.photos ?? []).map((p) => p.url),
      createdAt: (r.createdAt ?? new Date()).toISOString(),
    };
  });
}

export async function decideReturn(returnId: string, status: ReturnStatus, ownerNote?: string, refundRupees?: number) {
  await connectDB();
  const current = await ReturnRequest.findById(returnId).lean();
  if (!current) throw new ApprovalError("Return request not found.");
  if (!RETURN_FLOW[current.status as ReturnStatus].includes(status)) {
    throw new ApprovalError(`A ${current.status.toLowerCase()} return can't be marked ${status.toLowerCase()}.`);
  }
  const set: Record<string, unknown> = { status };
  if (ownerNote) set.ownerNote = ownerNote;
  if (status === "REFUNDED") {
    if (refundRupees === undefined || refundRupees <= 0) throw new ApprovalError("Enter the refund amount.");
    set.refundAmount = Math.round(refundRupees * 100);
  }
  const res = await ReturnRequest.updateOne({ _id: returnId, status: current.status }, { $set: set });
  if (res.modifiedCount === 0) throw new ApprovalError("This return was changed by someone else. Refresh and try again.");

  if (status === "REFUNDED") {
    const order = await Order.findById(current.order).select("total").lean();
    const full = order && Math.round((refundRupees ?? 0) * 100) >= order.total;
    await Order.updateOne(
      { _id: current.order },
      {
        $set: { paymentStatus: full ? "REFUNDED" : "PARTIALLY_REFUNDED", ...(full ? { status: "RETURNED" } : {}) },
        $push: { timeline: { status: full ? "RETURNED" : "DELIVERED", note: `Return refunded (${(refundRupees ?? 0).toFixed(2)} INR). Issue it in the Razorpay dashboard if not done.`, by: "owner" } },
      },
    );
  }
}

