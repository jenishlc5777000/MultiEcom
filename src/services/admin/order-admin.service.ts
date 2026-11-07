import "server-only";
import { DomainError } from "@/lib/errors";
import { Types } from "mongoose";
import { connectDB, withTransaction } from "@/lib/db/connect";
import type { OrderStatus } from "@/lib/constants";
import { sendOrderStatusEmail } from "@/lib/email";
import { sendOrderStatusSms } from "@/lib/sms";
import { getPaymentProvider } from "@/lib/payments";
import type { OrderActionInput } from "@/lib/validations/admin";
import { Order, Payment, User } from "@/models";
import { customerCanCancel, trackingLink, type OrderFlow } from "@/lib/order-flow";
import { releaseLines } from "../inventory.service";
import { getOrderFlow } from "../order-flow.service";

export class OrderActionError extends DomainError {}

/** Which statuses each owner action may start from. Anything else is refused. */
const ALLOWED: Record<OrderActionInput["action"], OrderStatus[]> = {
  approve: ["AWAITING_APPROVAL"],
  reject: ["AWAITING_APPROVAL"],
  start_production: ["CONFIRMED"],
  dispatch: ["CONFIRMED", "IN_PRODUCTION"],
  ship_stage: ["DISPATCHED"],
  deliver: ["DISPATCHED"],
  cancel: ["PENDING_PAYMENT", "AWAITING_APPROVAL", "CONFIRMED", "IN_PRODUCTION"],
  note: ["PENDING_PAYMENT", "AWAITING_APPROVAL", "CONFIRMED", "IN_PRODUCTION", "DISPATCHED", "DELIVERED", "CANCELLED", "RETURNED"],
};

export function allowedActions(status: OrderStatus, flow?: OrderFlow) {
  return (Object.keys(ALLOWED) as OrderActionInput["action"][]).filter(
    (a) => a !== "note" && a !== "ship_stage" && ALLOWED[a].includes(status) && !(a === "start_production" && flow?.production.show === "never"),
  );
}

const PAGE_SIZE = 25;

export type OrderFilters = { status?: string; q?: string; page?: number };

export async function listOrders({ status, q, page = 1 }: OrderFilters) {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (status && status !== "ALL") filter.status = status;
  else filter.status = { $ne: "PENDING_PAYMENT" }; // abandoned checkouts are noise by default
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ orderNumber: rx }, { email: rx }, { "shippingAddress.fullName": rx }, { "shippingAddress.phone": rx }];
  }
  const [rows, total, counts] = await Promise.all([
    Order.find(filter)
      .select("orderNumber email shippingAddress.fullName total status paymentStatus createdAt items.qty")
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Order.countDocuments(filter),
    Order.aggregate<{ _id: OrderStatus; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);
  return {
    orders: rows.map((o) => ({
      id: String(o._id),
      orderNumber: o.orderNumber,
      customer: o.shippingAddress?.fullName ?? o.email,
      email: o.email,
      itemCount: o.items.reduce((n, i) => n + i.qty, 0),
      total: o.total,
      status: o.status as OrderStatus,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt.toISOString(),
    })),
    total,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    counts: Object.fromEntries(counts.map((c) => [c._id, c.n])) as Partial<Record<OrderStatus, number>>,
  };
}

export async function getOrderDetail(id: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(id)) return null;
  const o = await Order.findById(id).lean();
  if (!o) return null;
  const [customer, payment] = await Promise.all([
    User.findById(o.user).select("name email phone createdAt isBlocked").lean(),
    o.payment ? Payment.findById(o.payment).select("provider providerOrderId providerPaymentId method status amount").lean() : null,
  ]);
  return { order: o, customer, payment };
}

/**
 * Apply one owner action. The status filter in each update makes concurrent
 * clicks safe: only the first matching update wins, the rest get "already changed".
 */
