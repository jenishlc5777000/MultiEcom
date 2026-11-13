import Image from "next/image";
import Link from "next/link";
import { RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { CategoryBlock } from "@/components/home/category-showcase";
import { ProductCarousel } from "@/components/product/product-carousel";
import { ProductListing } from "@/components/product/product-listing";
import { Button, ButtonArrow } from "@/components/ui/button";
import { cn, formatINR } from "@/lib/utils";
import { makeT, type LabelKey } from "@/lib/labels";
import { plainTitle, type HomeData, type ShopSort } from "./types";

const SORTS: { id: ShopSort; label: LabelKey }[] = [
  { id: "new", label: "list.sortNew" },
  { id: "ready", label: "list.readyToShip" },
  { id: "price-asc", label: "list.sortPriceAsc" },
  { id: "price-desc", label: "list.sortPriceDesc" },
];

const href = (sort: ShopSort, page = 1) => {
  const p = new URLSearchParams();
  if (sort !== "new") p.set("sort", sort);
  if (page > 1) p.set("page", String(page));
  const q = p.toString();
  return q ? `/?${q}#products` : "/#products";
};

/**
 * Direct e-commerce home page: no marketing landing page. A slim promo strip,
 * the category bar, then every product with sorting and pages.
 */
export function ShopHome(d: HomeData) {
  const hero = d.site.content.hero;
  const t = makeT(d.site.labels);
  const feed = d.feed ?? { products: d.newest, total: d.newest.length, pageCount: 1, page: 1, sort: "new" as const };
  const shipping =
    d.store.shippingFlatFee === 0
      ? t("trust.freeShipping")
      : d.store.freeShippingThreshold > 0
        ? `Free shipping over ${formatINR(d.store.freeShippingThreshold)}`
        : `${formatINR(d.store.shippingFlatFee)} flat shipping`;

  return (
    <div data-studio="shop-home" className="container space-y-12 pb-24 pt-6 md:space-y-16 md:pt-8">
      {/* Promo strip */}
      <section className="brand-panel relative grid overflow-hidden rounded-lg bg-ink text-canvas md:grid-cols-[1fr_340px]">
        <div className="relative z-10 flex flex-col justify-center gap-4 p-6 md:p-10">
          <p className="text-eyebrow uppercase text-canvas/70">{hero.eyebrow}</p>
          <h1 className="text-h2 text-canvas">{plainTitle(d.banner?.title || hero.title)}</h1>
          <p className="max-w-lg text-canvas/75">{d.banner?.subtitle || hero.subtitle}</p>
          <div>
            <Button asChild variant="light">
              <Link href={d.banner?.ctaHref || "#products"}>
                {d.banner?.ctaLabel || hero.ctaLabel} <ButtonArrow />
              </Link>
            </Button>
          </div>
        </div>
        {d.heroImage && (
          <div className="relative hidden md:block">
            <Image src={d.heroImage.url} alt={d.heroImage.alt} fill priority sizes="340px" className="object-cover" />
          </div>
        )}
      </section>

      {/* Trust bar */}
      <ul className="grid gap-3 text-sm sm:grid-cols-3">
        {[
          { icon: Truck, text: shipping, href: "/policies/shipping" },
          { icon: RotateCcw, text: `${d.store.returnWindowDays}-day returns`, href: "/policies/returns" },
          { icon: ShieldCheck, text: "Secure UPI & card checkout", href: "/policies/terms" },
        ].map((t) => (
          <li key={t.text}>
            <Link href={t.href} className="fx-panel flex items-center gap-3 rounded-md border border-line bg-paper/60 px-4 py-3 transition-colors hover:border-ink">
              <t.icon className="size-4 shrink-0 text-accent" aria-hidden />
              {t.text}
            </Link>
          </li>
        ))}
      </ul>

      {/* Categories */}
      {d.categories.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-h3">{t("home.shopByCategory")}</h2>
            <Link href="/category" className="link-underline text-sm text-muted">{t("home.allCategories")}</Link>
          </div>
          <CategoryBlock categories={d.categories} layout={d.theme.layout.categories} />
        </section>
      )}

      {/* Ready to ship (only on the first page of "Newest") */}
      {feed.page === 1 && feed.sort === "new" && d.readyStock.length > 3 && (
        <ProductCarousel eyebrow={t("home.readyEyebrow")} title={t("home.readyToShip")} products={d.readyStock} href="/?sort=ready#products" />
      )}

      {/* All products */}
      <section id="products" className="scroll-mt-24 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
          <div>
            <h2 className="text-h3">{t("home.allProducts")}</h2>
            <p className="mt-1 text-sm text-muted">{feed.total} piece{feed.total === 1 ? "" : "s"}</p>
          </div>
          <nav aria-label="Sort products" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0">
            {SORTS.map((s) => (
              <Link
                key={s.id}
                href={href(s.id)}
                scroll={false}
                aria-current={feed.sort === s.id ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 shrink-0 items-center rounded-pill border px-4 text-sm transition-colors",
                  feed.sort === s.id ? "border-ink bg-ink text-canvas" : "border-line hover:border-ink",
                )}
              >
                {t(s.label)}
              </Link>
            ))}
          </nav>
        </div>

        {feed.products.length ? <ProductListing products={feed.products} layout={d.site.pages.shopAll.listing === "theme" ? d.theme.layout.listing : d.site.pages.shopAll.listing} /> : <p className="py-10 text-center text-muted">{t("home.empty")}</p>}

        {feed.pageCount > 1 && (
          <nav aria-label="Pagination" className="flex justify-center gap-2 pt-4">
            {Array.from({ length: feed.pageCount }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={href(feed.sort, n)}
                aria-current={n === feed.page ? "page" : undefined}
                className={cn(
                  "flex size-touch items-center justify-center rounded-pill transition-colors",
                  n === feed.page ? "bg-ink text-canvas" : "bg-surface hover:bg-surface-strong",
                )}
              >
                {n}
              </Link>
            ))}
          </nav>
        )}
      </section>
    </div>
  );
}
