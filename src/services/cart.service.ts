import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { auth } from "@/lib/auth";
import { Cart, Product } from "@/models";
import type { CartDTO, CartLineDTO } from "@/types/dto";
import { toImage, variantLabel, type LeanProduct } from "./mappers";

const GUEST_COOKIE = "cg_cart";
const MAX_QTY = 20;

type CartOwner = { user: Types.ObjectId } | { guestId: string };

/**
 * Who owns the cart for this request. With `create`, a guest cookie is issued;
 * only pass `create` from a server action or route handler (cookies are writable there).
 */
async function resolveOwner(create = false): Promise<CartOwner | null> {
  const session = await auth();
  if (session?.user?.id) return { user: new Types.ObjectId(session.user.id) };

  const jar = await cookies();
  const existing = jar.get(GUEST_COOKIE)?.value;
  if (existing) return { guestId: existing };
  if (!create) return null;

  const guestId = randomUUID();
  jar.set(GUEST_COOKIE, guestId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return { guestId };
}

export async function getCart(): Promise<CartDTO> {
  await connectDB();
  const owner = await resolveOwner();
  const empty: CartDTO = { lines: [], itemCount: 0, subtotal: 0 };
  if (!owner) return empty;

  const cart = await Cart.findOne(owner).lean();
  if (!cart?.items.length) return empty;

  const products = await Product.find({ _id: { $in: cart.items.map((i) => i.product) } })
    .select("slug name status availability images variants")
    .populate("variants.glaze", "name")
    .populate("variants.size", "label")
    .lean<(LeanProduct & { status: string })[]>();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const lines: CartLineDTO[] = [];
  for (const item of cart.items) {
    const p = byId.get(String(item.product));
    const v = p?.variants.find((x) => String(x._id) === String(item.variant));
    if (!p || !v) continue; // product deleted: silently drop

    const madeToOrder = p.availability === "MADE_TO_ORDER";
    const unavailable = p.status !== "ACTIVE" || p.availability === "SOLD" || v.isActive === false;
    const maxQty = madeToOrder ? MAX_QTY : Math.min(MAX_QTY, v.stock);
    const problem = unavailable || maxQty === 0 ? "unavailable" : item.qty > maxQty ? "insufficient_stock" : undefined;

    lines.push({
      productId: String(p._id),
      variantId: String(v._id),
      slug: p.slug,
      name: p.name,
      variantLabel: variantLabel(v),
      image: toImage(v.images?.main ?? p.images?.[0], p.name),
      unitPrice: v.price,
      qty: item.qty,
      lineTotal: v.price * item.qty,
      availability: p.availability,
      maxQty,
      problem,
    });
  }

  const valid = lines.filter((l) => !l.problem);
  return {
    lines,
    itemCount: lines.reduce((n, l) => n + l.qty, 0),
    subtotal: valid.reduce((n, l) => n + l.lineTotal, 0),
  };
}

export async function getCartCount() {
  await connectDB();
  const owner = await resolveOwner();
  if (!owner) return 0;
  const cart = await Cart.findOne(owner).select("items.qty").lean();
  return cart?.items.reduce((n, i) => n + i.qty, 0) ?? 0;
}

export async function addItem(productId: string, variantId: string, qty: number) {
  await connectDB();
  const product = await Product.findOne({
    _id: productId,
    status: "ACTIVE",
    availability: { $ne: "SOLD" },
    variants: { $elemMatch: { _id: variantId, isActive: { $ne: false } } },
  })
    .select("availability variants.$")
    .lean<LeanProduct>();
  const variant = product?.variants[0];
  if (!product || !variant) throw new CartError("This item is no longer available.");

  const owner = (await resolveOwner(true))!;
  const cart = (await Cart.findOne(owner)) ?? new Cart({ ...owner, items: [] });
  const line = cart.items.find((i) => String(i.variant) === variantId);
  const nextQty = (line?.qty ?? 0) + qty;
  const cap = product.availability === "MADE_TO_ORDER" ? MAX_QTY : Math.min(MAX_QTY, variant.stock);
  if (nextQty > cap) throw new CartError(cap === 0 ? "Out of stock." : `Only ${cap} available.`);

  if (line) line.qty = nextQty;
  else cart.items.push({ product: new Types.ObjectId(productId), variant: new Types.ObjectId(variantId), qty });
  await cart.save();
}

export async function setItemQty(productId: string, variantId: string, qty: number) {
  await connectDB();
  const owner = await resolveOwner();
  if (!owner) return;
  if (qty === 0) {
    await Cart.updateOne(owner, { $pull: { items: { variant: new Types.ObjectId(variantId) } } });
    return;
  }
  await Cart.updateOne(
    { ...owner, "items.variant": new Types.ObjectId(variantId), "items.product": new Types.ObjectId(productId) },
    { $set: { "items.$.qty": Math.min(qty, MAX_QTY) } },
  );
}

export async function clearCartForUser(userId: string) {
  await connectDB();
  await Cart.updateOne({ user: new Types.ObjectId(userId) }, { $set: { items: [] } });
}

/** Called on sign-in: fold the guest cart into the user's cart, then drop the cookie. */
export async function mergeGuestCartInto(userId: string) {
  const jar = await cookies();
  const guestId = jar.get(GUEST_COOKIE)?.value;
  if (!guestId) return;
  await connectDB();

  const guest = await Cart.findOne({ guestId });
  if (guest?.items.length) {
    const userCart = (await Cart.findOne({ user: userId })) ?? new Cart({ user: userId, items: [] });
    for (const g of guest.items) {
      const existing = userCart.items.find((i) => String(i.variant) === String(g.variant));
      if (existing) existing.qty = Math.min(MAX_QTY, existing.qty + g.qty);
      else userCart.items.push(g);
    }
    await userCart.save();
  }
  if (guest) await guest.deleteOne();
  jar.delete(GUEST_COOKIE);
}

export class CartError extends Error {}