export async function applyOrderAction(orderId: string, input: OrderActionInput, ownerId: string | null, by: "owner" | "customer" = "owner") {
  await connectDB();
  const order = await Order.findById(orderId).lean();
  if (!order) throw new OrderActionError("Order not found.");
  const from = order.status as OrderStatus;
  if (!ALLOWED[input.action].includes(from)) {
    throw new OrderActionError(`Can't ${input.action.replace("_", " ")} an order that is ${from.toLowerCase().replace("_", " ")}.`);
  }

  const owner = ownerId ? new Types.ObjectId(ownerId) : undefined;
  const flow = await getOrderFlow();
  let stageNotice: { label: string; message: string } | undefined;
  const stamp = (status: OrderStatus, note?: string) => ({ status, note, by, at: new Date() });

  switch (input.action) {
    case "note":
      await Order.updateOne({ _id: orderId }, { $push: { timeline: { ...stamp(from, input.note), internal: true } } });
      return;

    case "approve":
      await transition(orderId, from, "CONFIRMED", {
        $set: { approval: { decision: "APPROVED", decidedAt: new Date(), decidedBy: owner } },
        $push: { timeline: stamp("CONFIRMED", input.note ?? "Order approved") },
      });
      break;

    case "start_production":
      await transition(orderId, from, "IN_PRODUCTION", { $push: { timeline: stamp("IN_PRODUCTION", input.note ?? "Production started") } });
      break;

    case "dispatch": {
      const known = flow.shipping.couriers.some((c) => c.name.toLowerCase() === input.courier.toLowerCase());
      if (!known && !flow.shipping.allowOther) throw new OrderActionError("Choose one of your couriers (Orders → Order steps).");
      const trackingUrl = input.trackingUrl || trackingLink(flow, input.courier, input.trackingNumber) || undefined;
      await transition(orderId, from, "DISPATCHED", {
        $set: {
          dispatch: { courier: input.courier, trackingNumber: input.trackingNumber, trackingUrl, dispatchedAt: new Date(), stages: [] },
        },
        $push: { timeline: stamp("DISPATCHED", `${input.courier} · ${input.trackingNumber}`) },
      });
      break;
    }

    case "ship_stage": {
      const stage = flow.shipping.stages.find((x) => x.id === input.stageId);
      if (!stage) throw new OrderActionError("That shipping step no longer exists. Refresh and try again.");
      if (order.dispatch?.stages?.some((x) => x.id === stage.id)) throw new OrderActionError(`“${stage.label}” is already marked.`);
      const res = await Order.updateOne(
        { _id: orderId, status: "DISPATCHED", "dispatch.stages.id": { $ne: stage.id } },
        {
          $push: {
            "dispatch.stages": { id: stage.id, label: stage.label, note: input.note, at: new Date() },
            timeline: { ...stamp("DISPATCHED", input.note), label: stage.label },
          },
        },
      );
      if (res.modifiedCount === 0) throw new OrderActionError("This order was changed by someone else. Refresh and try again.");
      stageNotice = { label: stage.label, message: input.note || stage.message };
      break;
    }

    case "deliver":
      await transition(orderId, from, "DELIVERED", {
        $set: { "dispatch.deliveredAt": new Date() },
        $push: { timeline: stamp("DELIVERED", "Marked as delivered") },
      });
      break;

    case "reject":
    case "cancel": {
      const reason = input.reason;
      await withTransaction(async (session) => {
        const updated = await Order.findOneAndUpdate(
          { _id: orderId, status: from },
          {
            $set: {
              status: "CANCELLED",
              notes: reason,
              ...(input.action === "reject" ? { approval: { decision: "REJECTED", reason, decidedAt: new Date(), decidedBy: owner } } : {}),
            },
            $push: { timeline: stamp("CANCELLED", input.action === "reject" ? `Rejected: ${reason}` : `Cancelled: ${reason}`) },
          },
          { session, new: true },
        ).lean();
        if (!updated) throw new OrderActionError("This order was changed by someone else. Refresh and try again.");
        if (!updated.stockReleased) {
          await releaseLines(
            updated.items.map((i) => ({ productId: i.product, variantId: i.variant, qty: i.qty, stockReserved: i.stockReserved })),
            session,
          );
          await Order.updateOne({ _id: orderId }, { $set: { stockReleased: true } }, { session });
        }
      });
      if (order.paymentStatus === "PAID") await refundOrder(orderId);
      break;
    }
  }

  await notifyCustomer(orderId, flow, stageNotice, input.action === "cancel" ? input.reason : undefined);
}

/**
 * Email / SMS the customer about the order's new step, using the names and
 * messages from Orders → Order steps (and its "notify" switches).
 */
