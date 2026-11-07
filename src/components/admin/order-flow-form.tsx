"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveOrderFlowAction } from "@/actions/admin/order-flow.actions";
import { Button } from "@/components/ui/button";
import { FLOW_STEPS, type FlowStep, type OrderFlow } from "@/lib/order-flow";
import { Choice, Panel, SwitchRow } from "./appearance/shared";
import { Field, FormMessage, TextArea, TextInput } from "./form";

const STEP_HELP: Record<FlowStep, string> = {
  AWAITING_APPROVAL: "Paid, waiting for your approval (skipped when approved automatically).",
  CONFIRMED: "Approved, being prepared.",
  IN_PRODUCTION: "Made-to-order pieces being made.",
  DISPATCHED: "Handed to the courier.",
  DELIVERED: "Delivered. Returns and reviews open.",
  CANCELLED: "Cancelled or rejected.",
};

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "step";

/** Admin → Orders → Order steps. */
export function OrderFlowForm({ initial }: { initial: OrderFlow }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);
  const dirty = JSON.stringify(v) !== JSON.stringify(initial);

  const patch = <K extends keyof OrderFlow>(k: K, p: Partial<OrderFlow[K]>) => setV((x) => ({ ...x, [k]: { ...x[k], ...p } }));
  const setStep = (k: FlowStep, p: Partial<OrderFlow["steps"][FlowStep]>) => setV((x) => ({ ...x, steps: { ...x.steps, [k]: { ...x.steps[k], ...p } } }));
  const couriers = v.shipping.couriers;
  const stages = v.shipping.stages;
  const setCouriers = (c: typeof couriers) => patch("shipping", { couriers: c });
  const setStages = (s: typeof stages) => patch("shipping", { stages: s });
  const move = <T,>(list: T[], i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return list;
    const next = [...list];
    [next[i], next[j]] = [next[j]!, next[i]!];
    return next;
  };

  const save = () =>
    start(async () => {
      setMsg(null);
      const r = await saveOrderFlowAction(v);
      setMsg(r.ok ? { ok: true, message: "Order steps saved." } : { ok: false, message: r.error });
      if (r.ok) router.refresh();
    });

  return (
    <div className="space-y-6 pb-24">
      <Panel title="Approval" description="Paid orders normally wait for you on the Approvals page. Turn on automatic approval to skip that.">
        <Choice
          label="Approve paid orders"
          value={v.autoApprove.mode}
          onChange={(mode) => patch("autoApprove", { mode })}
          options={[
            { value: "off", label: "I approve every order", hint: "Each paid order waits on Approvals" },
            { value: "in_stock", label: "Automatically when in stock", hint: "Every item in stock (no made-to-order pieces) → confirmed straight away" },
            { value: "all", label: "Automatically, always", hint: "Every paid order is confirmed straight away" },
          ]}
        />
        {v.autoApprove.mode !== "off" && (
          <Field label="Still ask me for orders above (₹)" htmlFor="max-total" hint="0 = no limit. Orders flagged by the system (paid late, amount mismatch) always wait for you.">
            <TextInput id="max-total" type="number" min={0} value={v.autoApprove.maxTotal} onChange={(e) => patch("autoApprove", { maxTotal: Number(e.target.value) || 0 })} className="max-w-48" />
          </Field>
        )}
      </Panel>

      <Panel title="“Being made” step" description="For made-to-order pieces.">
        <Choice
          label="Show this step"
          value={v.production.show}
          onChange={(show) => patch("production", { show })}
          options={[
            { value: "auto", label: "Only for made-to-order", hint: "Orders with a made-to-order piece" },
            { value: "always", label: "Always", hint: "Every order" },
            { value: "never", label: "Never", hint: "Hidden, and the “Start production” button is removed" },
          ]}
        />
      </Panel>

      <Panel title="Step names & messages" description="What the customer sees on their order page and in the email at each step. Turn off “Notify” to update the order quietly.">
        <div className="space-y-4">
          {FLOW_STEPS.map((k) => (
            <div key={k} className="grid gap-3 rounded-md border border-line p-4 md:grid-cols-[200px_1fr]">
              <div>
                <TextInput aria-label={`${k} name`} value={v.steps[k].label} maxLength={40} onChange={(e) => setStep(k, { label: e.target.value })} />
                <p className="mt-1.5 text-xs text-muted">{STEP_HELP[k]}</p>
              </div>
              <div className="space-y-2">
                <TextArea aria-label={`${k} message`} value={v.steps[k].message} maxLength={300} onChange={(e) => setStep(k, { message: e.target.value })} className="min-h-16" />
                {k !== "AWAITING_APPROVAL" && (
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={v.steps[k].notify} onChange={(e) => setStep(k, { notify: e.target.checked })} /> Notify the customer (email / SMS)
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Couriers" description="Offered in the “Mark dispatched” form. Put {tracking} in the link where the tracking number goes, and the customer gets a ready tracking link.">
        <ul className="space-y-2">
          {couriers.map((c, i) => (
            <li key={i} className="grid gap-2 sm:grid-cols-[180px_1fr_auto]">
              <TextInput aria-label="Courier name" placeholder="Courier name" value={c.name} onChange={(e) => setCouriers(couriers.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <TextInput aria-label="Tracking link" placeholder="https://courier.com/track/{tracking}" value={c.trackingUrl} onChange={(e) => setCouriers(couriers.map((x, j) => (j === i ? { ...x, trackingUrl: e.target.value } : x)))} />
              <Button type="button" size="sm" variant="quiet" aria-label={`Remove ${c.name}`} onClick={() => setCouriers(couriers.filter((_, j) => j !== i))}><Trash2 /></Button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-4">
          <Button type="button" size="sm" variant="secondary" disabled={couriers.length >= 20} onClick={() => setCouriers([...couriers, { name: "", trackingUrl: "" }])}><Plus /> Add courier</Button>
        </div>
        <SwitchRow label="Allow typing another courier" hint="Shows “Other…” in the dispatch form" checked={v.shipping.allowOther} onChange={(allowOther) => patch("shipping", { allowOther })} />
      </Panel>

      <Panel title="After dispatch: courier steps" description="Steps between “shipped” and “delivered”. Mark them on the order page as the courier updates you; the customer sees each one.">
        <ul className="space-y-2">
          {stages.map((s, i) => (
            <li key={i} className="grid gap-2 rounded-md border border-line p-3 md:grid-cols-[180px_1fr_auto]">
              <TextInput
                aria-label="Step name"
                placeholder="Step name"
                value={s.label}
                maxLength={40}
                onChange={(e) => setStages(stages.map((x, j) => (j === i ? { ...x, label: e.target.value, id: initial.shipping.stages.some((o) => o.id === x.id) ? x.id : slugify(e.target.value) } : x)))}
              />
              <TextInput aria-label="Message to the customer" placeholder="Message to the customer" value={s.message} maxLength={300} onChange={(e) => setStages(stages.map((x, j) => (j === i ? { ...x, message: e.target.value } : x)))} />
              <div className="flex items-center gap-1">
                <label className="mr-2 flex items-center gap-1.5 text-sm"><input type="checkbox" checked={s.enabled} onChange={(e) => setStages(stages.map((x, j) => (j === i ? { ...x, enabled: e.target.checked } : x)))} /> On</label>
                <Button type="button" size="sm" variant="quiet" aria-label="Move up" disabled={i === 0} onClick={() => setStages(move(stages, i, -1))}><ArrowUp /></Button>
                <Button type="button" size="sm" variant="quiet" aria-label="Move down" disabled={i === stages.length - 1} onClick={() => setStages(move(stages, i, 1))}><ArrowDown /></Button>
                <Button type="button" size="sm" variant="quiet" aria-label={`Remove ${s.label}`} onClick={() => setStages(stages.filter((_, j) => j !== i))}><Trash2 /></Button>
              </div>
            </li>
          ))}
        </ul>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={stages.length >= 10}
          onClick={() => {
            let id = "new-step", n = 2;
            while (stages.some((x) => x.id === id)) id = `new-step-${n++}`;
            setStages([...stages, { id, label: "New step", message: "", enabled: true }]);
          }}
        >
          <Plus /> Add step
        </Button>
        <div className="grid gap-2 sm:grid-cols-2">
          <SwitchRow label="Show these steps to the customer" hint="On their order progress bar" checked={v.shipping.showStages} onChange={(showStages) => patch("shipping", { showStages })} />
          <SwitchRow label="Notify the customer at each step" hint="Email / SMS" checked={v.shipping.notifyStages} onChange={(notifyStages) => patch("shipping", { notifyStages })} />
        </div>
      </Panel>

      <Panel title="Customer's order page">
        <Choice
          label="Customers can cancel their order"
          value={v.customer.cancel}
          onChange={(cancel) => patch("customer", { cancel })}
          options={[
            { value: "off", label: "No", hint: "They contact you instead" },
            { value: "before_approval", label: "Until you approve it", hint: "While it waits for approval" },
            { value: "before_dispatch", label: "Until it ships", hint: "Before you mark it dispatched" },
          ]}
        />
        <p className="text-xs text-muted">A cancelled order puts the stock back and refunds the payment, the same as cancelling it yourself.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <SwitchRow label="Show the order history" checked={v.customer.showHistory} onChange={(showHistory) => patch("customer", { showHistory })} />
          <SwitchRow label="Show your notes in the history" hint="Approval notes, courier notes" checked={v.customer.showNotes} onChange={(showNotes) => patch("customer", { showNotes })} />
        </div>
      </Panel>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur">
        <Button type="button" onClick={save} disabled={pending || !dirty}>{pending ? "Saving…" : "Save order steps"}</Button>
        {dirty && <Button type="button" variant="quiet" onClick={() => setV(initial)}>Undo changes</Button>}
        <FormMessage result={msg} />
      </div>
    </div>
  );
}
