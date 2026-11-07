import "server-only";
import { randomInt, timingSafeEqual } from "node:crypto";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import ResendProvider from "next-auth/providers/resend";
import { demoLoginEnabled, env, ownerCodeEnabled, ownerPasswordEnabled } from "@/config/env";
import { clearOwnerLoginFailures, ownerLoginLocked, recordOwnerLoginFailure } from "./owner-throttle";
import { connectDB } from "@/lib/db/connect";
import { sendOtpEmail } from "@/lib/email";
import { User } from "@/models/User";
import { getIntegrations } from "@/services/integrations.service";
import { DEMO_ACCOUNTS } from "./demo-accounts";

export const OTP_PROVIDER_ID = "email-otp";
export const DEMO_PROVIDER_ID = "demo";
export const OWNER_PROVIDER_ID = "owner-password";
export const OTP_TTL_SECONDS = 10 * 60;

const sameString = (a: string, b: string) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
};

/**
 * Email OTP built on Auth.js's email provider: instead of a magic link we
 * generate a 6-digit code, email it, and the user types it on /login/verify,
 * which forwards to the provider's callback URL with `token=<code>`.
 *
 * Add, remove or replace providers here only; nothing else imports them.
 */
export async function buildProviders(): Promise<Provider[]> {
  const e = env();
  // Google credentials and the login-method choice come from Admin → Integrations (or .env).
  const { google, login } = await getIntegrations().catch(() => ({ google: { clientId: "", clientSecret: "" }, login: { methods: "both" as const } }));
  const providers: Provider[] = [
    ResendProvider({
      id: OTP_PROVIDER_ID,
      name: "Email code",
      apiKey: e.RESEND_API_KEY ?? "unused-in-dev", // sending is done by sendVerificationRequest
      from: e.EMAIL_FROM,
      maxAge: OTP_TTL_SECONDS,
      generateVerificationToken: () => randomInt(0, 1_000_000).toString().padStart(6, "0"),
      sendVerificationRequest: async ({ identifier, token }) => sendOtpEmail(identifier, token),
    }),
  ];

  if (google.clientId && google.clientSecret && login.methods !== "email") {
    providers.push(
      Google({
        clientId: google.clientId,
        clientSecret: google.clientSecret,
        // Same verified email from Google and OTP should map to one account.
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }

  // Store owner: OWNER_EMAIL + either OWNER_PASSWORD or the fixed 6-digit
  // OWNER_LOGIN_CODE (Vercel secrets). Only that one email can use it, it always
  // signs in as an owner, and it locks after repeated failures.
  if (ownerPasswordEnabled() || ownerCodeEnabled()) {
    providers.push(
      Credentials({
        id: OWNER_PROVIDER_ID,
        name: "Owner password",
        credentials: { email: { type: "email" }, password: { type: "password" } },
        async authorize(raw) {
          const email = String(raw?.email ?? "").trim().toLowerCase();
          const password = String(raw?.password ?? "");
          const ownerEmail = env().OWNER_EMAIL!.trim().toLowerCase();
          if (await ownerLoginLocked()) return null;
          const passwordOk = ownerPasswordEnabled() && sameString(password, env().OWNER_PASSWORD!);
          const codeOk = ownerCodeEnabled() && sameString(password.replace(/\s/g, ""), env().OWNER_LOGIN_CODE!);
          if (!sameString(email, ownerEmail) || !(passwordOk || codeOk)) {
            await recordOwnerLoginFailure();
            // Slow down guessing.
            await new Promise((r) => setTimeout(r, 1200));
            return null;
          }
          await clearOwnerLoginFailures();
          await connectDB();
          const user = await User.findOneAndUpdate(
            { email },
            { $set: { role: "owner" }, $setOnInsert: { email, name: "Store owner", emailVerified: new Date() } },
            { upsert: true, new: true },
          ).lean();
          if (user?.isBlocked) return null;
          return { id: String(user!._id), email, name: user!.name ?? "Store owner", role: "owner" };
        },
      }),
    );
  }

  if (demoLoginEnabled()) {
    providers.push(
      Credentials({
        id: DEMO_PROVIDER_ID,
        name: "Demo account",
        credentials: { email: { type: "email" }, password: { type: "password" } },
        async authorize(raw) {
          const email = String(raw?.email ?? "").trim().toLowerCase();
          const password = String(raw?.password ?? "");
          const account = DEMO_ACCOUNTS.find((a) => a.email === email);
          if (!account || !sameString(password, env().DEMO_PASSWORD)) return null;

          await connectDB();
          const user = await User.findOneAndUpdate(
            { email },
            { $set: { role: account.role }, $setOnInsert: { email, name: account.name, emailVerified: new Date() } },
            { upsert: true, new: true },
          ).lean();
          return { id: String(user!._id), email, name: user!.name ?? account.name, role: account.role };
        },
      }),
    );
  }

  return providers;
}
