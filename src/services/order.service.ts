import "server-only";
import { randomBytes } from "node:crypto";
import { Types } from "mongoose";
import { connectDB, withTransaction } from "@/lib/db/connect";
import { Cart, Glaze, Order, Setting, Size } from "@/models";
import type { Address } from "@/models";
import { pruneMissingCartItems } from "./cart.service";
import { releaseLines, reserveLine } from "./inventory.service";

export class CheckoutError extends Error {}

function generateOrderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `CG-${ymd}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

async function getStoreSettings() {
  const s = await Setting.findOne({ key: "store" }).lean();
  return {
    shippingFlatFee: s?.shippingFlatFee ?? 0,
    freeShippingThreshold: s?.freeShippingThreshold ?? 0,
    unpaidOrderTtlMinutes: s?.unpaidOrderTtlMinutes ?? 30,
  };
}

function shippingFor(subtotal: number, s: Awaited<ReturnType<typeof getStoreSettings>>) {
  const free = s.freeShippingThreshold > 0 && subtotal >= s.freeShippingThreshold;
  return free ? 0 : s.shippingFlatFee;
}

/** Same rule createOrderFromCart applies, for showing totals before payment. */
export async function quoteTotals(subtotal: number) {
  await connectDB();
  const shippingFee = shippingFor(subtotal, await getStoreSettings());
  return { subtotal, shippingFee, total: subtotal + shippingFee };
}

/**
 * Turn the user's cart into a PENDING_PAYMENT order.
 *
 * Stock for every line is reserved and the order is written in ONE
 * transaction: if any line is short, nothing is decremented. Prices and names
 * are read inside the transaction and copied onto the order as a snapshot.
 */
export async function createOrderFromCart(user: { id: string; email: string }, address: Address) {
  await connectDB();
  const userId = new Types.ObjectId(user.id);

  // Lines for deleted products/options are removed first (they would block checkout forever).
  await pruneMissingCartItems({ user: userId });
  const cart = await Cart.findOne({ user: userId }).lean();
  if (!cart?.items.length) throw new CheckoutError("Your cart is empty.");

  // A user retrying checkout abandons their previous unpaid order.
  const stale = await Order.find({ user: userId, paymentStatus: "PENDING", stockReleased: false }).select("_id").lean();
  for (const o of stale) await cancelUnpaidOrder(String(o._id), "Superseded by a new checkout");

  const settings = await getStoreSettings();

  const order = await withTransaction(async (session) => {
    const items = [];
    for (const line of cart.items) {
      const { product, reserved } = await reserveLine(
        { productId: line.product, variantId: line.variant, qty: line.qty },
        session,
      );
      const v = product.variants[0]!;
      items.push({
        product: product._id,
        variant: v._id,
        productName: product.name,
        productSlug: product.slug,
        productType: product.type,
        availability: product.availability,
        sku: v.sku,
        glazeId: v.glaze as unknown as Types.ObjectId | null,
        sizeId: v.size as unknown as Types.ObjectId | null,
        imageUrl: v.images?.main?.url ?? product.images?.[0]?.url,
        unitPrice: v.price,
        qty: line.qty,
        lineTotal: v.price * line.qty,
        stockReserved: reserved,
      });
    }

    const [glazes, sizes] = await Promise.all([
      Glaze.find({ _id: { $in: items.map((i) => i.glazeId).filter(Boolean) } }, { name: 1 }, { session }).lean(),
      Size.find({ _id: { $in: items.map((i) => i.sizeId).filter(Boolean) } }, { label: 1 }, { session }).lean(),
    ]);
    const glazeName = new Map(glazes.map((g) => [String(g._id), g.name]));
    const sizeLabel = new Map(sizes.map((s) => [String(s._id), s.label]));

    const subtotal = items.reduce((n, i) => n + i.lineTotal, 0);
    const shippingFee = shippingFor(subtotal, settings);

    const [created] = await Order.create(
      [
        {
          orderNumber: generateOrderNumber(),
          user: userId,
          email: user.email,
          items: items.map(({ glazeId, sizeId, ...rest }) => ({
            ...rest,
            glazeName: glazeId ? glazeName.get(String(glazeId)) : undefined,
            sizeLabel: sizeId ? sizeLabel.get(String(sizeId)) : undefined,
          })),
          subtotal,
          shippingFee,
          total: subtotal + shippingFee,
          shippingAddress: address,
          timeline: [{ status: "PENDING_PAYMENT", note: "Order placed", by: "customer" }],
        },
      ],
      { session },
    );
    return created!;
  });

  return order;
}

/**
 * Cancel an unpaid order and return its stock exactly once. The
 * `stockReleased: false` filter makes this safe to call from the webhook,
 * the client failure handler and the expiry sweep concurrently.
 */
export async function cancelUnpaidOrder(orderId: string, reason: string) {
  await connectDB();
  return withTransaction(async (session) => {
    const order = await Order.findOneAndUpdate(
      { _id: orderId, paymentStatus: { $ne: "PAID" }, stockReleased: false },
      { $set: { stockReleased: true, status: "CANCELLED", notes: reason }, $push: { timeline: { status: "CANCELLED", note: reason, by: "system" } } },
      { session, new: true },
    ).lean();
    if (!order) return false;
    await releaseLines(
      order.items.map((i) => ({ productId: i.product, variantId: i.variant, qty: i.qty, stockReserved: i.stockReserved })),
      session,
    );
    return true;
  });
}

/** Run from a cron route: release stock held by checkouts that never paid. */
export async function expireUnpaidOrders() {
  await connectDB();
  const { unpaidOrderTtlMinutes } = await getStoreSettings();
  const cutoff = new Date(Date.now() - unpaidOrderTtlMinutes * 60_000);
  const expired = await Order.find({ paymentStatus: { $in: ["PENDING", "FAILED"] }, stockReleased: false, createdAt: { $lt: cutoff } })
    .select("_id")
    .limit(200)
    .lean();
  let count = 0;
  for (const o of expired) if (await cancelUnpaidOrder(String(o._id), "Payment window expired")) count++;
  return count;
}

export async function getOrdersForUser(userId: string) {
  await connectDB();
  return Order.find({ user: userId }).sort({ createdAt: -1 }).limit(50).lean();
}
