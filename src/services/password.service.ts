import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@/config/env";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { connectDB } from "@/lib/db/connect";
import { emailConfigured, sendPasswordResetEmail } from "@/lib/email";
import { User } from "@/models/User";
import { getIntegrations } from "./integrations.service";

const RESET_TTL_MS = 30 * 60 * 1000;
const RESEND_GAP_MS = 60 * 1000;
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export class PasswordError extends Error {}

/**
 * "Forgot password?" is offered only when it's switched on in Admin →
 * Integrations → Customer login, email sending works (Gmail or Resend), and
 * customers can sign in with a password at all.
 */
export async function passwordResetAvailable() {
  const { login, google } = await getIntegrations();
  const passwordLogin = !(login.methods === "google" && google.clientId && google.clientSecret);
  return login.forgotPassword && passwordLogin && (await emailConfigured());
}

/**
 * Email a reset link to a customer account. Says nothing about whether the
 * account exists (the caller always shows the same message). Owner accounts
 * are skipped: their password is set in the hosting settings.
 */
export async function requestPasswordReset(email: string) {
  if (!(await passwordResetAvailable())) return;
  await connectDB();
  const user = await User.findOne({ email }).select("role isBlocked +resetRequestedAt").lean();
  if (!user || user.isBlocked || (user.role ?? "customer") !== "customer") return;
  if (user.resetRequestedAt && Date.now() - user.resetRequestedAt.getTime() < RESEND_GAP_MS) return;

  const token = randomBytes(32).toString("hex");
  await User.updateOne(
    { _id: user._id },
    { $set: { resetTokenHash: sha256(token), resetTokenExpires: new Date(Date.now() + RESET_TTL_MS), resetRequestedAt: new Date() } },
  );
  const link = `${env().NEXT_PUBLIC_APP_URL}/login/reset?${new URLSearchParams({ email, token })}`;
  await sendPasswordResetEmail(email, link).catch((e) => console.error("[password] reset email", e));
}

/** Set a new password from an emailed link. The link works once, for 30 minutes. */
export async function resetPassword(email: string, token: string, password: string) {
  await connectDB();
  const user = await User.findOne({ email }).select("role +resetTokenHash +resetTokenExpires").lean();
  const expected = user?.resetTokenHash ? Buffer.from(user.resetTokenHash) : null;
  const given = Buffer.from(sha256(token));
  const valid =
    user && (user.role ?? "customer") === "customer" && expected && expected.length === given.length && timingSafeEqual(expected, given) && (user.resetTokenExpires?.getTime() ?? 0) > Date.now();
  if (!valid) throw new PasswordError("This reset link is wrong or has expired. Ask for a new one.");
  await User.updateOne(
    { _id: user._id },
    // The link proved they own the email.
    { $set: { passwordHash: await hashPassword(password), emailVerified: new Date() }, $unset: { resetTokenHash: 1, resetTokenExpires: 1 } },
  );
}

/** Whether this account has a password (Google-only accounts don't, until they set one). */
export async function hasPassword(userId: string) {
  await connectDB();
  const u = await User.findById(userId).select("+passwordHash").lean();
  return Boolean(u?.passwordHash);
}

/** Change (or, for Google-only accounts, set) the signed-in customer's password. */
export async function changePassword(userId: string, current: string, password: string) {
  await connectDB();
  const u = await User.findById(userId).select("role +passwordHash").lean();
  if (!u || (u.role ?? "customer") !== "customer") throw new PasswordError("The admin password is set in the hosting settings, not here.");
  if (u.passwordHash && !(await verifyPassword(current, u.passwordHash))) throw new PasswordError("Your current password is wrong.");
  await User.updateOne({ _id: userId }, { $set: { passwordHash: await hashPassword(password) }, $unset: { resetTokenHash: 1, resetTokenExpires: 1 } });
}
