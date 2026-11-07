"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelMyOrderAction } from "@/actions/account.actions";
import { Button } from "@/components/ui/button";

/** Customer self-cancel (shown only when Orders → Order steps allows it). */
export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  if (!open) return <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>Cancel order</Button>;
  return (
    <form
      className="space-y-3 rounded-lg border border-line p-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await cancelMyOrderAction({ orderId, reason });
          if (!r.ok) return setError(r.error);
          setOpen(false);
          router.refresh();
        });
      }}
    >
      <label htmlFor="cancel-reason" className="block text-sm font-medium">Why are you cancelling?</label>
      <textarea id="cancel-reason" required minLength={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-20 w-full rounded-md border border-line bg-paper p-3 text-sm" />
      <p className="text-xs text-muted">Your payment will be refunded to the original payment method.</p>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Cancelling…" : "Cancel my order"}</Button>
        <Button type="button" size="sm" variant="quiet" onClick={() => setOpen(false)}>Keep my order</Button>
      </div>
    </form>
  );
}
