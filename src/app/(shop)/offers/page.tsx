import { notFound } from "next/navigation";
import { Countdown } from "@/components/builder/countdown";
import { PageHero } from "@/components/content/page-hero";
import { ProductGrid } from "@/components/product/product-card";
import type { ProductCardDTO } from "@/types/dto";
import { getBestsellerProducts, getHotDealProducts, getOfferProducts } from "@/services/merch.service";
import { getSiteConfig } from "@/services/site-config.service";

export const metadata = { title: "Offers & deals" };

/** Offers, hot deals and most ordered (Studio → Shopping). */
export default async function OffersPage() {
  const { shopping: s } = await getSiteConfig();
  if (!s.offersPage.enabled) notFound();

  const [offers, hot, best] = await Promise.all([
    s.offers.enabled ? getOfferProducts({ productIds: s.offers.productIds, includeDiscounted: s.offers.includeDiscounted }, 24) : [],
    s.hotDeals.enabled ? getHotDealProducts(s.hotDeals.productIds) : [],
    s.bestsellers.enabled ? getBestsellerProducts({ mode: s.bestsellers.mode, productIds: s.bestsellers.productIds, count: s.bestsellers.count }) : [],
  ]);
  const dealEnds = s.hotDeals.endsAt && Date.parse(s.hotDeals.endsAt) > Date.now() ? s.hotDeals.endsAt : "";

  const section = (id: string, title: string, subtitle: string, products: ProductCardDTO[], extra?: React.ReactNode) =>
    products.length > 0 && (
      <section id={id} className="scroll-mt-28 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-h2">{title}</h2>
            {subtitle && <p className="max-w-xl text-muted">{subtitle}</p>}
          </div>
          {extra}
        </div>
        <ProductGrid products={products} />
      </section>
    );

  const empty = !offers.length && !hot.length && !best.length;
  return (
    <div>
      <PageHero eyebrow="Shop" title={s.offersPage.title} className="pb-8 md:pb-12" />
      <div className="container space-y-20">
        {section("hot-deals", s.hotDeals.title, s.hotDeals.subtitle, hot, dealEnds ? <Countdown endsAt={dealEnds} endedText="These deals have ended." /> : undefined)}
        {section("offers", s.offers.title, s.offers.subtitle, offers)}
        {section("most-ordered", s.bestsellers.title, s.bestsellers.subtitle, best)}
        {empty && <p className="text-muted">No offers right now. Check back soon.</p>}
      </div>
    </div>
  );
}
