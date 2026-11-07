import "server-only";
import { env } from "@/config/env";
import { connectDB } from "@/lib/db/connect";
import { decryptSecret, encryptSecret, maskSecret } from "@/lib/secrets";
import { Setting } from "@/models";

/**
 * Third-party credentials managed in Admin → Integrations. Values saved in the
 * dashboard win; anything not saved there falls back to .env, so existing
 * deployments keep working. Secret fields are stored encrypted and are never
 * returned to the browser (the dashboard only sees "saved, ends in 1234").
 */

export const SMS_PROVIDERS = ["none", "msg91", "twilio", "fast2sms"] as const;
export type SmsProvider = (typeof SMS_PROVIDERS)[number];
/** How customers sign in: emailed code, Google, or both. */
export const LOGIN_METHODS = ["both", "email", "google"] as const;
export type LoginMethod = (typeof LOGIN_METHODS)[number];

export type Integrations = {
  razorpay: { keyId: string; keySecret: string; webhookSecret: string };
  email: { apiKey: string; from: string };
  sms: { provider: SmsProvider; apiKey: string; accountSid: string; senderId: string; templateId: string; orderUpdates: boolean };
  google: { clientId: string; clientSecret: string };
  login: { methods: LoginMethod };
};

/** Field names that are encrypted at rest and write-only in the dashboard. */
export const SECRET_FIELDS = ["razorpay.keySecret", "razorpay.webhookSecret", "email.apiKey", "sms.apiKey", "google.clientSecret"] as const;
export type SecretField = (typeof SECRET_FIELDS)[number];

type Stored = {
  razorpay?: { keyId?: string; keySecret?: string; webhookSecret?: string };
  email?: { apiKey?: string; from?: string };
  sms?: { provider?: SmsProvider; apiKey?: string; accountSid?: string; senderId?: string; templateId?: string; orderUpdates?: boolean };
  google?: { clientId?: string; clientSecret?: string };
  login?: { methods?: LoginMethod };
};

let cache: { at: number; value: Integrations } | null = null;
const TTL_MS = 30_000;

async function readStored(): Promise<Stored> {
  await connectDB();
  const s = await Setting.findOne({ key: "store" }).select("integrations").lean<{ integrations?: Stored }>();
  return s?.integrations ?? {};
}

/** Decrypted credentials for server code (payments, email, SMS). */
export async function getIntegrations(): Promise<Integrations> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  const s = await readStored().catch(() => ({}) as Stored);
  const e = env();
  const value: Integrations = {
    razorpay: {
      keyId: s.razorpay?.keyId || e.RAZORPAY_KEY_ID || "",
      keySecret: decryptSecret(s.razorpay?.keySecret) || e.RAZORPAY_KEY_SECRET || "",
      webhookSecret: decryptSecret(s.razorpay?.webhookSecret) || e.RAZORPAY_WEBHOOK_SECRET || "",
    },
    email: {
      apiKey: decryptSecret(s.email?.apiKey) || e.RESEND_API_KEY || "",
      from: s.email?.from || e.EMAIL_FROM,
    },
    sms: {
      provider: s.sms?.provider ?? "none",
      apiKey: decryptSecret(s.sms?.apiKey),
      accountSid: s.sms?.accountSid ?? "",
      senderId: s.sms?.senderId ?? "",
      templateId: s.sms?.templateId ?? "",
      orderUpdates: s.sms?.orderUpdates ?? false,
    },
    google: {
      clientId: s.google?.clientId || e.AUTH_GOOGLE_ID || "",
      clientSecret: decryptSecret(s.google?.clientSecret) || e.AUTH_GOOGLE_SECRET || "",
    },
    login: { methods: (LOGIN_METHODS as readonly string[]).includes(s.login?.methods ?? "") ? s.login!.methods! : "both" },
  };
  cache = { at: Date.now(), value };
  return value;
}

type SecretState = { saved: boolean; hint: string; source: "dashboard" | "env" | "none" };

