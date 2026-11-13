import Link from "next/link";
import { RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { makeT } from "@/lib/labels";
import { formatINR } from "@/lib/utils";
import { getSiteConfig } from "@/services/site-config.service";

type Props = { shippingFlatFee: number; freeShippingThreshold: number; returnWindowDays: number };

/** Built from store settings, so it always matches checkout and the policies. */
export async function PromiseStrip({ shippingFlatFee, freeShippingThreshold, returnWindowDays }: Props) {
  const t = makeT((await getSiteConfig()).labels);
  const shipping =
    shippingFlatFee === 0
      ? `${t("trust.freeShippingAll")}.`
      : freeShippingThreshold > 0
        ? `${formatINR(shippingFlatFee)} flat shipping, free on orders over ${formatINR(freeShippingThreshold)}.`
        : `${formatINR(shippingFlatFee)} flat shipping across India.`;

  const items = [
    { icon: Truck, title: t("trust.packed"), body: shipping, href: "/policies/shipping" },
    { icon: RotateCcw, title: t("trust.returns"), body: t("trust.returnsBody").replaceAll("{days}", String(returnWindowDays)), href: "/policies/returns" },
    { icon: ShieldCheck, title: t("trust.secure"), body: t("trust.secureBody"), href: "/policies/terms" },
  ];

  return (
    <section data-studio="promise" className="container">
      <ul className="fx-panel grid divide-y divide-line rounded-lg border border-line md:grid-cols-3 md:divide-x md:divide-y-0">
        {items.map((item, i) => (
          <Reveal as="li" key={item.title} delay={i * 100}>
            <Link href={item.href} className="group flex h-full gap-5 p-6 transition-colors duration-300 hover:bg-surface md:p-8">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface transition-all duration-500 group-hover:bg-ink group-hover:text-canvas">
                <item.icon className="size-5" strokeWidth={1.5} aria-hidden />
              </span>
              <span>
                <span className="block font-display text-2xl">{item.title}</span>
                <span className="mt-1 block text-muted">{item.body}</span>
              </span>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
