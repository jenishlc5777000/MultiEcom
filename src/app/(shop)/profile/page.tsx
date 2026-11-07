import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { signOutAction } from "@/actions/auth.actions";
import { PageHero } from "@/components/content/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import { getOrdersForUser } from "@/services/order.service";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser("/profile");
  const orders = (await getOrdersForUser(user.id)).filter((o) => o.status !== "PENDING_PAYMENT" || o.paymentStatus !== "PENDING");

  return (
    <div>
      <PageHero eyebrow={user.email ?? "Your account"} title={<>Hello{user.name ? <>, <em className="italic text-accent">{user.name.split(" ")[0]}</em></> : ""}</>} className="pb-8 md:pb-12" />
      <div className="container max-w-4xl space-y-10">
        <div className="flex flex-wrap gap-2">
          {user.role === "owner" && <Button asChild><Link href="/admin">Open dashboard</Link></Button>}
          <form action={signOutAction}>
            <Button variant="secondary" type="submit">Sign out</Button>
          </form>
        </div>

        <section className="space-y-4">
          <h2 className="text-h3">Your orders</h2>
          {orders.length === 0 && (
            <p className="text-muted">
              No orders yet. <Link href="/category" className="text-accent underline">Browse the shop</Link>.
            </p>
          )}
          <ul className="space-y-3">
            {orders.map((o, i) => (
              <Reveal as="li" key={String(o._id)} delay={Math.min(i, 4) * 60}>
                <Link href={`/profile/orders/${String(o._id)}`} className="group flex items-center gap-4 rounded-lg border border-line p-4 transition-colors hover:bg-surface">
                  <div className="flex -space-x-3">
                    {o.items.slice(0, 3).map((it, k) => (
                      <span key={k} className="relative size-12 overflow-hidden rounded-md bg-surface ring-2 ring-canvas">
                        {it.imageUrl && <Image src={it.imageUrl} alt="" fill sizes="48px" className="object-cover" />}
                      </span>
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{o.orderNumber}</p>
                    <p className="text-sm text-muted">
                      {new Date(o.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })} · {o.items.length} item{o.items.length === 1 ? "" : "s"} · {formatINR(o.total)}
                    </p>
                  </div>
                  <span className="hidden text-sm sm:block">{ORDER_STATUS_LABEL[o.status as OrderStatus] ?? o.status}</span>
                  <ArrowUpRight className="size-5 shrink-0 text-muted transition-transform duration-300 group-hover:rotate-45 group-hover:text-ink" aria-hidden />
                </Link>
              </Reveal>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
