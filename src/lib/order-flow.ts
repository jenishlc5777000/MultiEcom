import { z } from "zod";
import type { OrderStatus } from "./constants";

/**
 * Admin → Orders → Order steps. How an order moves after payment and what the
 * customer sees at each step. Stored on the settings document (`orderFlow`).
 *
 *   paid → [approval, or automatic] → confirmed → [being made] → dispatched
 *        → [courier stages: picked up, in transit, out for delivery…] → delivered
 */

const text = (max: number, def: string) => z.string().trim().max(max).default(def);

/** Statuses whose name and message the owner can change. */
export const FLOW_STEPS = ["AWAITING_APPROVAL", "CONFIRMED", "IN_PRODUCTION", "DISPATCHED", "DELIVERED", "CANCELLED"] as const;
export type FlowStep = (typeof FLOW_STEPS)[number];

const step = (label: string, message: string) =>
  z
    .object({
      /** Name of the step on the customer's order page and in emails. */
      label: text(40, label),
      /** Text shown to the customer while the order is at this step (and in the email). */
      message: text(300, message),
      /** Email / SMS the customer when the order reaches this step. */
      notify: z.boolean().default(true),
    })
    .default({});

const slug = z.string().trim().regex(/^[a-z0-9-]{1,30}$/);

export const courierSchema = z.object({
  name: z.string().trim().min(2).max(60),
  /** Tracking link with {tracking} where the tracking number goes. Empty = no link. */
  trackingUrl: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || /^https?:\/\/\S+$/.test(v.replace("{tracking}", "x")), "Use a full https:// link")
    .default(""),
});

export const shipStageSchema = z.object({
  id: slug,
  label: z.string().trim().min(2).max(40),
  message: z.string().trim().max(300).default(""),
  enabled: z.boolean().default(true),
});

export const AUTO_APPROVE_MODES = ["off", "in_stock", "all"] as const;
export const CUSTOMER_CANCEL = ["off", "before_approval", "before_dispatch"] as const;

export const orderFlowSchema = z.object({
  autoApprove: z
    .object({
      /** off = every paid order waits for you; in_stock = approve when every item is in stock; all = approve every paid order. */
      mode: z.enum(AUTO_APPROVE_MODES).default("off"),
      /** Orders above this total (rupees) still wait for you. 0 = no limit. */
      maxTotal: z.coerce.number().min(0).max(10_000_000).default(0),
    })
    .default({}),
  /** "Being made" step on the customer's progress bar. */
  production: z
    .object({
      /** auto = only for orders with made-to-order pieces; always; never (the step is hidden and the action removed). */
      show: z.enum(["auto", "always", "never"]).default("auto"),
    })
    .default({}),
  steps: z
    .object({
      AWAITING_APPROVAL: step("Order placed", "Your payment is received. The studio will confirm your order shortly."),
      CONFIRMED: step("Confirmed", "We've confirmed your order and it's being prepared."),
      IN_PRODUCTION: step("Being made", "Your piece is now being made in the studio."),
      DISPATCHED: step("Shipped", "Your order has been handed to the courier."),
      DELIVERED: step("Delivered", "Your order has been delivered. We hope you love it."),
      CANCELLED: step("Cancelled", "Your order has been cancelled. If you paid, a refund has been started to your original payment method."),
    })
    .default({}),
  shipping: z
    .object({
      /** Couriers offered in the "Mark dispatched" form. */
      couriers: z
        .array(courierSchema)
        .max(20)
        .default([
          { name: "Delhivery", trackingUrl: "https://www.delhivery.com/track/package/{tracking}" },
          { name: "Blue Dart", trackingUrl: "https://www.bluedart.com/web/guest/trackdartresult?trackFor=0&trackNo={tracking}" },
          { name: "India Post", trackingUrl: "https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx" },
          { name: "DTDC", trackingUrl: "https://www.dtdc.in/tracking.asp" },
        ]),
      /** Allow typing a courier that isn't in the list. */
      allowOther: z.boolean().default(true),
      /** Steps after dispatch that you mark as the courier updates you. */
      stages: z
        .array(shipStageSchema)
        .max(10)
        .default([
          { id: "picked-up", label: "Picked up", message: "The courier has collected your parcel.", enabled: true },
          { id: "in-transit", label: "In transit", message: "Your parcel is on its way.", enabled: true },
          { id: "out-for-delivery", label: "Out for delivery", message: "Your parcel will arrive today.", enabled: true },
        ]),
      /** Show the courier stages on the customer's progress bar. */
      showStages: z.boolean().default(true),
      /** Email / SMS the customer at each courier stage. */
      notifyStages: z.boolean().default(true),
    })
    .default({}),
  customer: z
    .object({
      /** Customers may cancel their own order (and get refunded) until this point. */
      cancel: z.enum(CUSTOMER_CANCEL).default("off"),
      /** Show the history list on the customer's order page. */
      showHistory: z.boolean().default(true),
      /** Show the owner's notes (approval note, tracking note) in that history. */
      showNotes: z.boolean().default(true),
    })
    .default({}),
});
export type OrderFlow = z.infer<typeof orderFlowSchema>;
export type Courier = z.infer<typeof courierSchema>;
export type ShipStage = z.infer<typeof shipStageSchema>;

