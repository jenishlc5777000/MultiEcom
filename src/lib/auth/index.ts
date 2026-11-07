import "server-only";
import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { connectDB, getMongoClient } from "@/lib/db/connect";
import { User, type UserRole } from "@/models/User";
import { buildProviders } from "./providers";

/** Lazy config: env and DB are only touched when a request needs auth. */
export const { handlers, auth, signIn, signOut } = NextAuth(async () => ({
  adapter: MongoDBAdapter(getMongoClient),
  providers: await buildProviders(),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login", verifyRequest: "/login/verify", error: "/login" },
  events: {
    async signIn({ user }) {
      if (!user.id) return;
      // Dynamic import avoids a static cycle (cart.service reads the session).
      const { mergeGuestCartInto } = await import("@/services/cart.service");
      await mergeGuestCartInto(user.id).catch((e) => console.error("[auth] cart merge", e));
    },
  },
  callbacks: {
    /** Blocked accounts can't start a session (any provider). */
    async signIn({ user }) {
      if (!user.email) return true;
      await connectDB();
      const existing = await User.findOne({ email: user.email.toLowerCase() }).select("isBlocked").lean();
      return existing?.isBlocked ? "/login?error=AccessDenied" : true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = ((user as { role?: UserRole }).role ?? "customer") as UserRole;
      }
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
