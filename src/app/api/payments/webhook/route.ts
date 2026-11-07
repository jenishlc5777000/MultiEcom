import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { handlePaymentEvent } from "@/services/payment.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Gateway webhook (configure in the Razorpay dashboard: payment.captured, payment.failed, refund.processed). */
export async function POST(req: Request) {
  const raw = await req.text(); // signature is computed over the exact raw body
  const provider = await getPaymentProvider();

  if (!provider.verifyWebhook(raw, req.headers.get("x-razorpay-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await handlePaymentEvent(provider.parseWebhook(raw));
  } catch (e) {
    console.error("[webhook] payment event", e);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 }); // gateway will retry
  }
  return NextResponse.json({ ok: true });
}
