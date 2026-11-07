"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { markRefundProcessedAction, orderActionAction } from "@/actions/admin/order.actions";
import { Button } from "@/components/ui/button";
import type { OrderActionInput } from "@/lib/validations/admin";
import { Field, FormMessage, TextArea, TextInput } from "./form";

type Action = Exclude<OrderActionInput["action"], "note" | "ship_stage">;
type Stage = { id: string; label: string; message: string; done: boolean; at?: string };
type Courier = { name: string; trackingUrl: string };

const COPY: Record<Action, { label: string; variant: "primary" | "secondary" | "accent"; help: string }> = {
  approve: { label: "Approve order", variant: "primary", help: "Confirms the order and emails the customer." },
  reject: { label: "Reject & refund", variant: "secondary", help: "Cancels the order, puts stock back and refunds the payment." },
  start_production: { label: "Start production", variant: "secondary", help: "For made-to-order pieces. The customer sees “Being made”." },
  dispatch: { label: "Mark dispatched", variant: "primary", help: "Adds tracking and emails the customer." },
  deliver: { label: "Mark delivered", variant: "primary", help: "Opens returns and reviews for the customer." },
  cancel: { label: "Cancel order", variant: "secondary", help: "Puts stock back and refunds the payment if it was paid." },
};

/** Owner actions for one order. Only the moves allowed from the current status are shown. */
export function OrderActions({
  orderId,
  actions,
  refundPending,
  couriers = [],
  allowOther = true,
  stages = [],
}: {
  orderId: string;
  actions: Action[];
  refundPending: boolean;
  couriers?: Courier[];
  allowOther?: boolean;
  /** Courier stages after dispatch (Orders → Order steps). */
  stages?: Stage[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState<Action | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);
  const [fields, setFields] = useState({ reason: "", note: "", courier: couriers[0]?.name ?? "", trackingNumber: "", trackingUrl: "" });
  const [stageNote, setStageNote] = useState("");
  const listed = couriers.some((c) => c.name === fields.courier);
  const [otherCourier, setOtherCourier] = useState(couriers.length === 0);
  const autoLink = !otherCourier && Boolean(couriers.find((c) => c.name === fields.courier)?.trackingUrl);
  const [note, setNote] = useState("");

  const run = (input: OrderActionInput, done = "Saved.") =>
    start(async () => {
      setMsg(null);
      const res = await orderActionAction(orderId, input);
      if (!res.ok) return setMsg({ ok: false, message: res.error });
      setMsg({ ok: true, message: done });
      setOpen(null);
      setNote("");
      router.refresh();
    });

  const submit = (a: Action) => {
    switch (a) {
      case "approve":
        return run({ action: "approve", note: fields.note || undefined }, "Order approved.");
      case "start_production":
        return run({ action: "start_production", note: fields.note || undefined }, "Marked as being made.");
      case "deliver":
        return run({ action: "deliver" }, "Marked as delivered.");
      case "dispatch":
        return run({ action: "dispatch", courier: fields.courier, trackingNumber: fields.trackingNumber, trackingUrl: fields.trackingUrl }, "Marked as dispatched.");
      case "reject":
        return run({ action: "reject", reason: fields.reason }, "Order rejected.");
      case "cancel":
        return run({ action: "cancel", reason: fields.reason }, "Order cancelled.");
    }
  };

  const needsForm = (a: Action) => a === "dispatch" || a === "reject" || a === "cancel";
  const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFields((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      {actions.length === 0 && <p className="text-sm text-muted">No further status changes for this order.</p>}

      {stages.length > 0 && (
        <div className="space-y-2 rounded-md border border-line p-3">
          <p className="text-sm font-medium">Courier progress</p>
          <ol className="space-y-1.5">
            {stages.map((st) => (
              <li key={st.id} className="flex items-center justify-between gap-3 text-sm">
                <span className={st.done ? "" : "text-muted"}>{st.done ? "✓ " : ""}{st.label}{st.at ? <span className="ml-1 text-xs text-muted">· {new Date(st.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span> : null}</span>
                {!st.done && (
                  <Button size="sm" variant="secondary" disabled={pending} onClick={() => run({ action: "ship_stage", stageId: st.id, note: stageNote || undefined }, `Marked “${st.label}”.`)}>
                    Mark
                  </Button>
                )}
              </li>
            ))}
          </ol>
          <TextInput aria-label="Note for the customer (optional)" placeholder="Note for the customer (optional)" value={stageNote} onChange={(e) => setStageNote(e.target.value)} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Button
            key={a}
            variant={open === a ? "primary" : COPY[a].variant}
            size="sm"
            disabled={pending}
            onClick={() => (needsForm(a) ? setOpen(open === a ? null : a) : submit(a))}
            aria-expanded={needsForm(a) ? open === a : undefined}
          >
            {COPY[a].label}
          </Button>
        ))}
      </div>

      {open && (
        <form
          className="space-y-4 rounded-md border border-line bg-surface/50 p-4 animate-in fade-in-0 slide-in-from-top-1"
          onSubmit={(e) => {
            e.preventDefault();
            submit(open);
          }}
        >
          <p className="text-sm text-muted">{COPY[open].help}</p>
          {open === "dispatch" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Courier" htmlFor="courier">
                {couriers.length > 0 && !otherCourier ? (
                  <select
                    id="courier"
                    className="h-11 w-full rounded-md border border-line bg-paper px-3 text-sm"
                    value={listed ? fields.courier : ""}
                    onChange={(e) => {
                      if (e.target.value === "__other") {
                        setOtherCourier(true);
                        setFields((f) => ({ ...f, courier: "" }));
                      } else setFields((f) => ({ ...f, courier: e.target.value }));
                    }}
                  >
                    {couriers.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                    {allowOther && <option value="__other">Other…</option>}
                  </select>
                ) : (
                  <TextInput id="courier" required value={fields.courier} onChange={set("courier")} placeholder="e.g. Delhivery" />
                )}
              </Field>
              <Field label="Tracking number" htmlFor="trk"><TextInput id="trk" required value={fields.trackingNumber} onChange={set("trackingNumber")} /></Field>
              <Field label={autoLink ? "Tracking link (filled in automatically)" : "Tracking link (optional)"} htmlFor="trkurl" className="sm:col-span-2" hint={autoLink ? "Leave empty to use this courier's tracking link." : undefined}>
                <TextInput id="trkurl" type="url" value={fields.trackingUrl} onChange={set("trackingUrl")} placeholder="https://" />
              </Field>
            </div>
          ) : (
            <Field label="Reason (shown to the customer)" htmlFor="reason">
              <TextArea id="reason" required minLength={3} value={fields.reason} onChange={set("reason")} className="min-h-20" />
            </Field>
          )}
          <div className="flex gap-2">
            <Button type="submit" size="sm" variant={open === "dispatch" ? "primary" : "accent"} disabled={pending}>
              {pending ? "Saving…" : COPY[open].label}
            </Button>
            <Button type="button" size="sm" variant="quiet" onClick={() => setOpen(null)}>Cancel</Button>
          </div>
        </form>
      )}

      {refundPending && (
        <div className="rounded-md border border-mto/30 bg-mto/10 p-4 text-sm text-mto">
          <p>A refund still needs to be issued for this order. After refunding in the Razorpay dashboard (or by bank transfer), mark it done here.</p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-3"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await markRefundProcessedAction(orderId);
                setMsg(res.ok ? { ok: true, message: "Refund marked as processed." } : { ok: false, message: res.error });
                router.refresh();
              })
            }
          >
            Mark refund as processed
          </Button>
        </div>
      )}

      <form
        className="space-y-2 border-t border-line pt-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (note.trim()) run({ action: "note", note }, "Note added.");
        }}
      >
        <Field label="Internal note" htmlFor="note" hint="Visible to you only, in the timeline.">
          <TextArea id="note" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-16" />
        </Field>
        <Button type="submit" size="sm" variant="secondary" disabled={pending || !note.trim()}>Add note</Button>
      </form>

      <FormMessage result={msg} />
    </div>
  );
}
