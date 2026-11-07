"use client";

import { useActionState } from "react";
import { demoSignInAction, ownerSignInAction, requestOtpAction, verifyOtpAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";

export function OtpRequestForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState(requestOtpAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required aria-invalid={Boolean(state?.error)} />
        <FieldError>{state?.error}</FieldError>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Email me a code"}
      </Button>
    </form>
  );
}

export function DemoLoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState(demoSignInAction, undefined);
  return (
    <form action={action} className="space-y-3 rounded-lg border border-dashed border-ink/30 p-4">
      <p className="text-sm font-semibold text-ink">Demo login (development only)</p>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div>
        <Label htmlFor="demo-email">Email</Label>
        <Input id="demo-email" name="email" type="email" autoComplete="username" required />
      </div>
      <div>
        <Label htmlFor="demo-password">Password</Label>
        <Input id="demo-password" name="password" type="password" autoComplete="current-password" required />
        <FieldError>{state?.error}</FieldError>
      </div>
      <Button type="submit" variant="primary" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in with demo account"}
      </Button>
    </form>
  );
}

/** Password sign-in for the store owner (only shown when OWNER_EMAIL / OWNER_PASSWORD are set). */
export function OwnerLoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState(ownerSignInAction, undefined);
  return (
    <details className="group rounded-lg border border-line p-4" open={Boolean(state?.error)}>
      <summary className="cursor-pointer text-sm font-semibold text-ink">Store owner? Sign in with password</summary>
      <form action={action} className="mt-4 space-y-3">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div>
          <Label htmlFor="owner-email">Owner email</Label>
          <Input id="owner-email" name="email" type="email" autoComplete="username" required />
        </div>
        <div>
          <Label htmlFor="owner-password">Password</Label>
          <Input id="owner-password" name="password" type="password" autoComplete="current-password" required />
          <FieldError>{state?.error}</FieldError>
        </div>
        <Button type="submit" variant="primary" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in as owner"}
        </Button>
      </form>
    </details>
  );
}

export function OtpVerifyForm({ email, callbackUrl, initialError }: { email: string; callbackUrl: string; initialError?: string }) {
  const [state, action, pending] = useActionState(verifyOtpAction, initialError ? { error: initialError } : undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div>
        <Label htmlFor="code">6-digit code</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          autoFocus
          className="text-center text-2xl tracking-[0.5em]"
          aria-invalid={Boolean(state?.error)}
        />
        <FieldError>{state?.error}</FieldError>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Checking…" : "Sign in"}
      </Button>
    </form>
  );
}
