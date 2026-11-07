import "server-only";
import { connectDB } from "@/lib/db/connect";
import { getPaymentProvider, type ClientCheckoutConfig, type PaymentEvent } from "@/lib/payments";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { Order, Payment } from "@/models";
import { clearCartForUser } from "./cart.service";
import { cancelUnpaidOrder } from "./order.service";

type OrderForPayment = { _id: unknown; orderNumber: string; total: number; user: unknown };

/** Open a gateway order for a freshly created PENDING_PAYMENT order. */
export async function startPayment(order: OrderForPayment): Promise<ClientCheckoutConfig> {
  await connectDB();
  const provider = await getPaymentProvider();
  try {
    const gatewayOrder = await provider.createOrder({
      amount: order.total,
      currency: "INR",
      receipt: order.orderNumber,
      notes: { orderId: String(order._id) },
    });
    const payment = await Payment.create({
      order: order._id,
      user: order.user,
      provider: provider.name,
      providerOrderId: gatewayOrder.providerOrderId,
      amount: gatewayOrder.amount,
      events: [{ name: "created" }],
    });
    await Order.updateOne({ _id: order._id }, { $set: { payment: payment._id } });
    return provider.clientConfig(gatewayOrder);
  } catch (err) {
    await cancelUnpaidOrder(String(order._id), "Payment gateway error");
    throw err;
  }
}

/**
 * Mark a payment captured. Idempotent: the browser callback and the webhook
 * both call this, and only the first one does the work.
 */
export async function markPaymentCaptured(input: {
  providerOrderId: string;
  providerPaymentId: string;
  amount?: number;
  method?: string;
}) {
  await connectDB();
  const provider = await getPaymentProvider();

  const payment = await Payment.findOneAndUpdate(
    { provider: provider.name, providerOrderId: input.providerOrderId, status: { $ne: "CAPTURED" } },
    {
      $set: { status: "CAPTURED", providerPaymentId: input.providerPaymentId, method: input.method },
      $push: { events: { name: "captured" } },
    },
    { new: true },
  );
  if (!payment) return { alreadyProcessed: true };

  if (input.amount !== undefined && input.amount !== payment.amount) {
    await Order.updateOne({ _id: payment.order }, { $set: { notes: "Amount mismatch: review before dispatch" } });
  }

  const order = await Order.findOneAndUpdate(
    { _id: payment.order },
    {
      $set: { paymentStatus: "PAID", status: "AWAITING_APPROVAL" },
      $push: { timeline: { status: "AWAITING_APPROVAL", note: "Payment received", by: "system" } },
    },
    { new: true },
  ).lean();
  if (!order) return { alreadyProcessed: false };

  if (order.stockReleased) {
    // Paid after the reservation expired. Flag for the owner (re-make or refund).
    await Order.updateOne({ _id: order._id }, { $set: { notes: "Paid after stock was released: confirm availability" } });
  }

  await clearCartForUser(String(order.user));
  sendOrderConfirmationEmail(order.email, order).catch((e) => console.error("[email] order confirmation", e));
  return { alreadyProcessed: false, orderId: String(order._id) };
}

export async function markPaymentFailed(providerOrderId: string, reason?: string) {
  await connectDB();
  const payment = await Payment.findOneAndUpdate(
    { provider: (await getPaymentProvider()).name, providerOrderId, status: "CREATED" },
    { $set: { status: "FAILED", failureReason: reason }, $push: { events: { name: "failed" } } },
    { new: true },
  );
  if (!payment) return;
  await Order.updateOne({ _id: payment.order, paymentStatus: "PENDING" }, { $set: { paymentStatus: "FAILED" } });
  // Stock stays reserved so the shopper can retry; the expiry sweep releases it.
}

export async function handlePaymentEvent(event: PaymentEvent) {
  switch (event.type) {
    case "payment.captured":
      return markPaymentCaptured(event);
    case "payment.failed":
      return markPaymentFailed(event.providerOrderId, event.reason);
    case "refund.processed":
      await connectDB();
      await Payment.updateOne({ providerPaymentId: event.providerPaymentId }, { $push: { events: { name: "refund" } } });
      return;
    default:
      return;
  }
}
