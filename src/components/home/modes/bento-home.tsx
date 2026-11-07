import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Truck } from "lucide-react";
import { ClosingCta } from "@/components/home/closing-cta";
import { SectionHeading } from "@/components/home/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { ProductGrid } from "@/components/product/product-card";
import { Button, ButtonArrow } from "@/components/ui/button";
import { cn, formatINR } from "@/lib/utils";
import { plainTitle, type HomeData } from "./types";

const tile = "relative overflow-hidden rounded-lg";
// Static class names so Tailwind generates them: the promise tile's width fills the last row.
const SPAN_MD = ["md:col-span-4", "md:col-span-1", "md:col-span-2", "md:col-span-3"] as const;
const SPAN_SM = ["col-span-2", "col-span-1"] as const;

/**
 * Bento-box home page: the story, hero photo, stats, featured piece,
 * categories and shipping promise all in one tiled grid.
 */
export function BentoHome(d: HomeData) {
  const cats = d.categories.slice(0, 4);
  // Cells used by the small tiles (stats + categories) and the 2×2 featured tile.
  const cells = d.stats.length + cats.length + (d.featured ? 4 : 0);
  const promiseSpan = cn(SPAN_SM[(2 - (cells % 2)) % 2], SPAN_MD[(4 - (cells % 4)) % 4]);
  const shipping =
    d.store.shippingFlatFee === 0
      ? "Free shipping on every order"
      : d.store.freeShippingThreshold > 0
        ? `Free shipping over ${formatINR(d.store.freeShippingThreshold)}`
        : `${formatINR(d.store.shippingFlatFee)} flat shipping`;

  return (
    <div className="space-y-24 md:space-y-32">
      <section className="container pt-6">
        <div className="grid grid-flow-dense auto-rows-[160px] grid-cols-2 gap-3 md:auto-rows-[190px] md:grid-cols-4 md:gap-4">
          {/* Intro */}
          <div className={cn(tile, "brand-panel col-span-2 row-span-2 flex flex-col justify-between bg-ink p-6 text-canvas md:p-8")}>
            <p className="text-eyebrow uppercase text-canvas/70">{d.site.content.hero.eyebrow}</p>
            <div className="space-y-4">
              <h1 className="text-h1 text-canvas">{plainTitle(d.banner?.title || d.site.content.hero.title)}</h1>
              <Button asChild variant="light">
                <Link href={d.banner?.ctaHref || d.site.content.hero.ctaHref || "/category"}>
                  {d.banner?.ctaLabel || d.site.content.hero.ctaLabel} <ButtonArrow />
                </Link>
              </Button>
            </div>
          </div>

          {/* Hero photo */}
          <div className={cn(tile, "col-span-2 row-span-2 bg-surface-strong")}>
            {d.heroImage && <Image src={d.heroImage.url} alt={d.heroImage.alt} fill priority sizes="(min-width: 768px) 50vw, 100vw" className="animate-zoom-out object-cover" />}
          </div>

          {/* Stats */}
          {d.stats.map((s, i) => (
            <div key={s.label} className={cn(tile, "flex flex-col justify-between p-5", i === 0 ? "bg-accent text-on-accent" : "bg-surface")}>
              <span className="text-eyebrow uppercase opacity-80">{s.label}</span>
              <span className="font-display text-6xl leading-none">{s.value}</span>
            </div>
          ))}

          {/* Featured product */}
          {d.featured && (
            <Link href={`/products/${d.featured.slug}`} className={cn(tile, "group col-span-2 row-span-2 bg-surface-strong")}>
              {d.featured.image && <Image src={d.featured.image.url} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-1000 group-hover:scale-105" />}
              <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-md bg-paper/90 p-4 backdrop-blur">
                <div className="min-w-0">
                  <p className="text-eyebrow uppercase text-accent">{d.site.content.hero.featuredLabel}</p>
                  <p className="truncate font-medium">{d.featured.name}</p>
                </div>
                <span className="shrink-0 tabular-nums">{formatINR(d.featured.priceFrom)}</span>
              </div>
            </Link>
          )}

          {/* Categories */}
          {cats.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} className={cn(tile, "group bg-surface-strong")}>
              {c.image && <Image src={c.image.url} alt="" fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />}
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 flex items-end justify-between text-white">
                <span className="font-display text-2xl leading-none">{c.name}</span>
                <ArrowUpRight className="size-5 transition-transform duration-500 group-hover:rotate-45" aria-hidden />
              </div>
            </Link>
          ))}

          {/* Promise */}
          <Link href="/policies/shipping" className={cn(tile, promiseSpan, "flex items-center gap-5 border border-line bg-paper p-6 transition-colors hover:border-ink")}>
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface"><Truck className="size-5" aria-hidden /></span>
            <span>
              <span className="block font-display text-2xl leading-tight">{shipping}</span>
              <span className="text-sm text-muted">{d.store.returnWindowDays}-day returns · secure UPI &amp; card checkout</span>
            </span>
          </Link>
        </div>
      </section>

      {d.newest.length > 0 && (
        <Reveal className="container space-y-10">
          <SectionHeading eyebrow="New from the studio" title={<>Fresh out of the <em className="italic">kiln</em></>} href="/category" />
          <ProductGrid products={d.newest.slice(0, 8)} />
        </Reveal>
      )}

      <ClosingCta content={d.site.content.closing} />
    </div>
  );
}
