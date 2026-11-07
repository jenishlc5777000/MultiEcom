/**
 * Demo activity for the dashboard: customers, ~90 days of orders in every
 * status, reviews (some awaiting approval) and an open return request.
 *   npm run seed:demo
 * Local development only. Everything it creates is marked (orderNumber "DEMO-",
 * emails "@demo.local") and is deleted and recreated on each run.
 * Demo orders do not touch product stock.
 */
import mongoose, { Types } from "mongoose";
import { Order, Product, ReturnRequest, Review, User } from "../src/models";

if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed demo activity in production.");

// Deterministic pseudo-random so every run produces the same shape.
let s = 42;
const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)]!;
const DAY = 86_400_000;

const CUSTOMERS = [
  ["Demo Customer", "customer@demo.local", "Bengaluru", "Karnataka", "560001"],
  ["Asha (demo)", "asha@demo.local", "Pune", "Maharashtra", "411001"],
  ["Kabir (demo)", "kabir@demo.local", "Jaipur", "Rajasthan", "302001"],
  ["Meera (demo)", "meera@demo.local", "Kochi", "Kerala", "682001"],
  ["Rohan (demo)", "rohan@demo.local", "Delhi", "Delhi", "110001"],
  ["Tara (demo)", "tara@demo.local", "Kolkata", "West Bengal", "700001"],
] as const;

