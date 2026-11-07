"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setUserBlockedAction, setUserRoleAction } from "@/actions/admin/people.actions";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Select, TextInput } from "./form";

/** Role and access controls for one user. The server refuses self-demotion and blocking owners. */
export function UserControls({ userId, role, isBlocked, isSelf }: { userId: string; role: "customer" | "owner"; isBlocked: boolean; isSelf: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);
  const [reason, setReason] = useState("");

  const act = (fn: () => ReturnType<typeof setUserRoleAction>, ok: string) =>
    start(async () => {
      const res = await fn();
      setMsg(res.ok ? { ok: true, message: ok } : { ok: false, message: res.error });
      if (res.ok) router.refresh();
    });

  return (
    <div className="space-y-6">
      <Field label="Role" htmlFor="role" hint={isSelf ? "You can't remove your own owner access." : "Owners can open this dashboard and manage everything."}>
        <Select
          id="role"
          value={role}
          disabled={pending || isSelf}
          onChange={(e) => act(() => setUserRoleAction({ userId, role: e.target.value }), "Role updated. It applies on their next page load.")}
        >
          <option value="customer">Customer</option>
          <option value="owner">Owner (admin)</option>
        </Select>
      </Field>

      <div className="space-y-3 border-t border-line pt-5">
        <p className="text-sm font-medium">Account access</p>
        {isBlocked ? (
          <>
            <p className="text-sm text-muted">This account is blocked. They can&apos;t sign in or check out.</p>
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => act(() => setUserBlockedAction({ userId, blocked: false }), "Account unblocked.")}>
              Unblock account
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">Blocking stops them signing in, using their account pages and checking out. Their past orders are kept.</p>
            <Field label="Reason (internal)" htmlFor="block-reason">
              <TextInput id="block-reason" value={reason} onChange={(e) => setReason(e.target.value)} disabled={isSelf || role === "owner"} />
            </Field>
            <Button
              size="sm"
              variant="secondary"
              className="border-danger/40 text-danger hover:border-danger hover:bg-danger hover:text-on-accent"
              disabled={pending || isSelf || role === "owner"}
              onClick={() => act(() => setUserBlockedAction({ userId, blocked: true, reason }), "Account blocked.")}
            >
              Block account
            </Button>
            {role === "owner" && !isSelf && <p className="text-xs text-muted">Change the role to Customer before blocking an owner.</p>}
          </>
        )}
      </div>
      <FormMessage result={msg} />
    </div>
  );
}
