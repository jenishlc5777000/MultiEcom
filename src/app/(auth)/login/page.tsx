import { redirect } from "next/navigation";
import { googleSignInAction } from "@/actions/auth.actions";
import { CustomerAuthForm, DemoLoginForm, OwnerLoginForm } from "@/components/auth/auth-forms";
import { demoLoginEnabled } from "@/config/env";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/guards";
import { safeCallbackUrl } from "@/lib/safe-redirect";
import { getIntegrations } from "@/services/integrations.service";
import { passwordResetAvailable } from "@/services/password.service";

export const metadata = { title: "Sign in" };

const errors: Record<string, string> = {
  CredentialsSignin: "Wrong email or password.",
  AccessDenied: "This account can't sign in. Please contact the store.",
  OAuthAccountNotLinked: "This email is already linked to another sign-in method.",
  OwnerGoogle: "Admin accounts can't use Google sign-in. Sign in with your admin email and password.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string; reset?: string }> }) {
  const { callbackUrl: raw, error, reset } = await searchParams;
  const callbackUrl = safeCallbackUrl(raw);
  if (await getCurrentUser()) redirect(callbackUrl);

  const errorBox = error ? (
    <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
      {errors[error] ?? "Sign-in failed. Please try again."}
    </p>
  ) : reset ? (
    <p role="status" className="rounded-lg bg-ready/10 p-3 text-sm text-ready">Password changed. Sign in with your new password.</p>
  ) : null;

  // Admin sign-in (reached from /admin): owner email + password only, no Google.
  const adminLogin = callbackUrl === "/admin" || callbackUrl.startsWith("/admin/");
  if (adminLogin) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl">Admin sign in</h1>
          <p className="text-sm text-ink/80">Sign in with your admin email and password.</p>
        </div>
        {errorBox}
        <OwnerLoginForm callbackUrl={callbackUrl} />
        {demoLoginEnabled() && <DemoLoginForm callbackUrl={callbackUrl} />}
      </div>
    );
  }

  // Customers: Google and/or email + password, from Admin → Integrations → Customer login.
  const { google, login } = await getIntegrations();
  const googleEnabled = Boolean(google.clientId && google.clientSecret) && login.methods !== "email";
  // Email + password stays available if Google isn't set up yet, so nobody is locked out.
  const passwordEnabled = login.methods !== "google" || !googleEnabled;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl">Sign in</h1>
        <p className="text-sm text-ink/80">
          {passwordEnabled && googleEnabled
            ? "Continue with Google, or use your email and password."
            : googleEnabled
              ? "Sign in with your Google account."
              : "Sign in with your email and password, or create an account."}
        </p>
      </div>
      {errorBox}
      {googleEnabled && (
        <form action={googleSignInAction}>
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <Button type="submit" variant="outline" size="lg" className="w-full bg-canvas">
            Continue with Google
          </Button>
        </form>
      )}
      {passwordEnabled && googleEnabled && (
        <div className="flex items-center gap-3 text-sm text-ink/70" aria-hidden>
          <span className="h-px flex-1 bg-surface-strong" /> or <span className="h-px flex-1 bg-surface-strong" />
        </div>
      )}
      {passwordEnabled && <CustomerAuthForm callbackUrl={callbackUrl} forgotPassword={await passwordResetAvailable()} />}
      {demoLoginEnabled() && <DemoLoginForm callbackUrl={callbackUrl} />}
    </div>
  );
}
