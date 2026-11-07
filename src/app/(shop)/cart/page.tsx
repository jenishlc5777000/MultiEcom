import Link from "next/link";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";
import { getCart } from "@/services/cart.service";

export const metadata = { title: "Cart" };

export default async function CartPage() {
  const cart = await getCart();
  const hasProblems = cart.lines.some((l) => l.problem);

  if (!cart.lines.length) {
    return (
      <div className="container flex flex-col items-center gap-4 py-20 text-center">
        <h1 className="text-h1">Your cart is <em className="italic text-accent">empty</em></h1>
        <p className="text-ink/80">Find something you&apos;ll love using every day.</p>
        <Button asChild size="lg">
          <Link href="/category">Browse the shop</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container grid gap-10 py-12 md:grid-cols-[1fr_360px]">
      <section>
        <h1 className="mb-8 text-h1">Your <em className="italic text-accent">cart</em></h1>
        <ul className="space-y-3">
          {cart.lines.map((l) => <CartLineItem key={l.variantId} line={l} />)}
        </ul>
      </section>

      <aside className="h-fit space-y-4 rounded-lg bg-surface p-5 md:sticky md:top-[calc(var(--header-h)+1.5rem)]">
        <h2 className="text-xl">Summary</h2>
        <div className="flex justify-between text-lg">
          <span>Subtotal</span>
          <span className="font-semibold text-ink">{formatINR(cart.subtotal)}</span>
        </div>
        <p className="text-sm text-ink/80">Shipping is calculated at checkout.</p>
        {hasProblems ? (
          <p className="text-sm text-danger">Please fix the items marked above to continue.</p>
        ) : (
          <Button asChild size="lg" className="w-full">
            <Link href="/checkout">Checkout</Link>
          </Button>
        )}
      </aside>
    </div>
  );
}
