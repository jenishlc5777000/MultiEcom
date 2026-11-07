"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { requestReturnAction } from "@/actions/account.actions";
import { Button } from "@/components/ui/button";
import { RETURN_REASONS, RETURN_REASON_LABEL } from "@/lib/constants";

type Line = { id: string; name: string; qty: number };

export function ReturnRequestForm({ orderId, lines, deadline }: { orderId: string; lines: Line[]; deadline: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [reason, setReason] = useState<(typeof RETURN_REASONS)[number]>("DAMAGED");
  const [details, setDetails] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <div className="space-y-2">
        <Button variant="secondary" onClick={() => setOpen(true)}>Request a return</Button>
        {deadline && <p className="text-sm text-muted">Available until {new Date(deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}.</p>}
      </div>
    );
  }

  return (
    <form
      className="space-y-5 rounded-lg border border-line p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const items = Object.entries(qty).filter(([, n]) => n > 0).map(([orderItem, n]) => ({ orderItem, qty: n }));
        start(async () => {
          setError(null);
          const res = await requestReturnAction({ orderId, reason, details, items });
          if (!res.ok) return setError(res.error);
          router.refresh();
        });
      }}
    >
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">Which items?</legend>
        {lines.map((l) => (
          <label key={l.id} className="flex items-center justify-between gap-4 rounded-md bg-surface/60 px-3 py-2 text-sm">
            <span>{l.name}</span>
            <select
              aria-label={`Quantity to return of ${l.name}`}
              value={qty[l.id] ?? 0}
              onChange={(e) => setQty((q) => ({ ...q, [l.id]: Number(e.target.value) }))}
              className="min-h-touch rounded-md border border-line bg-paper px-2"
            >
              {Array.from({ length: l.qty + 1 }, (_, n) => <option key={n} value={n}>{n === 0 ? "None" : n}</option>)}
            </select>
          </label>
        ))}
      </fieldset>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Reason</span>
        <select value={reason} onChange={(e) => setReason(e.target.value as typeof reason)} className="min-h-touch w-full rounded-md border border-line bg-paper px-3">
          {RETURN_REASONS.map((r) => <option key={r} value={r}>{RETURN_REASON_LABEL[r]}</option>)}
        </select>
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Tell us what happened</span>
        <textarea required minLength={10} rows={4} value={details} onChange={(e) => setDetails(e.target.value)} className="w-full rounded-md border border-line bg-paper p-3" />
        <span className="block text-xs text-muted">For damaged items, we&apos;ll ask for photos by email.</span>
      </label>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>{pending ? "Sending…" : "Send request"}</Button>
        <Button type="button" variant="quiet" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
