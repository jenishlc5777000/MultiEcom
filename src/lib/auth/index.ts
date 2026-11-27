import "server-only";
import NextAuth from "next-auth";
import { Types } from "mongoose";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { connectDB, getMongoClient } from "@/lib/db/connect";
import { User, type UserRole } from "@/models/User";
import { buildProviders } from "./providers";

/** Every sign-in (customer or owner) lasts 24 hours, then the person must sign in again. */
const SESSION_MAX_AGE = 24 * 60 * 60;

/** Lazy config: env and DB are only touched when a request needs auth. */
export const { handlers, auth, signIn, signOut } = NextAuth(async () => ({
  adapter: MongoDBAdapter(getMongoClient),
  providers: await buildProviders(),
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE },
  pages: { signIn: "/login", error: "/login" },
  events: {
    /** Accounts made by Google sign-in come from the adapter, which doesn't set timestamps. */
    async createUser({ user }) {
      if (!user.id) return;
      await connectDB();
      const now = new Date();
      await User.collection.updateOne({ _id: new Types.ObjectId(user.id), createdAt: { $exists: false } }, { $set: { createdAt: now, updatedAt: now } });
    },
    async signIn({ user }) {
      if (!user.id) return;
      // Dynamic import avoids a static cycle (cart.service reads the session).
      const { mergeGuestCartInto } = await import("@/services/cart.service");
      await mergeGuestCartInto(user.id).catch((e) => console.error("[auth] cart merge", e));
    },
  },
  callbacks: {
    /** Blocked accounts can't start a session (any provider). Google sign-in is for customers only. */
    async signIn({ user, account }) {
      if (!user.email) return true;
      await connectDB();
      const existing = await User.findOne({ email: user.email.toLowerCase() }).select("isBlocked role emailVerified").lean();
      if (existing?.isBlocked) return "/login?error=AccessDenied";
      if (account?.provider === "google") {
        if (existing?.role === "owner") return "/login?error=OwnerGoogle&callbackUrl=%2Fadmin";
        // Google proves who owns the email. A password set on an unverified sign-up
        // (possibly by someone else) is removed so it can't reach this account.
        if (existing && !existing.emailVerified) {
          await User.updateOne({ _id: existing._id }, { $unset: { passwordHash: 1 }, $set: { emailVerified: new Date() } });
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = ((user as { role?: UserRole }).role ?? "customer") as UserRole;
        token.sessionStartedAt = Date.now();
      }
      // Absolute limit: activity doesn't extend the session past 24 hours from sign-in.
      // Older tokens without a start time fall back to their issue time.
      const startedAt = typeof token.sessionStartedAt === "number" ? token.sessionStartedAt : typeof token.iat === "number" ? token.iat * 1000 : Date.now();
      token.sessionStartedAt = startedAt;
      if (Date.now() - startedAt >= SESSION_MAX_AGE * 1000) return null;
      // Call `update()` from the client after a role change to refresh the token.
      if (trigger === "update" && token.sub) {
        await connectDB();
        const fresh = await User.findById(token.sub).select("role").lean();
        token.role = (fresh?.role ?? "customer") as UserRole;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.role = (token.role as UserRole | undefined) ?? "customer";
      return session;
    },
  },
}));
