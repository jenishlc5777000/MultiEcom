import "server-only";
import type { ClientSession, Types } from "mongoose";
import { Product } from "@/models";
import type { LeanProduct } from "./mappers";

export class OutOfStockError extends Error {
  constructor(public readonly productName: string) {
    super(`"${productName}" doesn't have enough stock left.`);
  }
}

export class UnavailableError extends Error {
  constructor() {
    super("An item in your cart is no longer available.");
  }
}

type Line = { productId: Types.ObjectId | string; variantId: Types.ObjectId | string; qty: number };

/**
 * Reserve one cart line inside a transaction.
 *
 * Ready-stock lines use a single conditional update: the filter requires
 * `stock >= qty` on that exact variant and `$inc` decrements it, so two buyers
 * can never both take the last piece. Made-to-order lines are not stock-limited.
 *
 * Returns the product (with only the matched variant) for the order snapshot.
 */
export async function reserveLine(line: Line, session: ClientSession) {
  const base = { _id: line.productId, status: "ACTIVE", availability: { $ne: "SOLD" } };

  const mto = await Product.findOne(
    { ...base, availability: "MADE_TO_ORDER", "variants._id": line.variantId },
    { name: 1, slug: 1, type: 1, availability: 1, images: 1, "variants.$": 1 },
    { session },
  ).lean<LeanProduct>();
  if (mto) return { product: mto, reserved: false };

  const updated = await Product.findOneAndUpdate(
    {
      ...base,
      variants: { $elemMatch: { _id: line.variantId, isActive: { $ne: false }, stock: { $gte: line.qty } } },
    },
    { $inc: { "variants.$.stock": -line.qty } },
    { session, new: true, projection: { name: 1, slug: 1, type: 1, availability: 1, isUnique: 1, images: 1, variants: 1 } },
  ).lean<LeanProduct>();

  if (!updated) {
    const exists = await Product.exists({ ...base, "variants._id": line.variantId }).session(session);
    if (!exists) throw new UnavailableError();
    const p = await Product.findById(line.productId, { name: 1 }, { session }).lean();
    throw new OutOfStockError(p?.name ?? "An item");
  }

  // One-of-a-kind pieces flip to SOLD the moment their last unit is reserved.
  if (updated.isUnique && updated.variants.every((v) => v.stock <= 0)) {
    await Product.updateOne({ _id: updated._id }, { $set: { availability: "SOLD" } }, { session });
  }

  const variant = updated.variants.find((v) => String(v._id) === String(line.variantId))!;
  return { product: { ...updated, variants: [variant] }, reserved: true };
}

/** Put reserved stock back (failed / expired / cancelled orders). */
export async function releaseLines(lines: (Line & { stockReserved?: boolean | null })[], session: ClientSession) {
  for (const line of lines) {
    if (line.stockReserved === false) continue;
    await Product.updateOne(
      { _id: line.productId, "variants._id": line.variantId },
      { $inc: { "variants.$.stock": line.qty } },
      { session },
    );
    await Product.updateOne(
      { _id: line.productId, isUnique: true, availability: "SOLD" },
      { $set: { availability: "READY_STOCK" } },
      { session },
    );
  }
}
