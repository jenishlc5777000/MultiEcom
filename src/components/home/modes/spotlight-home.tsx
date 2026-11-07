import Image from "next/image";
import Link from "next/link";
import { CategoryBlock } from "@/components/home/category-showcase";
import { PromiseStrip } from "@/components/home/promise-strip";
import { SectionHeading } from "@/components/home/section-heading";
import { StorySection } from "@/components/home/story-section";
import { AvailabilityBadge } from "@/components/product/availability-badge";
import { ProductGrid } from "@/components/product/product-card";
import { RatingStars } from "@/components/product/rating-stars";
import { Button, ButtonArrow } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";
import type { HomeData } from "./types";

/**
 * Single-product home page: one piece shown big and ready to buy, then the
 * rest of the range, the categories and the story.
 */
export function SpotlightHome(d: HomeData) {
  const p = d.featured;
  const rest = d.newest.filter((n) => n.id !== p?.id);

  return (
    <div className="space-y-24 md:space-y-32">
      {p ? (
        <section className="container grid gap-10 pt-6 lg:min-h-[min(calc(100svh-var(--header-h)),860px)] lg:grid-cols-12 lg:items-center lg:gap-16">
          <Link href={`/products/${p.slug}`} className="group relative aspect-square animate-clip-up overflow-hidden rounded-lg border border-line bg-surface lg:col-span-7">
            {p.image && (
              <Image src={p.image.url} alt={p.image.alt} fill priority sizes="(min-width: 1024px) 58vw, 100vw" className="animate-zoom-out object-cover transition-transform duration-1000 group-hover:scale-105" />
            )}
            <span className="absolute left-4 top-4 rounded-pill bg-canvas/90 px-3 py-1 text-eyebrow uppercase text-ink backdrop-blur">Piece of the week</span>
          </Link>

          <div className="space-y-7 lg:col-span-5">
            <div className="flex flex-wrap items-center gap-3">
              <AvailabilityBadge availability={p.availability} className="bg-surface" />
              {p.ratingCount > 0 && <RatingStars value={p.ratingAvg} count={p.ratingCount} />}
            </div>
            <h1 className="text-h1 animate-fade-up">{p.name}</h1>
            <p className="font-display text-5xl tabular-nums leading-none">
              {p.compareAtFrom && <span className="mr-3 text-2xl text-muted line-through">{formatINR(p.compareAtFrom)}</span>}
              {formatINR(p.priceFrom)}
            </p>
            {p.swatches.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted">Available in</p>
                <div className="flex flex-wrap gap-2">
                  {p.swatches.map((s) => (
                    <span key={s.name} className="inline-flex items-center gap-2 rounded-pill border border-line px-3 py-1.5 text-sm">
                      <span className="size-3.5 rounded-full border border-ink/15" style={{ backgroundColor: s.hex ?? "#ccc" }} aria-hidden />
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <p className="max-w-md leading-relaxed text-muted">
              {d.banner?.subtitle || "Made by hand, so every one is slightly different. Choose your glaze and size on the next page."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={`/products/${p.slug}`}>
                  Choose &amp; buy <ButtonArrow />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/category">Shop everything</Link>
              </Button>
            </div>
            {d.stats.length > 0 && (
              <dl className="flex gap-8 border-t border-line pt-6">
                {d.stats.map((s) => (
                  <div key={s.label}>
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="font-display text-3xl leading-none">{s.value}</dd>
                    <dd aria-hidden className="mt-1 text-xs text-muted">{s.label}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </section>
      ) : (
        <section className="container py-24 text-center text-muted">Add a product to feature it here.</section>
      )}

      {rest.length > 0 && (
        <section className="container space-y-10">
          <SectionHeading eyebrow="The rest of the range" title={<>More <em className="italic">pieces</em></>} href="/category" />
          <ProductGrid products={rest.slice(0, 8)} />
        </section>
      )}

      {d.categories.length > 0 && (
        <section className="container space-y-10">
          <SectionHeading eyebrow="Browse" title="By category" href="/category" linkLabel="All categories" />
          <CategoryBlock categories={d.categories} layout="cards" />
        </section>
      )}

      <StorySection image={d.storyImage} content={d.site.content.story} />
      <PromiseStrip {...d.store} />
    </div>
  );
}
