"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { ownerPasswordEnabled } from "@/config/env";
import { CUSTOMER_PROVIDER_ID, DEMO_PROVIDER_ID, OWNER_PROVIDER_ID } from "@/lib/auth/providers";
import { hashPassword } from "@/lib/auth/password";
import { connectDB } from "@/lib/db/connect";
import { safeCallbackUrl } from "@/lib/safe-redirect";
import { customerRegisterSchema, customerSignInSchema } from "@/lib/validations";
import { User } from "@/models/User";
import { getIntegrations } from "@/services/integrations.service";

/** `email` is sent back so the form keeps what was typed after an error. */
export type AuthFormState = { error?: string; email?: string } | undefined;

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
