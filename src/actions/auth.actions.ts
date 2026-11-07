"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { DEMO_PROVIDER_ID, OWNER_PROVIDER_ID, OTP_PROVIDER_ID } from "@/lib/auth/providers";
import { ownerCodeEmail } from "@/config/env";
import { getIntegrations } from "@/services/integrations.service";
import { safeCallbackUrl } from "@/lib/safe-redirect";
import { otpRequestSchema, otpVerifySchema } from "@/lib/validations";

export type AuthFormState = { error?: string } | undefined;

export async function requestOtpAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = otpRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: "Enter a valid email address." };
  const callbackUrl = safeCallbackUrl(formData.get("callbackUrl"));

  // The owner email uses its fixed code (OWNER_LOGIN_CODE): nothing is emailed.
  if (parsed.data.email.trim().toLowerCase() === ownerCodeEmail()) {
    redirect(`/login/verify?email=${encodeURIComponent(parsed.data.email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  // Admin → Integrations → Login: "Google only" turns emailed codes off.
  const { login } = await getIntegrations();
  if (login.methods === "google") return { error: "Please sign in with Google." };

  try {
    await signIn(OTP_PROVIDER_ID, { email: parsed.data.email, redirect: false, redirectTo: callbackUrl });
  } catch (e) {
    console.error("[auth] otp request", e);
    return { error: "We couldn't send the code. Please try again." };
  }
  redirect(`/login/verify?email=${encodeURIComponent(parsed.data.email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`);
}

export async function verifyOtpAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = otpVerifySchema.safeParse({ email: formData.get("email"), code: formData.get("code") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid code." };
  const callbackUrl = safeCallbackUrl(formData.get("callbackUrl"));

  // Owner with a fixed code: check it with the owner provider (with lockout).
  if (parsed.data.email.trim().toLowerCase() === ownerCodeEmail()) {
    try {
      await signIn(OWNER_PROVIDER_ID, { email: parsed.data.email, password: parsed.data.code, redirectTo: safeCallbackUrl(formData.get("callbackUrl"), "/admin") });
    } catch (e) {
      if (e instanceof AuthError) return { error: "That code is wrong, or sign-in is paused for 15 minutes after too many tries." };
      throw e; // successful sign-in redirects by throwing
    }
  }

  // Auth.js consumes the token on its email callback route.
  const params = new URLSearchParams({ email: parsed.data.email, token: parsed.data.code, callbackUrl });
  redirect(`/api/auth/callback/${OTP_PROVIDER_ID}?${params}`);
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
  try {
    await signIn(OWNER_PROVIDER_ID, {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: safeCallbackUrl(formData.get("callbackUrl"), "/admin"),
    });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Wrong owner email or password." };
    throw e; // successful sign-in redirects by throwing; let Next handle it
  }
}

export async function googleSignInAction(formData: FormData) {
  await signIn("google", { redirectTo: safeCallbackUrl(formData.get("callbackUrl")) });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
