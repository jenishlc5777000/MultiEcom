"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { getCurrentUser } from "@/lib/auth/guards";
import { signIn, signOut } from "@/lib/auth";
import { ownerPasswordEnabled } from "@/config/env";
import { CUSTOMER_PROVIDER_ID, DEMO_PROVIDER_ID, OWNER_PROVIDER_ID } from "@/lib/auth/providers";
import { hashPassword } from "@/lib/auth/password";
import { connectDB } from "@/lib/db/connect";
import { safeCallbackUrl } from "@/lib/safe-redirect";
import { changePasswordSchema, customerRegisterSchema, customerSignInSchema, resetPasswordSchema } from "@/lib/validations";
import { changePassword, PasswordError, requestPasswordReset, resetPassword } from "@/services/password.service";
import { User } from "@/models/User";
import { getIntegrations } from "@/services/integrations.service";

/** `email` is sent back so the form keeps what was typed after an error. */
export type AuthFormState = { error?: string; email?: string; ok?: string } | undefined;

async function passwordLoginAllowed() {
  // Admin → Integrations → Customer login: "Google only" turns email + password off.
  const { google, login } = await getIntegrations();
  return !(login.methods === "google" && google.clientId && google.clientSecret);
}

export async function customerSignInAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const typed = String(formData.get("email") ?? "");
  const parsed = customerSignInSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { email: typed, error: parsed.error.issues[0]?.message ?? "Enter your email and password." };
  if (!(await passwordLoginAllowed())) return { email: typed, error: "Please sign in with Google." };
  try {
    await signIn(CUSTOMER_PROVIDER_ID, { ...parsed.data, redirectTo: safeCallbackUrl(formData.get("callbackUrl")) });
  } catch (e) {
    if (e instanceof AuthError) return { email: typed, error: "Wrong email or password." };
    throw e; // successful sign-in redirects by throwing; let Next handle it
  }
}

export async function customerRegisterAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const typed = String(formData.get("email") ?? "");
  const parsed = customerRegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { email: typed, error: parsed.error.issues[0]?.message ?? "Check your details." };
  if (!(await passwordLoginAllowed())) return { email: typed, error: "Please sign in with Google." };
  const { name, email, password } = parsed.data;

  await connectDB();
  const existing = await User.findOne({ email }).select("+passwordHash role").lean();
  if (existing) {
    if (existing.passwordHash) return { email: typed, error: "An account with this email already exists. Sign in instead." };
    if (existing.role === "owner") return { email: typed, error: "This email can't be used for a customer account." };
    return { email: typed, error: "This email is already registered. Sign in with Google, or contact the store to set a password." };
  }
  try {
    await User.create({ name, email, passwordHash: await hashPassword(password), role: "customer" });
  } catch (e) {
    if ((e as { code?: number }).code === 11000) return { email: typed, error: "An account with this email already exists. Sign in instead." };
    throw e;
  }

  try {
    await signIn(CUSTOMER_PROVIDER_ID, { email, password, redirectTo: safeCallbackUrl(formData.get("callbackUrl")) });
  } catch (e) {
    if (e instanceof AuthError) return { email: typed, error: "Your account was created. Please sign in." };
    throw e;
  }
}

/** Forgot password: always the same answer, so it doesn't reveal which emails have accounts. */
export async function requestPasswordResetAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = customerSignInSchema.shape.email.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Enter a valid email address." };
  await requestPasswordReset(parsed.data);
  return { email: parsed.data, ok: "If an account uses this email, we've sent a link to reset the password. It works for 30 minutes. Check your spam folder too." };
}

export async function resetPasswordAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(["email", "token", "password", "confirm"].map((k) => [k, formData.get(k) ?? ""])));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  try {
    await resetPassword(parsed.data.email, parsed.data.token, parsed.data.password);
  } catch (e) {
    if (e instanceof PasswordError) return { error: e.message };
    throw e;
  }
  redirect("/login?reset=1");
}

/** Profile → Password: change it (or set one, for accounts made with Google). */
export async function changePasswordAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const user = await getCurrentUser();
  if (!user?.id) return { error: "Please sign in again." };
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(["current", "password", "confirm"].map((k) => [k, formData.get(k) ?? ""])));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  try {
    await changePassword(user.id, parsed.data.current, parsed.data.password);
  } catch (e) {
    if (e instanceof PasswordError) return { error: e.message };
    throw e;
  }
  return { ok: "Password saved." };
}

/** Dev-only demo accounts (provider is only registered when demoLoginEnabled()). */
export async function demoSignInAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  try {
    await signIn(DEMO_PROVIDER_ID, {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: safeCallbackUrl(formData.get("callbackUrl")),
    });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Wrong demo email or password." };
    throw e; // successful sign-in redirects by throwing; let Next handle it
  }
}

export async function ownerSignInAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const typed = String(formData.get("email") ?? "");
  if (!ownerPasswordEnabled()) return { email: typed, error: "Admin sign-in isn't set up. Set OWNER_EMAIL and OWNER_PASSWORD (12+ characters)." };
  try {
    await signIn(OWNER_PROVIDER_ID, {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: safeCallbackUrl(formData.get("callbackUrl"), "/admin"),
    });
  } catch (e) {
    if (e instanceof AuthError) return { email: typed, error: "Wrong email or password, or sign-in is paused for 15 minutes after too many tries." };
    throw e; // successful sign-in redirects by throwing; let Next handle it
  }
}

export async function googleSignInAction(formData: FormData) {
  await signIn("google", { redirectTo: safeCallbackUrl(formData.get("callbackUrl")) });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
