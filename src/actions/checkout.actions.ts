"use server";

import { getCurrentUser } from "@/lib/auth/guards";
import type { ClientCheckoutConfig } from "@/lib/payments";
import { addressSchema, checkoutSchema } from "@/lib/validations";
import { OutOfStockError, UnavailableError } from "@/services/inventory.service";
import { CheckoutError, createOrderFromCart } from "@/services/order.service";
import { startPayment } from "@/services/payment.service";
import type { ActionResult } from "@/types/dto";

type CheckoutData = { orderId: string; orderNumber: string; checkout: ClientCheckoutConfig };

export async function placeOrderAction(input: unknown): Promise<ActionResult<CheckoutData>> {
  const user = await getCurrentUser();
  if (!user?.id || !user.email) return { ok: false, error: "Please sign in to check out." };

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    // Flatten the nested address so errors map 1:1 to form field names.
    const address = addressSchema.safeParse((input as { address?: unknown } | null)?.address);
    const fieldErrors = address.success ? {} : address.error.flatten().fieldErrors;
    return { ok: false, error: "Please check your address.", fieldErrors };
  }

  try {
    const order = await createOrderFromCart({ id: user.id, email: user.email }, parsed.data.address);
    const checkout = await startPayment(order);
    return { ok: true, data: { orderId: String(order._id), orderNumber: order.orderNumber, checkout } };
  } catch (e) {
    if (e instanceof OutOfStockError || e instanceof UnavailableError || e instanceof CheckoutError) {
      return { ok: false, error: e.message };
    }
    console.error("[checkout] place order", e);
    return { ok: false, error: "We couldn't start your payment. Nothing was charged; please try again." };
  }
}
