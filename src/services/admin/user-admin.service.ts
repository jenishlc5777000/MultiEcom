import "server-only";
import { DomainError } from "@/lib/errors";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { Order, Review, User } from "@/models";

export class UserAdminError extends DomainError {}

const PAGE_SIZE = 30;

export async function listUsers({ q, role, page = 1 }: { q?: string; role?: string; page?: number }) {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (role === "owner" || role === "customer") filter.role = role === "customer" ? { $ne: "owner" } : "owner";
  if (role === "blocked") filter.isBlocked = true;
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ email: rx }, { name: rx }, { phone: rx }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).select("name email role isBlocked createdAt").sort({ createdAt: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
    User.countDocuments(filter),
  ]);

  // Order stats for just this page of users, in one aggregation.
  const stats = await Order.aggregate<{ _id: Types.ObjectId; orders: number; spent: number; last: Date }>([
    { $match: { user: { $in: users.map((u) => u._id) }, paymentStatus: { $in: ["PAID", "REFUNDED", "PARTIALLY_REFUNDED"] } } },
    { $group: { _id: "$user", orders: { $sum: 1 }, spent: { $sum: { $cond: [{ $eq: ["$paymentStatus", "PAID"] }, "$total", 0] } }, last: { $max: "$createdAt" } } },
  ]);
  const byUser = new Map(stats.map((s) => [String(s._id), s]));

  return {
    users: users.map((u) => {
      const s = byUser.get(String(u._id));
      return {
        id: String(u._id),
        name: u.name ?? "",
        email: u.email,
        role: (u.role ?? "customer") as "customer" | "owner",
        isBlocked: Boolean(u.isBlocked),
        joinedAt: (u.createdAt ?? new Date(0)).toISOString(),
        orders: s?.orders ?? 0,
        spent: s?.spent ?? 0,
        lastOrderAt: s?.last?.toISOString() ?? null,
      };
    }),
    total,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getUserDetail(id: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(id)) return null;
  const user = await User.findById(id).lean();
  if (!user) return null;
  const [orders, reviews] = await Promise.all([
    Order.find({ user: id }).select("orderNumber total status paymentStatus createdAt").sort({ createdAt: -1 }).limit(50).lean(),
    Review.countDocuments({ userId: id }),
  ]);
  const paid = orders.filter((o) => o.paymentStatus === "PAID");
  return {
    user,
    orders,
    reviewCount: reviews,
    lifetimeValue: paid.reduce((n, o) => n + o.total, 0),
    paidOrders: paid.length,
  };
}

export async function setUserRole(actorId: string, userId: string, role: "customer" | "owner") {
  await connectDB();
  if (actorId === userId && role !== "owner") throw new UserAdminError("You can't remove your own owner access.");
  if (role !== "owner") {
    const owners = await User.countDocuments({ role: "owner", _id: { $ne: userId } });
    if (owners === 0) throw new UserAdminError("The store needs at least one owner.");
  }
  await User.updateOne({ _id: userId }, { $set: { role } });
}

export async function setUserBlocked(actorId: string, userId: string, blocked: boolean, reason?: string) {
  await connectDB();
  if (actorId === userId) throw new UserAdminError("You can't block your own account.");
  const target = await User.findById(userId).select("role").lean();
  if (!target) throw new UserAdminError("User not found.");
  if (blocked && target.role === "owner") throw new UserAdminError("Remove owner access before blocking this account.");
  await User.updateOne({ _id: userId }, blocked ? { $set: { isBlocked: true, blockedReason: reason } } : { $set: { isBlocked: false }, $unset: { blockedReason: 1 } });
}
