import "server-only";
import { Resend } from "resend";
import { env } from "@/config/env";
import { siteConfig } from "@/config/site";
import type { OrderStatus } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import { getIntegrations } from "@/services/integrations.service";

let resend: { key: string; client: Resend } | undefined;

/**
 * Sends through Resend with the key from Admin → Integrations (or .env).
 * In development without a key the email is printed to the server console.
 */
async function send(to: string, subject: string, html: string, text: string, replyTo?: string) {
  const { email } = await getIntegrations();
  if (!email.apiKey) {
    if (env().NODE_ENV !== "production") {
      console.info(`\n[email:dev] to=${to}\n  subject: ${subject}\n  ${text}\n`);
      return;
    }
    throw new Error("Email is not configured. Add a Resend API key in Admin → Integrations.");
  }
  if (!resend || resend.key !== email.apiKey) resend = { key: email.apiKey, client: new Resend(email.apiKey) };
  const { error } = await resend.client.emails.send({ from: email.from, to, subject, html, text, ...(replyTo ? { replyTo } : {}) });
  if (error) throw new Error(`Email send failed: ${error.message}`);
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Plain-text email (contact form, test messages). The HTML version is the same text, escaped. */
export async function sendPlainEmail(to: string, subject: string, body: string, replyTo?: string) {
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1A1917;white-space:pre-wrap">${escape(body)}</div>`;
  await send(to, subject, html, body, replyTo);
}

export async function sendOtpEmail(to: string, code: string) {
  const html = `
    <div style="font-family:Georgia,serif;background:#FAF6EF;padding:32px;color:#1F2430">
      <h1 style="color:#0F2A5C;font-size:22px;margin:0 0 16px">${siteConfig.name}</h1>
      <p style="font-family:Arial,sans-serif">Your sign-in code is</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#0F2A5C">${code}</p>
      <p style="font-family:Arial,sans-serif;color:#6B6F7A">It expires in 10 minutes. If you didn't ask for it, ignore this email.</p>
    </div>`;
  await send(to, `${code} is your ${siteConfig.name} sign-in code`, html, `Your sign-in code is ${code}. It expires in 10 minutes.`);
}

const STATUS_COPY: Partial<Record<OrderStatus, { subject: string; body: string }>> = {
  CONFIRMED: { subject: "is confirmed", body: "We've approved your order and it's being prepared." },
  IN_PRODUCTION: { subject: "is being made", body: "Your piece is now being made in the studio." },
  DISPATCHED: { subject: "is on its way", body: "Your order has been dispatched." },
  DELIVERED: { subject: "was delivered", body: "Your order has been delivered. We hope you love it." },
  CANCELLED: { subject: "was cancelled", body: "Your order has been cancelled. If you paid, a refund has been started to your original payment method." },
};

export async function sendOrderStatusEmail(
  to: string,
  o: { orderNumber: string; status: OrderStatus; note?: string; courier?: string; trackingNumber?: string; trackingUrl?: string; label?: string; message?: string },
) {
  const base = STATUS_COPY[o.status];
  if (!base && !o.label) return;
  // Admin → Orders → Order steps: the step's name and message replace the defaults.
  const copy = { subject: o.label ? `· ${o.label}` : base!.subject, body: o.message || base?.body || "" };
  const tracking = o.trackingNumber ? `${o.courier ?? "Tracking"}: ${o.trackingNumber}` : "";
  const html = `
    <div style="font-family:Arial,sans-serif;background:#F6F4F0;padding:32px;color:#1A1917">
      <h1 style="font-family:Georgia,serif;font-weight:normal">Order ${escape(o.orderNumber)} ${escape(copy.subject)}</h1>
      <p>${escape(copy.body)}</p>
      ${o.note ? `<p><strong>Note:</strong> ${escape(o.note)}</p>` : ""}
      ${tracking ? `<p>${escape(tracking)}${o.trackingUrl ? ` · <a href="${escape(o.trackingUrl)}" style="color:#A24A25">Track parcel</a>` : ""}</p>` : ""}
      <p><a href="${siteConfig.url}/profile" style="color:#A24A25">View your order</a></p>
    </div>`;
  const text = [`Order ${o.orderNumber} ${copy.subject}.`, copy.body, o.note && `Note: ${o.note}`, tracking, o.trackingUrl].filter(Boolean).join("\n");
  await send(to, `Order ${o.orderNumber} ${copy.subject}`, html, text);
}

export async function sendOrderConfirmationEmail(
  to: string,
  order: { orderNumber: string; total: number; items: { productName: string; qty: number; lineTotal: number }[] },
  /** Text from Orders → Order steps (placed, or confirmed when approved automatically). */
  message = "The studio will confirm it shortly and email you when it ships.",
) {
  const rows = order.items
    .map((i) => `<tr><td>${escape(i.productName)} &times; ${i.qty}</td><td align="right">${formatINR(i.lineTotal)}</td></tr>`)
    .join("");
  const html = `
    <div style="font-family:Arial,sans-serif;background:#FAF6EF;padding:32px;color:#1F2430">
      <h1 style="font-family:Georgia,serif;color:#0F2A5C">Thank you for your order</h1>
      <p>We have received your payment for order <strong>${escape(order.orderNumber)}</strong>. ${escape(message)}</p>
      <table width="100%" cellpadding="6">${rows}
        <tr><td><strong>Total</strong></td><td align="right"><strong>${formatINR(order.total)}</strong></td></tr>
      </table>
      <p><a href="${siteConfig.url}/profile" style="color:#A94E31">View your order</a></p>
    </div>`;
  await send(to, `We received your order ${order.orderNumber}`, html, `Payment received for order ${order.orderNumber}. Total ${formatINR(order.total)}. ${message}`);
}