/** Safe view for the dashboard: plain fields, plus only whether each secret is set. */
export async function getIntegrationsForAdmin() {
  const s = await readStored();
  const e = env();
  const secret = (stored: unknown, envValue?: string): SecretState => {
    const v = decryptSecret(stored);
    if (v) return { saved: true, hint: maskSecret(v), source: "dashboard" };
    if (envValue) return { saved: true, hint: maskSecret(envValue), source: "env" };
    return { saved: false, hint: "", source: "none" };
  };
  return {
    razorpay: {
      keyId: s.razorpay?.keyId ?? "",
      keyIdFromEnv: !s.razorpay?.keyId && Boolean(e.RAZORPAY_KEY_ID),
      keySecret: secret(s.razorpay?.keySecret, e.RAZORPAY_KEY_SECRET),
      webhookSecret: secret(s.razorpay?.webhookSecret, e.RAZORPAY_WEBHOOK_SECRET),
      webhookUrl: `${e.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
    },
    email: {
      from: s.email?.from ?? "",
      fromDefault: e.EMAIL_FROM,
      apiKey: secret(s.email?.apiKey, e.RESEND_API_KEY),
    },
    sms: {
      provider: s.sms?.provider ?? "none",
      accountSid: s.sms?.accountSid ?? "",
      senderId: s.sms?.senderId ?? "",
      templateId: s.sms?.templateId ?? "",
      orderUpdates: s.sms?.orderUpdates ?? false,
      apiKey: secret(s.sms?.apiKey),
    },
    google: {
      clientId: s.google?.clientId ?? "",
      clientIdFromEnv: !s.google?.clientId && Boolean(e.AUTH_GOOGLE_ID),
      clientSecret: secret(s.google?.clientSecret, e.AUTH_GOOGLE_SECRET),
      redirectUrl: `${e.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
    },
    login: { methods: (s.login?.methods ?? "both") as LoginMethod },
  };
}
export type IntegrationsAdminView = Awaited<ReturnType<typeof getIntegrationsForAdmin>>;

export type IntegrationsSave = {
  razorpay: { keyId: string; keySecret?: string; webhookSecret?: string };
  email: { from: string; apiKey?: string };
  sms: { provider: SmsProvider; accountSid: string; senderId: string; templateId: string; orderUpdates: boolean; apiKey?: string };
  google: { clientId: string; clientSecret?: string };
  login: { methods: LoginMethod };
  /** Secrets to remove. A secret left blank is kept as it is. */
  clear: SecretField[];
};

export async function saveIntegrations(input: IntegrationsSave) {
  await connectDB();
  const $set: Record<string, unknown> = {
    "integrations.razorpay.keyId": input.razorpay.keyId,
    "integrations.email.from": input.email.from,
    "integrations.sms.provider": input.sms.provider,
    "integrations.sms.accountSid": input.sms.accountSid,
    "integrations.sms.senderId": input.sms.senderId,
    "integrations.sms.templateId": input.sms.templateId,
    "integrations.sms.orderUpdates": input.sms.orderUpdates,
    "integrations.google.clientId": input.google.clientId,
    "integrations.login.methods": input.login.methods,
  };
  const $unset: Record<string, 1> = {};
  const secrets: Record<SecretField, string | undefined> = {
    "razorpay.keySecret": input.razorpay.keySecret,
    "razorpay.webhookSecret": input.razorpay.webhookSecret,
    "email.apiKey": input.email.apiKey,
    "sms.apiKey": input.sms.apiKey,
    "google.clientSecret": input.google.clientSecret,
  };
  for (const field of SECRET_FIELDS) {
    if (input.clear.includes(field)) $unset[`integrations.${field}`] = 1;
    else if (secrets[field]) $set[`integrations.${field}`] = encryptSecret(secrets[field]!);
  }
  await Setting.updateOne({ key: "store" }, { $set, ...(Object.keys($unset).length ? { $unset } : {}) }, { upsert: true, strict: false });
  cache = null;
}
