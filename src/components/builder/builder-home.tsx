import Image from "next/image";
import Link from "next/link";
import { Award, Clock, Flame, Gift, Hand, Heart, Leaf, Package, Palette, Quote, Shield, Smile, Sparkles, Star, Truck, type LucideIcon } from "lucide-react";
import { RichTitle } from "@/components/content/rich-title";
import { CategoryShowcase } from "@/components/home/category-showcase";
import { ClosingCta } from "@/components/home/closing-cta";
import { Hero } from "@/components/home/hero";
import type { HomeData } from "@/components/home/modes/types";
import { ProcessSection } from "@/components/home/process-section";
import { PromiseStrip } from "@/components/home/promise-strip";
import { SectionHeading } from "@/components/home/section-heading";
import { StorySection } from "@/components/home/story-section";
import { Marquee } from "@/components/motion/marquee";
import { Reveal } from "@/components/motion/reveal";
import { ProductCarousel } from "@/components/product/product-carousel";
import { ProductGrid } from "@/components/product/product-card";
import { ProductListing } from "@/components/product/product-listing";
import { Button, ButtonArrow } from "@/components/ui/button";
import { BUILTIN_TYPES, SECTION_INFO, sectionLabel, type Section } from "@/lib/builder";
import { cn } from "@/lib/utils";
import { Countdown } from "./countdown";
import { RecentlyViewed } from "@/components/shopping/recently-viewed";
import { getBestsellerProducts, getHotDealProducts, getOfferProducts } from "@/services/merch.service";
import { browseProducts, getCategoryBySlug } from "@/services/catalog.service";

const ICONS: Record<string, LucideIcon> = { sparkles: Sparkles, truck: Truck, gift: Gift, leaf: Leaf, heart: Heart, shield: Shield, star: Star, clock: Clock, palette: Palette, package: Package, hand: Hand, flame: Flame, award: Award, smile: Smile };

/** Marks a text line as editable in the Studio preview (double-click to edit). */
const ed = (s: Section, path: string, raw: string) => ({ "data-edit": `builder:${s.id}.${path}`, "data-edit-raw": raw });

const PADDING = { none: "py-0", sm: "py-8 md:py-10", md: "py-12 md:py-20", lg: "py-20 md:py-28", xl: "py-28 md:py-40" } as const;
const WIDTH = { narrow: "container max-w-3xl", normal: "container", wide: "container max-w-[1600px]", full: "w-full" } as const;
const isBuiltin = (t: string) => (BUILTIN_TYPES as readonly string[]).includes(t);

/** The home page as built in Studio → Sections. */
export async function BuilderHome({ data, sections }: { data: HomeData; sections: Section[] }) {
  const visible = sections.filter((s) => s.enabled);
  const rendered = await Promise.all(visible.map((s) => renderSection(s, data)));
  return (
    <div>
      {visible.map((s, i) => (
        <Shell key={s.id} s={s}>{rendered[i]}</Shell>
      ))}
    </div>
  );
}

/** Background, spacing, width, alignment, visibility and the click-to-edit marker. */
function Shell({ s, children }: { s: Section; children: React.ReactNode }) {
  const st = s.style;
  const builtin = isBuiltin(s.type);
  const custom = st.background === "custom" || st.background === "gradient";
  const bg = custom
    ? { background: st.background === "gradient" ? `linear-gradient(135deg, ${st.color || "rgb(var(--accent))"}, ${st.color2 || "rgb(var(--accent-soft))"})` : st.color || undefined }
    : undefined;
  const tone =
    st.background === "ink"
      ? "bg-ink text-canvas [&_:is(h1,h2,h3,p,dd)]:text-canvas [&_:is(.text-muted,dt)]:!text-canvas/75"
      : st.background === "accent"
        ? "bg-accent text-on-accent [&_:is(h1,h2,h3,p,dd)]:text-on-accent [&_:is(.text-muted,dt,.eyebrow)]:!text-on-accent/80 [&_em]:!text-on-accent"
        : st.background === "surface"
          ? "bg-surface"
          : "";
  return (
    <section
      id={st.anchor || undefined}
      data-studio="section"
      data-studio-id={s.id}
      data-studio-name={sectionLabel(s)}
      className={cn(PADDING[st.padding], tone, st.hideOnMobile && "hidden md:block", st.hideOnDesktop && "md:hidden", "scroll-mt-24")}
      style={bg}
    >
      {builtin ? children : (
        <div className={cn(WIDTH[st.width], st.align === "center" && "text-center [&_.sec-inner]:mx-auto")}>
          {st.animate ? <Reveal>{children}</Reveal> : children}
        </div>
      )}
    </section>
  );
}

