import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import { auth } from "./index";

/**
 * Authorisation lives here and is called from every page, server action and
 * route handler that needs it. Middleware is not used as a security boundary.
 *
 * The session JWT can outlive a block or a role change, so the current role
 * and blocked flag are re-read from the database (once per request).
 */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return null;

  await connectDB();
  const row = await User.findById(user.id).select("role isBlocked").lean();
  if (!row || row.isBlocked) return null;
  return { ...user, role: row.role ?? "customer" };
});

export async function requireUser(callbackUrl = "/profile") {
  const user = await getCurrentUser();
  if (!user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  return user;
}

export async function requireOwner() {
  const user = await requireUser("/admin");
  if (user.role !== "owner") redirect("/");
  return user;
}

/** For server actions: throws instead of redirecting so the caller can return an error. */
export async function assertOwner() {
  const user = await getCurrentUser();
  if (!user?.id || user.role !== "owner") throw new Error("Not authorised");
  return user;
}