const REVIEW_TEXT = [
  "Beautiful glaze, even nicer in person. Use it every morning.",
  "Packed really carefully and arrived safely. Lovely weight to it.",
  "The colour is slightly different from the photo but I like it more.",
  "Great size for breakfast. Would buy again.",
  "",
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(uri);

  // Clean previous demo activity.
  const old = await Order.find({ orderNumber: /^DEMO-/ }).select("_id").lean();
  const oldIds = old.map((o) => o._id);
  await Promise.all([Review.deleteMany({ orderId: { $in: oldIds } }), ReturnRequest.deleteMany({ order: { $in: oldIds } }), Order.deleteMany({ _id: { $in: oldIds } })]);

  const users = [];
  for (const [i, [name, email]] of CUSTOMERS.entries()) {
    const joined = new Date(Date.now() - (120 - i * 15) * DAY);
    const u = await User.findOneAndUpdate(
      { email },
      { $setOnInsert: { name, email, emailVerified: joined, role: "customer", createdAt: joined } },
      { upsert: true, new: true, timestamps: false },
    );
    users.push(u!);
  }

  const products = await Product.find({ status: "ACTIVE" }).populate("variants.glaze", "name").populate("variants.size", "label").lean<
    { _id: Types.ObjectId; name: string; slug: string; type: string; availability: string; images?: { url: string }[]; variants: { _id: Types.ObjectId; sku: string; price: number; glaze?: { name: string } | null; size?: { label: string } | null; images?: { main?: { url: string } } }[] }[]
  >();
  if (!products.length) throw new Error("Run `npm run seed` first to create products.");

  const plan: { daysAgo: number; status: string }[] = [];
  for (let d = 88; d >= 3; d -= 1 + Math.floor(rnd() * 3)) plan.push({ daysAgo: d, status: rnd() < 0.12 ? "CANCELLED" : "DELIVERED" });
  plan.push({ daysAgo: 3, status: "DISPATCHED" }, { daysAgo: 2, status: "IN_PRODUCTION" }, { daysAgo: 2, status: "CONFIRMED" }, { daysAgo: 1, status: "AWAITING_APPROVAL" }, { daysAgo: 0.4, status: "AWAITING_APPROVAL" }, { daysAgo: 0.1, status: "AWAITING_APPROVAL" }, { daysAgo: 0.05, status: "PENDING_PAYMENT" });

  const created = [];
  for (const [n, p] of plan.entries()) {
    const ci = n % 5 === 0 ? 0 : 1 + Math.floor(rnd() * (CUSTOMERS.length - 1));
    const user = users[ci]!;
    const [, , city, state, pincode] = CUSTOMERS[ci]!;
    const at = new Date(Date.now() - p.daysAgo * DAY - Math.floor(rnd() * 8) * 3_600_000);
    const lineCount = 1 + Math.floor(rnd() * 2);
    const items = Array.from({ length: lineCount }, () => {
      const prod = pick(products);
      const v = pick(prod.variants);
      const qty = rnd() < 0.8 ? 1 : 2;
      return {
        product: prod._id, variant: v._id, productName: prod.name, productSlug: prod.slug, productType: prod.type, availability: prod.availability,
        sku: v.sku, glazeName: v.glaze?.name, sizeLabel: v.size?.label, imageUrl: v.images?.main?.url ?? prod.images?.[0]?.url,
        unitPrice: v.price, qty, lineTotal: v.price * qty, stockReserved: false,
      };
    });
    const subtotal = items.reduce((t, i) => t + i.lineTotal, 0);
    const shippingFee = subtotal >= 199900 ? 0 : 9900;
    const paid = p.status !== "PENDING_PAYMENT";
    const flow = ["PENDING_PAYMENT", "AWAITING_APPROVAL", "CONFIRMED", "DISPATCHED", "DELIVERED"];
    const upto = p.status === "CANCELLED" ? 2 : p.status === "IN_PRODUCTION" ? 3 : flow.indexOf(p.status) + 1;
    // Spread steps after the order date, never into the future.
    const stepMs = Math.min(1.5 * DAY, (Date.now() - at.getTime()) / (upto + 1));
    const timeline = flow.slice(0, upto).map((st, k) => ({ status: st, by: k === 0 ? "customer" : k === 1 ? "system" : "owner", at: new Date(at.getTime() + k * stepMs), note: k === 1 ? "Payment received" : undefined }));
    if (p.status === "IN_PRODUCTION") timeline.push({ status: "IN_PRODUCTION", by: "owner", at: new Date(at.getTime() + 3 * 3_600_000), note: "Production started" });
    if (p.status === "CANCELLED") timeline.push({ status: "CANCELLED", by: "owner", at: new Date(at.getTime() + 2 * 3_600_000), note: "Cancelled: customer asked to cancel" });

    created.push({
      orderNumber: `DEMO-${String(1000 + n)}`,
      user: user._id,
      email: user.email,
      items,
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      shippingAddress: { fullName: user.name ?? "Demo", phone: "9876543210", line1: "12 Demo Street", city, state, pincode },
      status: p.status,
      paymentStatus: p.status === "CANCELLED" ? "REFUNDED" : paid ? "PAID" : "PENDING",
      refund: p.status === "CANCELLED" ? { status: "PROCESSED", amount: subtotal + shippingFee, at } : undefined,
      approval: ["CONFIRMED", "IN_PRODUCTION", "DISPATCHED", "DELIVERED"].includes(p.status) ? { decision: "APPROVED", decidedAt: new Date(at.getTime() + DAY) } : undefined,
      dispatch: ["DISPATCHED", "DELIVERED"].includes(p.status)
        ? { courier: "Delhivery", trackingNumber: `DL${100000 + n}`, dispatchedAt: new Date(at.getTime() + 2 * DAY), deliveredAt: p.status === "DELIVERED" ? new Date(Math.min(Date.now() - DAY, at.getTime() + 5 * DAY)) : undefined }
        : undefined,
      stockReleased: p.status === "CANCELLED",
      timeline,
      createdAt: at,
      updatedAt: at,
    });
  }
  // timestamps: false keeps the historical createdAt values set above.
  const orders = (await Order.insertMany(created, { timestamps: false } as never)) as unknown as InstanceType<typeof Order>[];

  // Reviews on delivered orders: most approved, the two newest pending.
  const delivered = orders.filter((o) => o.status === "DELIVERED");
  const reviewable = delivered.filter((o) => o.email !== "customer@demo.local").slice(0, 12);
  for (const [k, o] of reviewable.entries()) {
    const it = o.items[0]!;
    await Review.create({
      productId: it.product, userId: o.user, orderId: o._id, rating: rnd() < 0.75 ? 5 : 4, text: pick(REVIEW_TEXT),
      status: k >= reviewable.length - 2 ? "PENDING" : "APPROVED",
      createdAt: new Date(o.createdAt.getTime() + 7 * DAY),
    });
  }

  // One open return on a recent delivery.
  const recent = [...delivered].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).find((o) => o.email !== "customer@demo.local");
  if (recent) {
    await ReturnRequest.create({ order: recent._id, user: recent.user, items: [{ orderItem: recent.items[0]!._id, qty: 1 }], reason: "DAMAGED", details: "The rim arrived with a small chip. Photos sent by email." });
  }

  // Recompute public ratings from approved reviews.
  for (const p of products) {
    const [agg] = await Review.aggregate<{ avg: number; n: number }>([
      { $match: { productId: p._id, status: "APPROVED" } },
      { $group: { _id: null, avg: { $avg: "$rating" }, n: { $sum: 1 } } },
    ]);
    await Product.updateOne({ _id: p._id }, { $set: { ratingAvg: agg ? Math.round(agg.avg * 10) / 10 : 0, ratingCount: agg?.n ?? 0 } });
  }

  console.log(`Demo activity: ${orders.length} orders, ${reviewable.length} reviews, ${recent ? 1 : 0} return request.`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
