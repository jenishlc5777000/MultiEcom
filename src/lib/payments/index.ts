import "server-only";
import { getIntegrations } from "@/services/integrations.service";
import { RazorpayProvider } from "./razorpay";
import type { PaymentProvider } from "./types";

let cached: { key: string; provider: PaymentProvider } | undefined;

/**
 * Single switch point for the payment gateway. Credentials come from
 * Admin → Integrations (falling back to .env); the client is rebuilt when they change.
 */
export async function getPaymentProvider(): Promise<PaymentProvider> {
  const { razorpay } = await getIntegrations();
  const key = `${razorpay.keyId}|${razorpay.keySecret}|${razorpay.webhookSecret}`;
  if (!cached || cached.key !== key) cached = { key, provider: new RazorpayProvider(razorpay) };
  return cached.provider;
}

export type * from "./types";
