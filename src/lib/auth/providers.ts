import "server-only";
import { timingSafeEqual } from "node:crypto";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { demoLoginEnabled, env, ownerPasswordEnabled } from "@/config/env";
import { clearOwnerLoginFailures, ownerLoginLocked, recordOwnerLoginFailure } from "./owner-throttle";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import { getIntegrations } from "@/services/integrations.service";
import { DEMO_ACCOUNTS } from "./demo-accounts";
import { verifyPassword } from "./password";

export const CUSTOMER_PROVIDER_ID = "customer-password";
export const DEMO_PROVIDER_ID = "demo";
export const OWNER_PROVIDER_ID = "owner-password";

const sameString = (a: string, b: string) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
};

/**
 * Sign-in methods: customers use Google and/or email + password; the store
 * owner signs in on the admin login with OWNER_EMAIL + OWNER_PASSWORD.
 *
 * Add, remove or replace providers here only; nothing else imports them.
 */
export async function buildProviders(): Promise<Provider[]> {
  // Google credentials and the login-method choice come from Admin → Integrations (or .env).
  const { google, login } = await getIntegrations().catch(() => ({ google: { clientId: "", clientSecret: "" }, login: { methods: "both" as const } }));
  const providers: Provider[] = [
    Credentials({
      id: CUSTOMER_PROVIDER_ID,
      name: "Email and password",
      credentials: { email: { type: "email" }, password: { type: "password" } },
      async authorize(raw) {
        const email = String(raw?.email ?? "").trim().toLowerCase();
        const password = String(raw?.password ?? "");
        if (!email || !password) return null;
        await connectDB();
        const user = await User.findOne({ email }).select("+passwordHash name role isBlocked").lean();
        // Admin accounts use the admin login, not the customer one.
        const ok = user && !user.isBlocked && (user.role ?? "customer") === "customer" && (await verifyPassword(password, user.passwordHash));
        if (!ok) {
          await new Promise((r) => setTimeout(r, 800)); // slow down guessing
          return null;
        }
        return { id: String(user._id), email, name: user.name ?? email, role: "customer" };
      },
    }),
  ];

  if (google.clientId && google.clientSecret && login.methods !== "email") {
    providers.push(
      Google({
        clientId: google.clientId,
        clientSecret: google.clientSecret,
        // A Google account and an email + password account with the same email are one account.
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }

  // Store owner: OWNER_EMAIL + OWNER_PASSWORD (Vercel secrets). Only that one
  // email can use it, it always signs in as an owner, and it locks after repeated failures.
  if (ownerPasswordEnabled()) {
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
          if (!sameString(email, ownerEmail) || !sameString(password, env().OWNER_PASSWORD!)) {
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
