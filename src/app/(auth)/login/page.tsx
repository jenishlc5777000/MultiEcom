import { redirect } from "next/navigation";
import { googleSignInAction } from "@/actions/auth.actions";
import { DemoLoginForm, OtpRequestForm, OwnerLoginForm } from "@/components/auth/otp-forms";
import { demoLoginEnabled, ownerPasswordEnabled } from "@/config/env";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/guards";
import { safeCallbackUrl } from "@/lib/safe-redirect";
import { getIntegrations } from "@/services/integrations.service";

export const metadata = { title: "Sign in" };

const errors: Record<string, string> = {
  Verification: "That code is wrong or has expired. Request a new one.",
  CredentialsSignin: "Wrong email or password.",
  AccessDenied: "This account can't sign in. Please contact the store.",
  OAuthAccountNotLinked: "This email is already linked to another sign-in method.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  const { callbackUrl: raw, error } = await searchParams;
  const callbackUrl = safeCallbackUrl(raw);
  if (await getCurrentUser()) redirect(callbackUrl);

  // Login methods from Admin → Integrations → Customer login.
  const { google, login } = await getIntegrations();
  const googleEnabled = Boolean(google.clientId && google.clientSecret) && login.methods !== "email";
  // Email codes stay available if Google isn't set up yet, so nobody is locked out.
  const emailEnabled = login.methods !== "google" || !googleEnabled;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl">Sign in</h1>
        <p className="text-sm text-ink/80">We&apos;ll email you a 6-digit code. No password needed.</p>
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
          {errors[error] ?? "Sign-in failed. Please try again."}
        </p>
      )}
      {emailEnabled && <OtpRequestForm callbackUrl={callbackUrl} />}
      {googleEnabled && (
        <>
          {emailEnabled && (
            <div className="flex items-center gap-3 text-sm text-ink/70" aria-hidden>
              <span className="h-px flex-1 bg-surface-strong" /> or <span className="h-px flex-1 bg-surface-strong" />
            </div>
          )}
          <form action={googleSignInAction}>
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <Button type="submit" variant="outline" size="lg" className="w-full bg-canvas">
              Continue with Google
            </Button>
          </form>
        </>
      )}
      {ownerPasswordEnabled() && <OwnerLoginForm callbackUrl={callbackUrl} />}
      {demoLoginEnabled() && <DemoLoginForm callbackUrl={callbackUrl} />}
    </div>
  );
}
