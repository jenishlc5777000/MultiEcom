/**
 * Provider-agnostic payment contract. Services depend on this interface only,
 * so Razorpay can be swapped (Stripe, Cashfree, PhonePe...) by adding one file.
 * All amounts are integer minor units (paise for INR).
 */
export type Currency = "INR";

export interface CreatePaymentOrderInput {
  amount: number;
  currency: Currency;
  receipt: string; // our order number
  notes?: Record<string, string>;
}

export interface PaymentOrder {
  providerOrderId: string;
  amount: number;
  currency: Currency;
}

export interface VerifyPaymentInput {
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
}

export type PaymentEvent =
  | { type: "payment.captured"; providerOrderId: string; providerPaymentId: string; amount: number; method?: string }
  | { type: "payment.failed"; providerOrderId: string; providerPaymentId: string; reason?: string }
  | { type: "refund.processed"; providerPaymentId: string; amount: number }
  | { type: "ignored"; rawType: string };

/** What the browser needs to open the provider's checkout widget. */
export interface ClientCheckoutConfig {
  provider: string;
  publicKey: string;
  providerOrderId: string;
  amount: number;
  currency: Currency;
}

export interface PaymentProvider {
  readonly name: string;
  createOrder(input: CreatePaymentOrderInput): Promise<PaymentOrder>;
  verifyPayment(input: VerifyPaymentInput): boolean;
  verifyWebhook(rawBody: string, signature: string | null): boolean;
  parseWebhook(rawBody: string): PaymentEvent;
  refund(providerPaymentId: string, amount?: number): Promise<{ refundId: string }>;
  clientConfig(order: PaymentOrder): ClientCheckoutConfig;
}