async function renderSection(s: Section, d: HomeData): Promise<React.ReactNode> {
  const { layout } = d.theme;
  const t = d.site.content.sections;
  switch (s.type) {
    /* ── Built-in blocks ── */
    case "hero":
      return <Hero layout={layout.hero} banner={d.banner} image={d.heroImage} gallery={d.gallery} featured={d.featured} featuredLabel={d.site.content.hero.featuredLabel} slides={d.heroSlides} stats={d.stats} content={d.site.content.hero} search={{ placeholder: d.site.search.placeholder, instant: d.site.search.instant, popular: d.site.search.popular }} />;
    case "marquee":
      return d.tickerItems.length ? <Marquee items={d.tickerItems} className="border-y border-line py-6 md:py-8" /> : null;
    case "categories":
      return <CategoryShowcase categories={d.categories} layout={layout.categories} eyebrow={t.categoriesEyebrow} title={t.categoriesTitle} />;
    case "readyToShip":
      return <div className="container"><ProductCarousel eyebrow={t.readyEyebrow} title={t.readyTitle.replace(/\*/g, "")} products={d.readyStock} href="/category" /></div>;
    case "newArrivals":
      return d.newest.length ? (
        <div className="container space-y-10">
          <SectionHeading eyebrow={t.newEyebrow} title={<RichTitle text={t.newTitle} />} href="/category" />
          <ProductGrid products={d.newest.slice(0, 8)} />
        </div>
      ) : null;
    case "story":
      return <StorySection image={d.storyImage} content={d.site.content.story} />;
    case "process":
      return <ProcessSection content={d.site.content.process} />;
    case "promise":
      return <PromiseStrip {...d.store} />;
    case "closing":
      return <ClosingCta content={d.site.content.closing} />;
    case "shopFeed": {
      const feed = d.feed;
      return feed ? (
        <div className="container space-y-8">
          <h2 className="text-h3">All products <span className="text-base font-normal text-muted">({feed.total})</span></h2>
          <ProductListing products={feed.products} layout={layout.listing} />
          {feed.pageCount > 1 && (
            <nav aria-label="Pagination" className="flex justify-center gap-2">
              {Array.from({ length: feed.pageCount }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={n === 1 ? "/" : `/?page=${n}`} aria-current={n === feed.page ? "page" : undefined} className={cn("flex size-touch items-center justify-center rounded-pill", n === feed.page ? "bg-ink text-canvas" : "bg-surface")}>{n}</Link>
              ))}
            </nav>
          )}
        </div>
      ) : null;
    }

    /* ── Custom sections ── */
    case "heading": {
      const size = { md: "text-h3", lg: "text-h2", xl: "text-h1" }[s.size];
      return (
        <div className="sec-inner max-w-3xl space-y-4">
          {s.eyebrow && <p className="eyebrow section-eyebrow" {...ed(s, "eyebrow", s.eyebrow)}>{s.eyebrow}</p>}
          <h2 className={size} {...ed(s, "title", s.title)}><RichTitle text={s.title} /></h2>
          {s.subtitle && <p className="text-lg leading-relaxed text-muted" {...ed(s, "subtitle", s.subtitle)}>{s.subtitle}</p>}
        </div>
      );
    }
    case "text":
      return (
        <div className="sec-inner max-w-4xl space-y-5">
          {s.title && <h2 className="text-h2" {...ed(s, "title", s.title)}><RichTitle text={s.title} /></h2>}
          <div className={cn("whitespace-pre-line text-lg leading-relaxed", s.columns === 2 && "md:columns-2 md:gap-12")} {...ed(s, "body", s.body)}>{s.body}</div>
        </div>
      );
    case "imageText": {
      const shape = { rounded: "rounded-lg", square: "rounded-none", circle: "rounded-full aspect-square", arch: "rounded-t-full" }[s.imageShape];
      return (
        <div className="grid items-center gap-10 text-left md:grid-cols-2 md:gap-16">
          <div className={cn("fx-photo relative aspect-[4/5] overflow-hidden bg-surface-strong", shape, s.imageSide === "right" && "md:order-2")}>
            {s.image && <Image src={s.image.url} alt={s.image.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />}
          </div>
          <div className="space-y-5">
            {s.eyebrow && <p className="eyebrow section-eyebrow" {...ed(s, "eyebrow", s.eyebrow)}>{s.eyebrow}</p>}
            <h2 className="text-h2" {...ed(s, "title", s.title)}><RichTitle text={s.title} /></h2>
            <p className="whitespace-pre-line text-lg leading-relaxed text-muted" {...ed(s, "body", s.body)}>{s.body}</p>
            {s.ctaLabel && <Button asChild size="lg"><Link href={s.ctaHref || "/category"}><span {...ed(s, "ctaLabel", s.ctaLabel)}>{s.ctaLabel}</span> <ButtonArrow /></Link></Button>}
          </div>
        </div>
      );
    }
    case "banner": {
      const h = { sm: "min-h-[320px]", md: "min-h-[480px]", lg: "min-h-[680px]" }[s.height];
      return (
        <div className={cn("on-photo relative flex items-end overflow-hidden bg-surface-strong text-white", h, s.style.width !== "full" && "rounded-lg")}>
          {s.image && <Image src={s.image.url} alt={s.image.alt} fill sizes="100vw" className="object-cover" />}
          <div aria-hidden className="absolute inset-0 bg-black" style={{ opacity: s.overlay / 100 }} />
          <div className={cn("relative w-full space-y-4 p-8 md:p-14", s.style.align === "center" && "text-center")}>
            <h2 className="text-h1 text-white" {...ed(s, "title", s.title)}><RichTitle text={s.title} emClassName="italic" /></h2>
            {s.subtitle && <p className="max-w-xl text-lg text-white/85 [.text-center_&]:mx-auto" {...ed(s, "subtitle", s.subtitle)}>{s.subtitle}</p>}
            {s.ctaLabel && <Button asChild size="lg" className="bg-white text-black hover:bg-white/90"><Link href={s.ctaHref || "/category"}><span {...ed(s, "ctaLabel", s.ctaLabel)}>{s.ctaLabel}</span> <ButtonArrow /></Link></Button>}
          </div>
        </div>
      );
    }
    case "features": {
      const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[s.columns as 2 | 3 | 4];
      return (
        <div className="space-y-10">
          {(s.eyebrow || s.title) && (
            <div className="sec-inner max-w-2xl space-y-3">
              {s.eyebrow && <p className="eyebrow section-eyebrow" {...ed(s, "eyebrow", s.eyebrow)}>{s.eyebrow}</p>}
              {s.title && <h2 className="text-h2" {...ed(s, "title", s.title)}><RichTitle text={s.title} /></h2>}
            </div>
          )}
          <ul className={cn("grid gap-6", cols)}>
            {s.items.map((it, i) => {
              const Icon = ICONS[it.icon] ?? Sparkles;
              return (
                <li key={i} className="fx-panel space-y-3 rounded-lg border border-line bg-paper/60 p-6 text-left">
                  <span className="flex size-11 items-center justify-center rounded-full bg-accent/10 text-accent"><Icon className="size-5" aria-hidden /></span>
                  <h3 className="font-sans text-lg font-semibold" {...ed(s, `items.${i}.title`, it.title)}>{it.title}</h3>
                  <p className="text-muted" {...ed(s, `items.${i}.body`, it.body)}>{it.body}</p>
                </li>
              );
            })}
          </ul>
        </div>
      );
    }
    case "stats":
      return (
        <div className="space-y-8">
          {s.title && <h2 className="text-h2" {...ed(s, "title", s.title)}><RichTitle text={s.title} /></h2>}
          <dl className="grid grid-cols-2 gap-8 md:grid-cols-4 md:[grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
            {s.items.map((it, i) => (
              <div key={i}>
                <dd className="font-display text-5xl leading-none md:text-6xl" {...ed(s, `items.${i}.value`, it.value)}>{it.value}</dd>
                <dt className="mt-2 text-muted" {...ed(s, `items.${i}.label`, it.label)}>{it.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      );
    case "testimonials":
      return (
        <div className="space-y-10">
          <div className="sec-inner max-w-2xl space-y-3">
            {s.eyebrow && <p className="eyebrow section-eyebrow" {...ed(s, "eyebrow", s.eyebrow)}>{s.eyebrow}</p>}
            {s.title && <h2 className="text-h2" {...ed(s, "title", s.title)}><RichTitle text={s.title} /></h2>}
          </div>
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {s.items.map((it, i) => (
              <li key={i} className="fx-panel flex flex-col justify-between gap-6 rounded-lg border border-line bg-paper/60 p-7 text-left">
                <Quote className="size-6 text-accent" aria-hidden />
                <blockquote className="font-display text-2xl leading-snug" {...ed(s, `items.${i}.quote`, it.quote)}>{it.quote}</blockquote>
                <p className="text-sm"><span className="font-semibold" {...ed(s, `items.${i}.name`, it.name)}>{it.name}</span>{it.role && <span className="text-muted"> · <span {...ed(s, `items.${i}.role`, it.role)}>{it.role}</span></span>}</p>
              </li>
            ))}
          </ul>
        </div>
      );
    case "faq":
      return (
        <div className="sec-inner max-w-3xl space-y-8">
          {s.title && <h2 className="text-h2" {...ed(s, "title", s.title)}><RichTitle text={s.title} /></h2>}
          <div className="divide-y divide-line border-y border-line text-left">
            {s.items.map((it, i) => (
              <details key={i} className="group py-1">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
                  <span {...ed(s, `items.${i}.q`, it.q)}>{it.q}</span>
                  <span aria-hidden className="text-2xl text-muted transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="whitespace-pre-line pb-5 text-muted" {...ed(s, `items.${i}.a`, it.a)}>{it.a}</p>
              </details>
            ))}
          </div>
        </div>
      );
    case "cta":
      return (
        <div className="sec-inner flex max-w-4xl flex-col gap-6 [.text-center_&]:items-center">
          <h2 className="text-h1" {...ed(s, "title", s.title)}><RichTitle text={s.title} /></h2>
          {s.body && <p className="max-w-xl text-lg opacity-80" {...ed(s, "body", s.body)}>{s.body}</p>}
          <div className="flex flex-wrap gap-3 [.text-center_&]:justify-center">
            {s.ctaLabel && <Button asChild size="lg"><Link href={s.ctaHref || "/category"}><span {...ed(s, "ctaLabel", s.ctaLabel)}>{s.ctaLabel}</span> <ButtonArrow /></Link></Button>}
            {s.secondaryLabel && <Button asChild size="lg" variant="secondary"><Link href={s.secondaryHref || "/about"}><span {...ed(s, "secondaryLabel", s.secondaryLabel)}>{s.secondaryLabel}</span></Link></Button>}
          </div>
        </div>
      );
    case "gallery": {
      const cols = { 2: "grid-cols-2", 3: "grid-cols-2 md:grid-cols-3", 4: "grid-cols-2 md:grid-cols-4", 5: "grid-cols-2 md:grid-cols-5", 6: "grid-cols-3 md:grid-cols-6" }[s.columns as 2 | 3 | 4 | 5 | 6];
      const ratio = { square: "aspect-square", portrait: "aspect-[3/4]", landscape: "aspect-[4/3]" }[s.shape];
      return (
        <div className="space-y-8">
          {s.title && <h2 className="text-h2" {...ed(s, "title", s.title)}><RichTitle text={s.title} /></h2>}
          {s.images.length ? (
            <ul className={cn("grid gap-3 md:gap-4", cols)}>
              {s.images.map((img, i) => (
                <li key={i} className={cn("fx-panel relative overflow-hidden rounded-md bg-surface", ratio)}>
                  <Image src={img.url} alt={img.alt} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover transition-transform duration-700 hover:scale-105" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">Add photos to this gallery in Studio → Sections.</p>
          )}
        </div>
      );
    }
    case "products": {
      const cat = s.source === "category" && s.category ? await getCategoryBySlug(s.category) : null;
      const sh = d.site.shopping;
      // Offers / hot deals / most ordered come from Studio → Shopping.
      const products =
        s.source === "offers" ? await getOfferProducts({ productIds: sh.offers.productIds, includeDiscounted: sh.offers.includeDiscounted }, s.count)
        : s.source === "hotDeals" ? await getHotDealProducts(sh.hotDeals.productIds)
        : s.source === "bestsellers" ? await getBestsellerProducts({ mode: sh.bestsellers.mode, productIds: sh.bestsellers.productIds, count: s.count })
        : (await browseProducts({
            sort: s.source === "rating" ? "rating" : "new",
            availability: s.source === "ready" ? "READY_STOCK" : undefined,
            categoryIds: cat?.productCategoryIds,
          })).products;
      const list = products.slice(0, s.count);
      const toOffers = s.source === "offers" || s.source === "hotDeals" || s.source === "bestsellers";
      const href = cat ? `/category/${cat.slug}` : s.source === "ready" ? "/search?availability=READY_STOCK" : toOffers ? `/offers#${s.source === "hotDeals" ? "hot-deals" : s.source === "bestsellers" ? "most-ordered" : "offers"}` : "/category";
      return (
        <div className="space-y-10 text-left">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-3">
              {s.eyebrow && <p className="eyebrow section-eyebrow" {...ed(s, "eyebrow", s.eyebrow)}>{s.eyebrow}</p>}
              {s.title && <h2 className="text-h2" {...ed(s, "title", s.title)}><RichTitle text={s.title} /></h2>}
            </div>
            {s.linkLabel && <Button asChild variant="link"><Link href={href}><span {...ed(s, "linkLabel", s.linkLabel)}>{s.linkLabel}</span> <ButtonArrow /></Link></Button>}
          </div>
          {list.length ? <ProductListing products={list} layout={s.layout} /> : <p className="text-muted">No products match yet.</p>}
        </div>
      );
    }
    case "countdown":
      return (
        <div className="grid items-center gap-8 text-left md:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            {s.eyebrow && <p className="eyebrow section-eyebrow" {...ed(s, "eyebrow", s.eyebrow)}>{s.eyebrow}</p>}
            <h2 className="text-h2" {...ed(s, "title", s.title)}><RichTitle text={s.title} /></h2>
            {s.body && <p className="max-w-lg text-lg opacity-80" {...ed(s, "body", s.body)}>{s.body}</p>}
            {s.ctaLabel && <Button asChild size="lg"><Link href={s.ctaHref || "/category"}><span {...ed(s, "ctaLabel", s.ctaLabel)}>{s.ctaLabel}</span> <ButtonArrow /></Link></Button>}
          </div>
          {s.endsAt ? <Countdown endsAt={s.endsAt} endedText={s.endedText} /> : <p className="text-muted">Set an end date in Studio → Sections.</p>}
        </div>
      );
    case "recentlyViewed":
      return d.site.shopping.recentlyViewed.enabled ? <RecentlyViewed title={s.title} count={s.count} className="text-left" /> : null;
    case "trustBar":
      return (
        <ul className="grid gap-x-8 gap-y-3 border-y border-line py-4 text-sm sm:grid-cols-2 lg:[grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
          {s.items.map((it, i) => {
            const Icon = ICONS[it.icon] ?? Sparkles;
            return (
              <li key={i} className="flex items-center gap-3 uppercase tracking-[0.08em]">
                <Icon className="size-4 shrink-0 text-accent" aria-hidden />
                <span {...ed(s, `items.${i}.label`, it.label)}>{it.label}</span>
              </li>
            );
          })}
        </ul>
      );
    case "spacer": {
      const h = { sm: "h-6", md: "h-14", lg: "h-28" }[s.size];
      return <div className={cn(h, "flex items-center")}>{s.line && <hr className="w-full border-line" />}</div>;
    }
    default:
      return <p className="text-muted">{SECTION_INFO[(s as Section).type]?.label ?? "Section"}</p>;
  }
}