export function parseOrderFlow(raw: unknown): OrderFlow {
  const r = orderFlowSchema.safeParse(raw ?? {});
  return r.success ? r.data : orderFlowSchema.parse({});
}

/** Tracking link for a courier ({tracking} is replaced). */
export function trackingLink(flow: OrderFlow, courier: string, trackingNumber: string) {
  const c = flow.shipping.couriers.find((x) => x.name.toLowerCase() === courier.trim().toLowerCase());
  if (!c?.trackingUrl) return "";
  return c.trackingUrl.replaceAll("{tracking}", encodeURIComponent(trackingNumber.trim()));
}

/** Whether a paid order can skip the owner's approval. */
export function canAutoApprove(
  flow: OrderFlow,
  order: { total: number; stockReleased?: boolean | null; notes?: string | null; items: { stockReserved?: boolean | null; availability: string }[] },
) {
  const { mode, maxTotal } = flow.autoApprove;
  if (mode === "off") return false;
  if (order.stockReleased || order.notes) return false; // flagged: paid late or amount mismatch
  if (maxTotal > 0 && order.total > maxTotal * 100) return false;
  if (mode === "all") return true;
  return order.items.every((i) => i.stockReserved !== false && i.availability !== "MADE_TO_ORDER");
}

export function showsProduction(flow: OrderFlow, order: { status: string; items: { availability: string }[] }) {
  if (order.status === "IN_PRODUCTION") return true;
  if (flow.production.show === "never") return false;
  if (flow.production.show === "always") return true;
  return order.items.some((i) => i.availability === "MADE_TO_ORDER");
}

export type ProgressStep = { key: string; label: string; done: boolean; current: boolean; at?: string };

/** The customer's progress bar for one order. */
export function customerProgress(
  flow: OrderFlow,
  order: { status: string; items: { availability: string }[]; timeline?: { status?: string | null; at: Date | string }[] | null; dispatch?: { stages?: { id?: string | null; at: Date | string }[] | null } | null },
): ProgressStep[] {
  const status = order.status as OrderStatus;
  const reachedAt = (s: string) => order.timeline?.find((t) => t.status === s)?.at;
  const keys: { key: string; label: string; status?: OrderStatus }[] = [
    { key: "AWAITING_APPROVAL", label: flow.steps.AWAITING_APPROVAL.label, status: "AWAITING_APPROVAL" },
    { key: "CONFIRMED", label: flow.steps.CONFIRMED.label, status: "CONFIRMED" },
    ...(showsProduction(flow, order) ? [{ key: "IN_PRODUCTION", label: flow.steps.IN_PRODUCTION.label, status: "IN_PRODUCTION" as const }] : []),
    { key: "DISPATCHED", label: flow.steps.DISPATCHED.label, status: "DISPATCHED" },
  ];
  const done = new Map((order.dispatch?.stages ?? []).map((s) => [s.id ?? "", s.at]));
  if (flow.shipping.showStages) {
    for (const s of flow.shipping.stages) if (s.enabled || done.has(s.id)) keys.push({ key: `stage:${s.id}`, label: s.label });
  }
  keys.push({ key: "DELIVERED", label: flow.steps.DELIVERED.label, status: "DELIVERED" });

  // Index of the furthest step reached.
  let current = keys.findIndex((k) => k.status === status);
  if (status === "DISPATCHED") {
    keys.forEach((k, i) => {
      if (k.key.startsWith("stage:") && done.has(k.key.slice(6))) current = Math.max(current, i);
    });
  }
  return keys.map((k, i) => {
    const at = k.status ? reachedAt(k.status) : done.get(k.key.slice(6));
    return { key: k.key, label: k.label, done: i <= current, current: i === current, at: at ? new Date(at).toISOString() : undefined };
  });
}

/** Customer-facing name of a status (falls back to the built-in label). */
export function stepLabel(flow: OrderFlow, status: string, fallback: string) {
  return (FLOW_STEPS as readonly string[]).includes(status) ? flow.steps[status as FlowStep].label || fallback : fallback;
}

/** Whether the customer may cancel an order at this status. */
export function customerCanCancel(flow: OrderFlow, status: string, paymentStatus: string) {
  if (paymentStatus !== "PAID") return false;
  if (flow.customer.cancel === "before_approval") return status === "AWAITING_APPROVAL";
  if (flow.customer.cancel === "before_dispatch") return status === "AWAITING_APPROVAL" || status === "CONFIRMED";
  return false;
}
