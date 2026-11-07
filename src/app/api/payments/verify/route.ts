import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { getPaymentProvider } from "@/lib/payments";
import { verifyPaymentSchema } from "@/lib/validations";
import { connectDB } from "@/lib/db/connect";
import { Payment } from "@/models";
import { markPaymentCaptured } from "@/services/payment.service";

export const runtime = "nodejs";

/**
 * Called by the browser after the checkout widget succeeds. The signature
 * proves the payment came from the gateway; the webhook remains the backstop.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = verifyPaymentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const { orderId, providerOrderId, providerPaymentId, signature } = parsed.data;

  const provider = await getPaymentProvider();
  if (!provider.verifyPayment({ providerOrderId, providerPaymentId, signature })) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await connectDB();
  const owns = await Payment.exists({ order: orderId, user: user.id, providerOrderId });
  if (!owns) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await markPaymentCaptured({ providerOrderId, providerPaymentId });
  return NextResponse.json({ ok: true, orderId });
}
