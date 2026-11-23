"use client";

import { useActionState, useState } from "react";
import { customerRegisterAction, customerSignInAction, demoSignInAction, ownerSignInAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Customer email + password: "Sign in" and "Create account" tabs. */
export function CustomerAuthForm({ callbackUrl }: { callbackUrl: string }) {
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [signInState, signInAction, signingIn] = useActionState(customerSignInAction, undefined);
  const [registerState, registerAction, registering] = useActionState(customerRegisterAction, undefined);
  const register = mode === "register";
  const state = register ? registerState : signInState;
  const pending = register ? registering : signingIn;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 rounded-lg bg-surface p-1 text-sm font-medium" role="tablist" aria-label="Sign in or create an account">
        {([
          ["signin", "Sign in"],
          ["register", "Create account"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => setMode(value)}
            className={cn("rounded-md px-3 py-2 transition-colors", mode === value ? "bg-canvas text-ink shadow-sm" : "text-ink/70 hover:text-ink")}
          >
            {label}
          </button>
        ))}
      </div>

      <form key={mode} action={register ? registerAction : signInAction} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        {register && (
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" autoComplete="name" required maxLength={80} />
          </div>
        )}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required defaultValue={state?.email} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={register ? "new-password" : "current-password"}
            minLength={register ? 8 : undefined}
            maxLength={128}
            required
            aria-invalid={Boolean(state?.error)}
          />
          {register && <p className="mt-1 text-xs text-muted">At least 8 characters.</p>}
          <FieldError>{state?.error}</FieldError>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? (register ? "Creating account…" : "Signing in…") : register ? "Create account" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}

/** Admin sign-in: owner email + password. */
export function OwnerLoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState(ownerSignInAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div>
        <Label htmlFor="owner-email">Email</Label>
        <Input id="owner-email" name="email" type="email" autoComplete="username" required defaultValue={state?.email} />
      </div>
      <div>
        <Label htmlFor="owner-password">Password</Label>
        <Input id="owner-password" name="password" type="password" autoComplete="current-password" required aria-invalid={Boolean(state?.error)} />
        <FieldError>{state?.error}</FieldError>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in to admin"}
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
