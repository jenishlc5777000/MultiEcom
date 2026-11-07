import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { connectDB } from "@/lib/db/connect";
import { formatINR } from "@/lib/utils";
import { Order } from "@/models";
import { objectId } from "@/lib/validations";

export const metadata = { title: "Order placed" };

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const user = await requireUser("/profile");
  const id = objectId.safeParse((await searchParams).order);

  await connectDB();
  const order = id.success ? await Order.findOne({ _id: id.data, user: user.id }).lean() : null;

  return (
    <div className="container flex max-w-lg flex-col items-center gap-4 py-16 text-center">
      <CheckCircle2 className="size-14 text-ready" aria-hidden />
      <h1 className="text-3xl">{order?.paymentStatus === "PAID" ? "Thank you!" : "Payment received"}</h1>
      {order ? (
        <p className="text-ink/80">
          Order <strong>{order.orderNumber}</strong> for {formatINR(order.total)}{" "}
          {order.paymentStatus === "PAID" ? "is paid. The studio will confirm it shortly, and we’ll email you at each step." : "is being processed. This can take a minute."}
        </p>
      ) : (
        <p className="text-ink/80">Your order will appear in your profile shortly.</p>
      )}
      <Button asChild size="lg">
        <Link href="/profile">View your orders</Link>
      </Button>
    </div>
  );
}
