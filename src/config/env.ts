import "server-only";
import { z } from "zod";

const optional = z.string().optional().transform((v) => (v ? v : undefined));

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  MONGODB_URI: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  AUTH_GOOGLE_ID: optional,
  AUTH_GOOGLE_SECRET: optional,
  RESEND_API_KEY: optional,
  EMAIL_FROM: z.string().default("Clay & Glaze <onboarding@resend.dev>"),
  RAZORPAY_KEY_ID: optional,
  RAZORPAY_KEY_SECRET: optional,
  RAZORPAY_WEBHOOK_SECRET: optional,
  CLOUDINARY_CLOUD_NAME: optional,
  CLOUDINARY_API_KEY: optional,
  CLOUDINARY_API_SECRET: optional,
  /** Dev-only email + password demo accounts. Ignored in production. */
  DEMO_LOGIN: z.enum(["true", "false"]).default("false"),
  DEMO_PASSWORD: z.string().default("demo1234"),
  /** Optional password sign-in for one owner account (works in production). */
  OWNER_EMAIL: optional,
  OWNER_PASSWORD: optional,
  /** Optional fixed 6-digit sign-in code for OWNER_EMAIL (used instead of an emailed code). */
  OWNER_LOGIN_CODE: optional,
});

/**
 * Integration keys. In production they can come from .env or from
 * Admin → Integrations (stored encrypted in the database), so a missing one is
 * logged, not fatal: the feature that needs it reports a clear error instead.
 */
const INTEGRATION_KEYS = [
  "RESEND_API_KEY",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

export type Env = z.infer<typeof schema>;
type OptionalKey = (typeof INTEGRATION_KEYS)[number];

let cached: Env | undefined;

/**
 * Validated on first use (not at import) so `next build` can collect pages
 * without every secret present. MONGODB_URI and AUTH_SECRET are always
 * required; integration keys are optional here (see INTEGRATION_KEYS).
 */
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid or missing environment variables: ${missing}`);
  }
  if (parsed.data.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
    const missing = INTEGRATION_KEYS.filter((k) => !parsed.data[k]);
    if (missing.length) console.warn(`[env] Not set in .env (add them in Admin → Integrations, or the feature stays off): ${missing.join(", ")}`);
  }
  cached = parsed.data;
  return cached;
}

/** Read an integration key, failing with a clear message if it isn't configured. */
export function requireEnv(key: OptionalKey): string {
  const value = env()[key];
  if (!value) throw new Error(`${key} is not set. Add it to .env to use this feature.`);
  return value;
}

/** Owner password sign-in: only when both are set and the password is at least 12 characters. */
export function ownerPasswordEnabled() {
  const e = env();
  return Boolean(e.OWNER_EMAIL && e.OWNER_PASSWORD && e.OWNER_PASSWORD.length >= 12);
}

/** Fixed owner code: OWNER_EMAIL plus a 6-digit OWNER_LOGIN_CODE. */
export function ownerCodeEnabled() {
  const e = env();
  return Boolean(e.OWNER_EMAIL && e.OWNER_LOGIN_CODE && /^\d{6}$/.test(e.OWNER_LOGIN_CODE));
}

/** The owner email that uses the fixed code (lowercased), or undefined. */
export function ownerCodeEmail() {
  return ownerCodeEnabled() ? env().OWNER_EMAIL!.trim().toLowerCase() : undefined;
}

/** Demo accounts are never available in production, whatever the env says. */
export function demoLoginEnabled() {
  const e = env();
  return e.NODE_ENV !== "production" && e.DEMO_LOGIN === "true";
}
