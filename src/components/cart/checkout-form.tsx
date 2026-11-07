"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { placeOrderAction } from "@/actions/checkout.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { siteConfig } from "@/config/site";
import type { ClientCheckoutConfig } from "@/lib/payments/types";
import type { AddressInput } from "@/lib/validations";
import { formatINR } from "@/lib/utils";

type RazorpaySuccess = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open(): void; on(event: string, cb: () => void): void };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const fields: { name: keyof AddressInput; label: string; autoComplete: string; inputMode?: "numeric" | "tel"; optional?: boolean }[] = [
  { name: "fullName", label: "Full name", autoComplete: "name" },
  { name: "phone", label: "Mobile number", autoComplete: "tel", inputMode: "tel" },
  { name: "line1", label: "Address line 1", autoComplete: "address-line1" },
  { name: "line2", label: "Address line 2 (optional)", autoComplete: "address-line2", optional: true },
  { name: "city", label: "City", autoComplete: "address-level2" },
  { name: "state", label: "State", autoComplete: "address-level1" },
  { name: "pincode", label: "PIN code", autoComplete: "postal-code", inputMode: "numeric" },
];

export function CheckoutForm({
  email,
  total,
  defaultAddress,
}: {
  email: string;
  total: number;
  defaultAddress?: Partial<AddressInput>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  function openGateway(orderId: string, cfg: ClientCheckoutConfig, address: AddressInput) {
    if (!window.Razorpay) {
      setError("Payment window failed to load. Check your connection and try again.");
      return;
    }
    const rzp = new window.Razorpay({
      key: cfg.publicKey,
      order_id: cfg.providerOrderId,
      amount: cfg.amount,
      currency: cfg.currency,
      name: siteConfig.name,
      prefill: { name: address.fullName, email, contact: address.phone },
      theme: { color: "#0F2A5C" },
      handler: async (res: RazorpaySuccess) => {
        const verify = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            providerOrderId: res.razorpay_order_id,
            providerPaymentId: res.razorpay_payment_id,
            signature: res.razorpay_signature,
          }),
        });
        // Even if this call fails, the webhook confirms the order.
        router.push(`/checkout/success?order=${orderId}${verify.ok ? "" : "&pending=1"}`);
      },
      modal: { ondismiss: () => setError("Payment was cancelled. Your items are held for a few minutes.") },
    });
    rzp.open();
  }

  function onSubmit(formData: FormData) {
    setError(null);
    setFieldErrors({});
    const address = Object.fromEntries(fields.map((f) => [f.name, String(formData.get(f.name) ?? "")])) as AddressInput;
    startTransition(async () => {
      const res = await placeOrderAction({ address });
      if (!res.ok) {
        setError(res.error);
        setFieldErrors(res.fieldErrors ?? {});
        return;
      }
      openGateway(res.data.orderId, res.data.checkout, address);
    });
  }

  return (
    <form action={onSubmit} className="space-y-4" noValidate>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <h2 className="text-xl">Delivery address</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => {
          const err = fieldErrors[`address.${f.name}`]?.[0] ?? fieldErrors[f.name]?.[0];
          return (
            <div key={f.name} className={f.name.startsWith("line") || f.name === "fullName" ? "sm:col-span-2" : ""}>
              <Label htmlFor={f.name}>{f.label}</Label>
              <Input
                id={f.name}
                name={f.name}
                autoComplete={f.autoComplete}
                inputMode={f.inputMode}
                required={!f.optional}
                defaultValue={defaultAddress?.[f.name] ?? ""}
                aria-invalid={Boolean(err)}
              />
              <FieldError>{err}</FieldError>
            </div>
          );
        })}
      </div>
      <p role="alert" className="min-h-5 text-sm text-danger">{error}</p>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Starting payment…" : `Pay ${formatINR(total)}`}
      </Button>
      <p className="text-center text-sm text-muted">Secure payment by Razorpay. UPI, cards and netbanking accepted.</p>
    </form>
  );
}
