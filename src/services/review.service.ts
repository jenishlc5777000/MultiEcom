import "server-only";
import { DomainError } from "@/lib/errors";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { Order, Product, Review } from "@/models";

export class ReviewError extends DomainError {}

/** Only approved reviews count towards the public rating. */
export async function recomputeProductRating(productId: string) {
  const [agg] = await Review.aggregate<{ avg: number; n: number }>([
    { $match: { productId: new Types.ObjectId(productId), status: "APPROVED" } },
    { $group: { _id: null, avg: { $avg: "$rating" }, n: { $sum: 1 } } },
  ]);
  await Product.updateOne({ _id: productId }, { $set: { ratingAvg: agg ? Math.round(agg.avg * 10) / 10 : 0, ratingCount: agg?.n ?? 0 } });
}

export async function getApprovedReviews(productId: string) {
  await connectDB();
  const rows = await Review.find({ productId, status: "APPROVED" })
    .sort({ createdAt: -1 })
    .limit(30)
    .populate("userId", "name")
    .lean<{ _id: Types.ObjectId; rating: number; text: string; createdAt: Date; ownerReply?: { text?: string }; userId: { name?: string } | null }[]>();
  return rows.map((r) => ({
    id: String(r._id),
    rating: r.rating,
    text: r.text,
    createdAt: r.createdAt.toISOString(),
    author: r.userId?.name?.split(" ")[0] || "Verified buyer",
    reply: r.ownerReply?.text ?? "",
  }));
}

/**
 * A user may review a product once per delivered order that contains it.
 * Returns the order to attach the review to, or why they can't review yet.
 */
export async function getReviewEligibility(userId: string, productId: string) {
  await connectDB();
  const orders = await Order.find({ user: userId, status: { $in: ["DELIVERED", "RETURNED"] }, "items.product": productId })
    .select("_id")
    .sort({ createdAt: -1 })
    .lean();
  if (!orders.length) return { canReview: false as const, reason: "not_purchased" as const };
  const reviewed = await Review.find({ userId, productId }).select("orderId status").lean();
  const done = new Set(reviewed.map((r) => String(r.orderId)));
  const open = orders.find((o) => !done.has(String(o._id)));
  if (!open) return { canReview: false as const, reason: reviewed.some((r) => r.status === "PENDING") ? ("pending" as const) : ("reviewed" as const) };
  return { canReview: true as const, orderId: String(open._id) };
}

export async function createReview(userId: string, input: { productId: string; orderId: string; rating: number; text: string }) {
  const eligibility = await getReviewEligibility(userId, input.productId);
  if (!eligibility.canReview || eligibility.orderId !== input.orderId) throw new ReviewError("You can review a piece once it has been delivered to you.");
  try {
    await Review.create({ productId: input.productId, userId, orderId: input.orderId, rating: input.rating, text: input.text, status: "PENDING" });
  } catch {
    throw new ReviewError("You've already reviewed this piece for that order.");
  }
}
