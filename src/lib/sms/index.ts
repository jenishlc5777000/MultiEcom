import "server-only";
import { env } from "@/config/env";
import { siteConfig } from "@/config/site";
import { getIntegrations, type Integrations } from "@/services/integrations.service";

/**
 * SMS through the provider chosen in Admin → Integrations: MSG91, Twilio or
 * Fast2SMS. Indian 10-digit numbers get the +91 prefix. In development with
 * no provider configured, the message is printed to the server console.
 */

type SmsConfig = Integrations["sms"];

const digits = (phone: string) => phone.replace(/\D/g, "");
/** "98765 43210" → "919876543210" */
const toIndian = (phone: string) => {
  const d = digits(phone);
  if (d.length === 10) return `91${d}`;
  if (d.length === 11 && d.startsWith("0")) return `91${d.slice(1)}`;
  return d;
};

async function check(res: Response, provider: string) {
  if (res.ok) return;
  const body = (await res.text()).slice(0, 300);
  throw new Error(`${provider} rejected the SMS (${res.status}): ${body}`);
}

async function sendMsg91(cfg: SmsConfig, to: string, text: string) {
  // MSG91 Flow API: the flow/DLT template should have one variable named "message".
  const res = await fetch("https://control.msg91.com/api/v5/flow", {
    method: "POST",
    headers: { authkey: cfg.apiKey, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ template_id: cfg.templateId, short_url: "0", recipients: [{ mobiles: toIndian(to), message: text }] }),
  });
  await check(res, "MSG91");
}

async function sendTwilio(cfg: SmsConfig, to: string, text: string) {
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(cfg.accountSid)}/Messages.json`, {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${cfg.accountSid}:${cfg.apiKey}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: `+${toIndian(to)}`, From: cfg.senderId, Body: text }),
  });
  await check(res, "Twilio");
}

async function sendFast2sms(cfg: SmsConfig, to: string, text: string) {
  const number = toIndian(to).replace(/^91/, "");
  // With a DLT template ID use the DLT route; otherwise the "quick" route.
  const body = cfg.templateId
    ? { route: "dlt", sender_id: cfg.senderId, message: cfg.templateId, variables_values: text, numbers: number, flash: 0 }
    : { route: "q", message: text, numbers: number, flash: 0 };
  const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: { authorization: cfg.apiKey, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  await check(res, "Fast2SMS");
}

/** Throws with the provider's message if sending fails. */
export async function sendSms(to: string, text: string, override?: SmsConfig) {
  const cfg = override ?? (await getIntegrations()).sms;
  if (cfg.provider === "none" || !cfg.apiKey) {
    if (env().NODE_ENV !== "production") {
      console.info(`\n[sms:dev] to=${to}\n  ${text}\n`);
      return;
    }
    throw new Error("SMS is not configured. Choose a provider in Admin → Integrations.");
  }
  if (digits(to).length < 10) throw new Error("That phone number looks too short.");
  if (cfg.provider === "msg91") return sendMsg91(cfg, to, text);
  if (cfg.provider === "twilio") return sendTwilio(cfg, to, text);
  return sendFast2sms(cfg, to, text);
}

const STATUS_TEXT: Record<string, string> = {
  CONFIRMED: "is confirmed",
  IN_PRODUCTION: "is being made",
  DISPATCHED: "has been dispatched",
  DELIVERED: "was delivered",
  CANCELLED: "was cancelled",
};

/** Order update SMS, only when "SMS order updates" is on in Admin → Integrations. */
export async function sendOrderStatusSms(phone: string, orderNumber: string, status: string, trackingUrl?: string, label?: string) {
  const { sms } = await getIntegrations();
  if (!sms.orderUpdates || sms.provider === "none") return;
  const what = label ? `update: ${label}` : STATUS_TEXT[status];
  if (!what) return;
  await sendSms(phone, `${siteConfig.name}: your order ${orderNumber} ${what}.${trackingUrl ? ` Track: ${trackingUrl}` : ""}`);
}
