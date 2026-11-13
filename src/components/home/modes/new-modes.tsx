import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RichTitle } from "@/components/content/rich-title";
import { CategoryBlock } from "@/components/home/category-showcase";
import { ClosingCta } from "@/components/home/closing-cta";
import { PromiseStrip } from "@/components/home/promise-strip";
import { SectionHeading } from "@/components/home/section-heading";
import { StorySection } from "@/components/home/story-section";
import { ProductGrid } from "@/components/product/product-card";
import { Button, ButtonArrow } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { makeT } from "@/lib/labels";
import { cn, formatINR } from "@/lib/utils";
import type { ProductCardDTO } from "@/types/dto";
import type { HomeData } from "./types";

/**
 * Four more home-page structures, each a different idea (not just colours).
 * Every text comes from Studio: hero/story/section texts from Content, the
 * small words from Text & labels.
 */

const unique = (list: ProductCardDTO[]) => list.filter((p, i) => list.findIndex((x) => x.id === p.id) === i);

/* ───────────── Marketplace: promo banner, category circles, deals, best sellers ───────────── */

export function MarketplaceHome(d: HomeData) {
  const t = makeT(d.site.labels);
  const hero = d.site.content.hero;
  const sec = d.site.content.sections;
  const side = d.categories.filter((c) => c.image).slice(0, 2);
  const deals = d.deals?.length ? d.deals : d.readyStock;
  const best = d.bestsellers?.length ? d.bestsellers : [];

  return (
    <div className="space-y-14 pb-6 md:space-y-20">
      <section data-studio="hero" className="container pt-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Link href={hero.ctaHref || "/category"} className="group relative flex min-h-[280px] overflow-hidden rounded-lg bg-ink md:min-h-[400px]">
            {d.heroImage && <Image src={d.heroImage.url} alt={d.heroImage.alt} fill priority sizes="(min-width: 1024px) 66vw, 100vw" className="object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105" />}
            <span className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" aria-hidden />
            <span className="relative z-10 mt-auto max-w-lg space-y-3 p-6 text-white md:p-10">
              {hero.eyebrow && <span className="block text-eyebrow uppercase text-white/80">{hero.eyebrow}</span>}
              <span className="block font-display text-[clamp(1.75rem,8vw,2.25rem)] leading-[1.05] [overflow-wrap:anywhere] md:text-6xl"><RichTitle text={hero.title} /></span>
              {hero.subtitle && <span className="block max-w-md text-white/85">{hero.subtitle}</span>}
              <span className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-pill bg-white px-5 text-sm font-semibold text-black">{hero.ctaLabel} <ArrowRight className="size-4" aria-hidden /></span>
            </span>
          </Link>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {side.map((c) => (
              <Link key={c.id} href={`/category/${c.slug}`} className="group relative min-h-[180px] overflow-hidden rounded-lg bg-surface-strong">
                {c.image && <Image src={c.image.url} alt="" fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />}
                <span className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-md bg-canvas/95 px-4 py-3 text-sm font-semibold text-ink shadow-float backdrop-blur">
                  {c.name} <ArrowRight className="size-4 shrink-0" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {d.categories.length > 0 && (
        <section data-studio="categories" className="container space-y-6">
          <SectionHeading eyebrow={sec.categoriesEyebrow} title={<RichTitle text={sec.categoriesTitle} />} href="/category" linkLabel={t("home.allCategories")} />
          <CategoryBlock categories={d.categories} layout="circles" />
        </section>
      )}

      {deals.length > 0 && (
        <section className="container space-y-8">
          <SectionHeading eyebrow={t("home.dealsEyebrow")} title={<RichTitle text={t("home.dealsTitle")} />} href={d.site.shopping.offersPage.enabled ? "/offers" : "/category"} />
          <ProductGrid products={deals.slice(0, 8)} />
        </section>
      )}

      {best.length > 0 && (
        <section className="container space-y-8 rounded-lg bg-surface py-10 md:px-10">
          <SectionHeading eyebrow={sec.readyEyebrow} title={<RichTitle text={t("home.bestTitle")} />} href="/category" />
          <ProductGrid products={best.slice(0, 4)} />
        </section>
      )}

      <section className="container space-y-8">
        <SectionHeading eyebrow={sec.newEyebrow} title={<RichTitle text={sec.newTitle} />} href="/category" />
        <ProductGrid products={d.newest.slice(0, 8)} />
      </section>

      <PromiseStrip {...d.store} />
    </div>
  );
}

/* ───────────── Magazine: masthead, cover story, numbered picks, category index ───────────── */

export function MagazineHome(d: HomeData) {
  const t = makeT(d.site.labels);
  const hero = d.site.content.hero;
  const inside = d.newest.slice(0, 3);
  const picks = unique([...d.readyStock, ...d.newest]).slice(0, 6);
  const month = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="space-y-20 md:space-y-28">
      <section data-studio="hero" className="container space-y-8 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-y-2 border-ink py-2.5 text-eyebrow uppercase">
          <span>{t("home.magazineIssue")}</span>
          <span className="font-display text-lg normal-case tracking-normal">{siteConfig.name}</span>
          <span>{month}</span>
        </div>
        <div className="grid gap-10 lg:grid-cols-12">
          <Link href={hero.ctaHref || "/category"} className="group relative block aspect-[4/3] overflow-hidden rounded-md bg-surface lg:col-span-8">
            {d.heroImage && <Image src={d.heroImage.url} alt={d.heroImage.alt} fill priority sizes="(min-width: 1024px) 66vw, 100vw" className="object-cover transition-transform duration-1000 group-hover:scale-[1.03]" />}
          </Link>
          <div className="flex flex-col gap-6 lg:col-span-4">
            {hero.eyebrow && <p className="eyebrow">{hero.eyebrow}</p>}
            <h1 className="text-h1 leading-[1.02]"><RichTitle text={hero.title} /></h1>
            {hero.subtitle && <p className="text-lg leading-relaxed text-muted first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-5xl first-letter:leading-none">{hero.subtitle}</p>}
            <Button asChild size="lg" className="self-start">
              <Link href={hero.ctaHref || "/category"}>{hero.ctaLabel} <ButtonArrow /></Link>
            </Button>
            {inside.length > 0 && (
              <ol className="mt-auto divide-y divide-line border-t border-line">
                {inside.map((p, i) => (
                  <li key={p.id}>
                    <Link href={`/products/${p.slug}`} className="group flex items-center gap-4 py-3">
                      <span className="font-display text-2xl text-muted">{String(i + 1).padStart(2, "0")}</span>
                      <span className="min-w-0 flex-1"><span className="block truncate font-medium group-hover:underline">{p.name}</span><span className="text-sm text-muted">{formatINR(p.priceFrom)}</span></span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </section>

      {picks.length > 0 && (
        <section className="container space-y-10">
          <SectionHeading eyebrow={t("home.magazineIssue")} title={<RichTitle text={t("home.magazineEditors")} />} href="/category" />
          <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {picks.map((p, i) => (
              <li key={p.id}>
                <Link href={`/products/${p.slug}`} className="group block space-y-4">
                  <span className="relative block aspect-[3/4] overflow-hidden rounded-md bg-surface">
                    {p.image && <Image src={p.image.url} alt={p.image.alt} fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />}
                  </span>
                  <span className="flex items-baseline gap-3">
                    <span className="font-display text-3xl text-accent">N°{i + 1}</span>
                    <span className="min-w-0">
                      <span className="block font-display text-xl leading-snug">{p.name}</span>
                      <span className="text-sm text-muted">{formatINR(p.priceFrom)} · <span className="underline underline-offset-4">{t("home.magazineRead")}</span></span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {d.categories.length > 0 && (
        <section data-studio="categories" className="container grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">{d.site.content.sections.categoriesEyebrow}</p>
            <h2 className="mt-3 text-h2"><RichTitle text={d.site.content.sections.categoriesTitle} /></h2>
          </div>
          <div className="lg:col-span-8"><CategoryBlock categories={d.categories} layout="list" /></div>
        </section>
      )}

      <StorySection image={d.storyImage} content={d.site.content.story} />
      <PromiseStrip {...d.store} />
    </div>
  );
}

/* ───────────── Showcase: centred statement, collections in alternating rows ───────────── */

export function ShowcaseHome(d: HomeData) {
  const t = makeT(d.site.labels);
  const hero = d.site.content.hero;
  const rows = d.categories.slice(0, 4);

  return (
    <div className="space-y-24 md:space-y-32">
      <section data-studio="hero" className="container space-y-12 pt-10 text-center md:pt-16">
        <div className="mx-auto max-w-4xl space-y-6">
          {hero.eyebrow && <p className="eyebrow animate-fade-up">{hero.eyebrow}</p>}
          <h1 className="text-display animate-fade-up [animation-delay:120ms]"><RichTitle text={hero.title} /></h1>
          {hero.subtitle && <p className="mx-auto max-w-xl text-lg text-muted">{hero.subtitle}</p>}
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg"><Link href={hero.ctaHref || "/category"}>{hero.ctaLabel} <ButtonArrow /></Link></Button>
            {hero.secondaryLabel && <Button asChild size="lg" variant="secondary"><Link href={hero.secondaryHref || "/about"}>{hero.secondaryLabel}</Link></Button>}
          </div>
        </div>
        {d.heroImage && (
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-surface md:aspect-[21/9]">
            <Image src={d.heroImage.url} alt={d.heroImage.alt} fill priority sizes="100vw" className="animate-zoom-out object-cover" />
          </div>
        )}
      </section>

      {rows.length > 0 && (
        <section data-studio="categories" className="container space-y-20 md:space-y-28">
          {rows.map((c, i) => (
            <div key={c.id} className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
              <Link href={`/category/${c.slug}`} className={cn("group relative block aspect-[4/5] overflow-hidden rounded-lg bg-surface", i % 2 === 1 && "md:order-2")}>
                {c.image && <Image src={c.image.url} alt={c.image.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-1000 group-hover:scale-105" />}
              </Link>
              <div className="space-y-5">
                <p className="eyebrow">{t("home.zigzagEyebrow")} · {String(i + 1).padStart(2, "0")}</p>
                <h2 className="text-h1">{c.name}</h2>
                {c.children.length > 0 && <p className="text-lg text-muted">{c.children.map((k) => k.name).join(" · ")}</p>}
                <Button asChild variant="secondary" size="lg"><Link href={`/category/${c.slug}`}>{t("home.zigzagCta")} <ButtonArrow /></Link></Button>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="container space-y-10">
        <SectionHeading eyebrow={d.site.content.sections.newEyebrow} title={<RichTitle text={d.site.content.sections.newTitle} />} href="/category" />
        <ProductGrid products={d.newest.slice(0, 4)} />
      </section>

      <ClosingCta content={d.site.content.closing} />
    </div>
  );
}

/* ───────────── Gallery: a picture wall of products ───────────── */

const SHAPES = ["aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[3/5]", "aspect-[4/3]"];

export function GalleryHome(d: HomeData) {
  const t = makeT(d.site.labels);
  const items = unique([...(d.feed?.products ?? []), ...d.newest, ...d.readyStock]).filter((p) => p.image).slice(0, 24);

  return (
    <div className="space-y-10 pb-6">
      <section data-studio="hero" className="container space-y-6 pt-8 text-center md:pt-12">
        <h1 className="text-display"><RichTitle text={t("home.galleryTitle")} /></h1>
        <p className="mx-auto max-w-md text-muted">{t("home.galleryHint")}</p>
        {d.categories.length > 0 && <div className="mx-auto max-w-4xl"><CategoryBlock categories={d.categories} layout="pills" /></div>}
      </section>

      {items.length === 0 ? (
        <p className="container py-16 text-center text-muted">{t("home.empty")}</p>
      ) : (
        <section className="px-3 md:px-5">
          <ul className="columns-2 gap-3 md:columns-3 md:gap-5 lg:columns-4">
            {items.map((p, i) => (
              <li key={p.id} className="mb-3 break-inside-avoid md:mb-5">
                <Link href={`/products/${p.slug}`} className={cn("group relative block overflow-hidden rounded-md bg-surface", SHAPES[i % SHAPES.length])}>
                  <Image src={p.image!.url} alt={p.image!.alt} fill sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute inset-x-0 bottom-0 flex translate-y-0 items-end justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-3 pt-10 text-sm text-white transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
                    <span className="truncate font-medium">{p.name}</span>
                    <span className="shrink-0 tabular-nums">{formatINR(p.priceFrom)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex justify-center">
        <Button asChild size="lg" variant="secondary"><Link href="/category">{t("home.allProducts")} <ButtonArrow /></Link></Button>
      </div>
      <PromiseStrip {...d.store} />
    </div>
  );
}