export async function notifyCustomer(orderId: string, flow: OrderFlow, stage?: { label: string; message: string }, cancelReason?: string) {
  const fresh = await Order.findById(orderId).select("email orderNumber status dispatch approval notes shippingAddress.phone").lean();
  const step = fresh && (flow.steps as Record<string, { label: string; message: string; notify: boolean } | undefined>)[fresh.status];
  const send = stage ? flow.shipping.notifyStages : (step?.notify ?? true);
  if (fresh && send) {
    sendOrderStatusEmail(fresh.email, {
      orderNumber: fresh.orderNumber,
      status: fresh.status as OrderStatus,
      note: (fresh.approval?.decision === "REJECTED" ? fresh.approval.reason : undefined) ?? cancelReason,
      label: stage?.label ?? step?.label,
      message: stage?.message ?? step?.message,
      trackingUrl: fresh.dispatch?.trackingUrl ?? undefined,
      trackingNumber: fresh.dispatch?.trackingNumber ?? undefined,
      courier: fresh.dispatch?.courier ?? undefined,
    }).catch((e) => console.error("[email] order status", e));
    if (fresh.shippingAddress?.phone) {
      sendOrderStatusSms(fresh.shippingAddress.phone, fresh.orderNumber, fresh.status, fresh.dispatch?.trackingUrl ?? undefined, stage?.label).catch((e) =>
        console.error("[sms] order status", e),
      );
    }
  }
}

async function transition(orderId: string, from: OrderStatus, to: OrderStatus, update: Record<string, unknown>) {
  const set = (update.$set as Record<string, unknown> | undefined) ?? {};
  const res = await Order.updateOne({ _id: orderId, status: from }, { ...update, $set: { ...set, status: to } });
  if (res.modifiedCount === 0) throw new OrderActionError("This order was changed by someone else. Refresh and try again.");
}

/**
 * Refund through the payment gateway. If the gateway isn't configured (local
 * dev) or the call fails, the refund is recorded as PENDING/FAILED so the
 * owner can see it still needs doing. It is never silently marked as refunded.
 */
async function refundOrder(orderId: string) {
  const order = await Order.findById(orderId).select("total payment").lean();
  if (!order) return;
  const payment = order.payment ? await Payment.findById(order.payment).lean() : null;

  if (!payment?.providerPaymentId) {
    await Order.updateOne({ _id: orderId }, { $set: { refund: { status: "PENDING", amount: order.total, note: "No captured payment on record. Refund manually.", at: new Date() } } });
    return;
  }
  try {
    const { refundId } = await (await getPaymentProvider()).refund(payment.providerPaymentId, order.total);
    await Promise.all([
      Order.updateOne({ _id: orderId }, { $set: { paymentStatus: "REFUNDED", refund: { status: "PROCESSED", amount: order.total, providerRefundId: refundId, at: new Date() } } }),
      Payment.updateOne({ _id: payment._id }, { $set: { status: "REFUNDED" }, $push: { events: { name: "refund" } } }),
    ]);
  } catch (e) {
    console.error("[refund]", e);
    await Order.updateOne(
      { _id: orderId },
      { $set: { refund: { status: "FAILED", amount: order.total, note: e instanceof Error ? e.message : "Refund failed", at: new Date() } } },
    );
  }
}

/** Customer cancels their own paid order, when Orders → Order steps allows it. Stock goes back and the payment is refunded. */
export async function cancelOrderByCustomer(orderId: string, userId: string, reason: string) {
  await connectDB();
  const order = await Order.findOne({ _id: orderId, user: userId }).select("status paymentStatus").lean();
  if (!order) throw new OrderActionError("Order not found.");
  const flow = await getOrderFlow();
  if (!customerCanCancel(flow, order.status, order.paymentStatus)) throw new OrderActionError("This order can't be cancelled any more. Please contact us.");
  await applyOrderAction(orderId, { action: "cancel", reason }, null, "customer");
}

/** Owner marks a pending/failed refund as done after refunding outside the gateway. */
export async function markRefundProcessed(orderId: string) {
  await connectDB();
  const res = await Order.updateOne(
    { _id: orderId, "refund.status": { $in: ["PENDING", "FAILED"] } },
    { $set: { paymentStatus: "REFUNDED", "refund.status": "PROCESSED", "refund.at": new Date(), "refund.note": "Marked refunded by owner" } },
  );
  if (res.modifiedCount === 0) throw new OrderActionError("There's no pending refund on this order.");
}
