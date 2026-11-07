import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/cart/checkout-form";
import { requireUser } from "@/lib/auth/guards";
import { connectDB } from "@/lib/db/connect";
import { formatINR } from "@/lib/utils";
import { User } from "@/models";
import { getCart } from "@/services/cart.service";
import { quoteTotals } from "@/services/order.service";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const cart = await getCart();
  if (!cart.lines.length || cart.lines.some((l) => l.problem)) redirect("/cart");

  await connectDB();
  const [profile, totals] = await Promise.all([
    User.findById(user.id).select("addresses").lean(),
    quoteTotals(cart.subtotal),
  ]);
  const saved = profile?.addresses?.[0];

  return (
    <div className="container grid gap-8 py-8 md:grid-cols-[1fr_360px]">
      <section>
        <h1 className="mb-6 text-3xl">Checkout</h1>
        <CheckoutForm
          email={user.email ?? ""}
          total={totals.total}
          defaultAddress={
            saved
              ? {
                  fullName: saved.fullName, phone: saved.phone, line1: saved.line1, line2: saved.line2 ?? "",
                  city: saved.city, state: saved.state, pincode: saved.pincode,
                }
              : { fullName: user.name ?? "" }
          }
        />
      </section>
      <aside className="h-fit space-y-3 rounded-lg bg-surface p-5">
        <h2 className="text-xl">Order</h2>
        <ul className="space-y-2 text-sm">
          {cart.lines.map((l) => (
            <li key={l.variantId} className="flex justify-between gap-3">
              <span>{l.name}{l.variantLabel && ` · ${l.variantLabel}`} × {l.qty}</span>
              <span className="shrink-0">{formatINR(l.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(totals.subtotal)}</span></div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{totals.shippingFee ? formatINR(totals.shippingFee) : "Free"}</span>
          </div>
        </div>
        <div className="flex justify-between font-semibold text-ink">
          <span>Total</span>
          <span>{formatINR(totals.total)}</span>
        </div>
      </aside>
    </div>
  );
}
