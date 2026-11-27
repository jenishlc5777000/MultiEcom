"use client";

import Link from "next/link";
import { useActionState } from "react";
import { changePasswordAction, requestPasswordResetAction, resetPasswordAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, undefined);
  if (state?.ok) {
    return (
      <div className="space-y-4">
        <p role="status" className="rounded-lg bg-ready/10 p-3 text-sm text-ready">{state.ok}</p>
        <Link href="/login" className="text-sm underline underline-offset-4">Back to sign in</Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required defaultValue={state?.email} aria-invalid={Boolean(state?.error)} />
        <FieldError>{state?.error}</FieldError>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Email me a reset link"}
      </Button>
      <Link href="/login" className="block text-center text-sm text-muted underline-offset-4 hover:underline">Back to sign in</Link>
    </form>
  );
}

export function ResetPasswordForm({ email, token }: { email: string; token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />
      <p className="text-sm text-ink/80">For <strong>{email}</strong></p>
      <div>
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
        <p className="mt-1 text-xs text-muted">At least 8 characters.</p>
      </div>
      <div>
        <Label htmlFor="confirm">Type it again</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} maxLength={128} required aria-invalid={Boolean(state?.error)} />
        <FieldError>{state?.error}</FieldError>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}

/** Profile: change the password, or set one for an account made with Google. */
export function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);
  return (
    <form action={action} className="max-w-sm space-y-4">
      {hasPassword && (
        <div>
          <Label htmlFor="current">Current password</Label>
          <Input id="current" name="current" type="password" autoComplete="current-password" required />
        </div>
      )}
      <div>
        <Label htmlFor="new-password">{hasPassword ? "New password" : "Password"}</Label>
        <Input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
        <p className="mt-1 text-xs text-muted">At least 8 characters.</p>
      </div>
      <div>
        <Label htmlFor="confirm-password">Type it again</Label>
        <Input id="confirm-password" name="confirm" type="password" autoComplete="new-password" minLength={8} maxLength={128} required aria-invalid={Boolean(state?.error)} />
        <FieldError>{state?.error}</FieldError>
      </div>
      {state?.ok && <p role="status" className="text-sm text-ready">{state.ok}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : hasPassword ? "Change password" : "Set password"}</Button>
    </form>
  );
}
