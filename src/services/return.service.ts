import "server-only";
import { DomainError } from "@/lib/errors";
import { connectDB } from "@/lib/db/connect";
import type { RETURN_REASONS } from "@/lib/constants";
import { Order, ReturnRequest } from "@/models";
import { getStoreInfo } from "./store.service";

export class ReturnError extends DomainError {}

/** Delivered orders can be returned within the store's return window, one open request at a time. */
export async function getReturnEligibility(userId: string, orderId: string) {
  await connectDB();
  const order = await Order.findOne({ _id: orderId, user: userId }).select("status dispatch items").lean();
  if (!order) return { ok: false as const, reason: "Order not found." };
  if (order.status !== "DELIVERED") return { ok: false as const, reason: "Returns open once your order is delivered." };

  const { returnWindowDays } = await getStoreInfo();
  const deliveredAt = order.dispatch?.deliveredAt ?? null;
  const deadline = deliveredAt ? new Date(deliveredAt.getTime() + returnWindowDays * 86_400_000) : null;
  if (deadline && deadline < new Date()) return { ok: false as const, reason: `The ${returnWindowDays}-day return window has closed.` };

  const existing = await ReturnRequest.findOne({ order: orderId }).select("status").sort({ createdAt: -1 }).lean();
  if (existing && existing.status !== "REJECTED") return { ok: false as const, reason: "A return request for this order is already open.", existing: existing.status };
  return { ok: true as const, deadline: deadline?.toISOString() ?? null };
}

export async function createReturnRequest(
  userId: string,
  input: { orderId: string; items: { orderItem: string; qty: number }[]; reason: (typeof RETURN_REASONS)[number]; details: string },
) {
  const eligibility = await getReturnEligibility(userId, input.orderId);
  if (!eligibility.ok) throw new ReturnError(eligibility.reason);

  const order = await Order.findById(input.orderId).select("items").lean();
  for (const it of input.items) {
    const line = order?.items.find((i) => String(i._id) === it.orderItem);
    if (!line || it.qty < 1 || it.qty > line.qty) throw new ReturnError("Check the items and quantities you selected.");
  }
  await ReturnRequest.create({ order: input.orderId, user: userId, items: input.items, reason: input.reason, details: input.details });
}

export async function getReturnsForOrder(orderId: string) {
  await connectDB();
  return ReturnRequest.find({ order: orderId }).sort({ createdAt: -1 }).lean();
}
