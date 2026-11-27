import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { Resend } from "resend";
import { env } from "@/config/env";
import { siteConfig } from "@/config/site";
import type { OrderStatus } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import { getIntegrations } from "@/services/integrations.service";

let resend: { key: string; client: Resend } | undefined;
let gmailTransport: { key: string; client: Transporter } | undefined;

/** True when emails can actually be sent (Gmail or Resend set up in Admin → Integrations). */
export async function emailConfigured() {
  const { email, gmail } = await getIntegrations();
  return Boolean((gmail.user && gmail.appPassword) || email.apiKey);
}

/**
 * Sends through Gmail (address + app password from Admin → Integrations) when
 * set, otherwise Resend (API key from Admin → Integrations or .env).
 * In development with neither, the email is printed to the server console.
 */
async function send(to: string, subject: string, html: string, text: string, replyTo?: string) {
  const { email, gmail } = await getIntegrations();
  if (gmail.user && gmail.appPassword) {
    const key = `${gmail.user}|${gmail.appPassword}`;
    if (!gmailTransport || gmailTransport.key !== key) {
      gmailTransport = { key, client: nodemailer.createTransport({ service: "gmail", auth: { user: gmail.user, pass: gmail.appPassword } }) };
    }
    try {
      await gmailTransport.client.sendMail({ from: { name: siteConfig.name, address: gmail.user }, to, subject, html, text, ...(replyTo ? { replyTo } : {}) });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(/535|Username and Password not accepted|BadCredentials/i.test(msg)
        ? "Gmail rejected the sign-in. Use a Google app password (not your normal password) with 2-Step Verification on."
        : `Gmail send failed: ${msg}`);
    }
    return;
  }
  if (!email.apiKey) {
    if (env().NODE_ENV !== "production") {
      console.info(`\n[email:dev] to=${to}\n  subject: ${subject}\n  ${text}\n`);
      return;
    }
    throw new Error("Email is not configured. Add Gmail or a Resend API key in Admin → Integrations.");
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

/** "Reset your password" link (valid for 30 minutes). */
export async function sendPasswordResetEmail(to: string, link: string) {
  const html = `
    <div style="font-family:Arial,sans-serif;background:#FAF6EF;padding:32px;color:#1F2430">
      <h1 style="font-family:Georgia,serif;color:#0F2A5C;font-size:22px;margin:0 0 16px">${escape(siteConfig.name)}</h1>
      <p>We got a request to reset the password for your account.</p>
      <p style="margin:24px 0"><a href="${escape(link)}" style="background:#0F2A5C;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none">Choose a new password</a></p>
      <p style="color:#6B6F7A;font-size:13px">The link works for 30 minutes. If you didn't ask for this, ignore this email and your password stays the same.</p>
    </div>`;
  await send(to, `Reset your ${siteConfig.name} password`, html, `Reset your password: ${link}\n\nThe link works for 30 minutes. If you didn't ask for this, ignore this email.`);
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
