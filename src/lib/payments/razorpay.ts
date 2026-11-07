import "server-only";
import crypto from "node:crypto";
import Razorpay from "razorpay";
import type { PaymentEvent, PaymentOrder, PaymentProvider } from "./types";

function safeEqualHex(a: string, b: string) {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

function hmac(secret: string, payload: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

interface RazorpayWebhookBody {
  event: string;
  payload: {
    payment?: { entity: { id: string; order_id: string; amount: number; method?: string; error_description?: string } };
    refund?: { entity: { payment_id: string; amount: number } };
  };
}

export type RazorpayCredentials = { keyId: string; keySecret: string; webhookSecret: string };

const need = (v: string, what: string) => {
  if (!v) throw new Error(`Razorpay ${what} is not set. Add it in Admin → Integrations (or .env).`);
  return v;
};

export class RazorpayProvider implements PaymentProvider {
  readonly name = "razorpay";
  private client: Razorpay;

  constructor(private creds: RazorpayCredentials) {
    this.client = new Razorpay({ key_id: need(creds.keyId, "key ID"), key_secret: need(creds.keySecret, "key secret") });
  }

  async createOrder({ amount, currency, receipt, notes }: Parameters<PaymentProvider["createOrder"]>[0]) {
    const order = await this.client.orders.create({ amount, currency, receipt, notes });
    return { providerOrderId: order.id, amount: Number(order.amount), currency } satisfies PaymentOrder;
  }

  verifyPayment({ providerOrderId, providerPaymentId, signature }: Parameters<PaymentProvider["verifyPayment"]>[0]) {
    const expected = hmac(this.creds.keySecret, `${providerOrderId}|${providerPaymentId}`);
    return safeEqualHex(expected, signature);
  }

  verifyWebhook(rawBody: string, signature: string | null) {
    if (!signature) return false;
    return safeEqualHex(hmac(need(this.creds.webhookSecret, "webhook secret"), rawBody), signature);
  }

  parseWebhook(rawBody: string): PaymentEvent {
    const body = JSON.parse(rawBody) as RazorpayWebhookBody;
    const p = body.payload.payment?.entity;
    switch (body.event) {
      case "payment.captured":
      case "order.paid":
        if (!p) break;
        return { type: "payment.captured", providerOrderId: p.order_id, providerPaymentId: p.id, amount: p.amount, method: p.method };
      case "payment.failed":
        if (!p) break;
        return { type: "payment.failed", providerOrderId: p.order_id, providerPaymentId: p.id, reason: p.error_description };
      case "refund.processed": {
        const r = body.payload.refund?.entity;
        if (!r) break;
        return { type: "refund.processed", providerPaymentId: r.payment_id, amount: r.amount };
      }
    }
    return { type: "ignored", rawType: body.event };
  }

  async refund(providerPaymentId: string, amount?: number) {
    const refund = await this.client.payments.refund(providerPaymentId, amount ? { amount } : {});
    return { refundId: refund.id };
  }

  clientConfig(order: PaymentOrder) {
    return {
      provider: this.name,
      publicKey: this.creds.keyId,
      providerOrderId: order.providerOrderId,
      amount: order.amount,
      currency: order.currency,
    };
  }
}
