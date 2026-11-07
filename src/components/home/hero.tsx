import Image from "next/image";
import Link from "next/link";
import { Button, ButtonArrow } from "@/components/ui/button";
import { SearchBox, type SearchBoxConfig } from "@/components/search/search-box";
import { HeroSlides } from "./hero-slides";
import type { HeroLayout } from "@/config/themes";
import { defaultSiteConfig, titleLines, type SiteConfig } from "@/lib/site-config";
import { cn, formatINR } from "@/lib/utils";
import type { ImageDTO, ProductCardDTO } from "@/types/dto";

type Stat = { value: number; label: string };

type Props = {
  /** Owner-managed banner (HomepageBanner) overrides the default copy and image. */
  banner?: { title: string; subtitle: string; ctaLabel: string; ctaHref: string; image?: ImageDTO };
  image?: ImageDTO;
  featured?: ProductCardDTO;
  stats: Stat[];
  /** Layout picked by the active theme (Admin → Studio → Theme). */
  layout?: HeroLayout;
  /** Extra photos for the collage layout. */
  gallery?: ImageDTO[];
  /** Label on the featured card (Studio → Content → Hero). */
  featuredLabel?: string;
  /** Pictures to cycle through (Studio → Content → Hero → change automatically). */
  slides?: ImageDTO[];
  /** Search settings for the "search" hero. */
  search?: SearchBoxConfig;
  /** Hero text from Admin → Studio → Content (a homepage banner still wins). */
  content?: SiteConfig["content"]["hero"];
};

const DEFAULTS = defaultSiteConfig.content.hero;

/** Turns "for the *everyday*" into text with one italic, accented word. */
function Emphasis({ text, accent = "text-accent" }: { text: string; accent?: string }) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("*") ? (
          <em key={i} className={cn("italic", accent)}>{p.slice(1, -1)}</em>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export function Hero({ layout = "split", ...props }: Props) {
  if (layout === "centered") return <CenteredHero {...props} />;
  if (layout === "fullbleed") return <FullBleedHero {...props} />;
  if (layout === "editorial") return <EditorialHero {...props} />;
  if (layout === "minimal") return <MinimalHero {...props} />;
  if (layout === "collage") return <CollageHero {...props} />;
  if (layout === "framed") return <FramedHero {...props} />;
  if (layout === "search") return <SearchHero {...props} />;
  return <SplitHero {...props} />;
}

/* ───────────── Shared pieces ───────────── */

function useHeroContent({ banner, image, slides, content = DEFAULTS }: Omit<Props, "layout">) {
  return {
    eyebrow: content.eyebrow,
    lines: titleLines(banner?.title || content.title),
    sub: banner?.subtitle || content.subtitle,
    ctaHref: banner?.ctaHref || content.ctaHref || "/category",
    ctaLabel: banner?.ctaLabel || content.ctaLabel,
    secondaryHref: content.secondaryHref,
    secondaryLabel: content.secondaryLabel,
    // The home page already picks Studio picture → banner picture → product photo.
    heroImage: image ?? banner?.image,
    fit: content.imageFit,
    slides: slides && slides.length > 1 ? { images: slides, seconds: content.rotateSeconds } : undefined,
    // Double-click to edit in the Studio preview (only text that comes from Studio, not a banner).
    eyebrowEdit: { "data-edit": "content:hero.eyebrow", "data-edit-raw": content.eyebrow },
    subEdit: banner?.subtitle ? {} : { "data-edit": "content:hero.subtitle", "data-edit-raw": content.subtitle },
  };
}

export function Headline({ lines, className, accent }: { lines: string[]; className?: string; accent?: string }) {
  return (
    // Not cn(): tailwind-merge would treat text-display (size) and text-white (colour) as a conflict.
    <h1 className={`text-display ${className ?? ""}`}>
      {lines.map((line, i) => (
        <span key={i} className="line-mask">
          <span className="animate-rise-in" style={{ animationDelay: `${150 + i * 120}ms` }}>
            <Emphasis text={line} accent={accent} />
          </span>
        </span>
      ))}
    </h1>
  );
}

function Ctas({
  href, label, secondaryHref, secondaryLabel, className, onPhoto = false,
}: { href: string; label: string; secondaryHref?: string; secondaryLabel?: string; className?: string; onPhoto?: boolean }) {
  return (
    <div className={cn("flex animate-fade-up flex-wrap gap-3 [animation-delay:720ms]", className)}>
      {/* On a photo the colours are fixed (white on dark wash), whatever the theme is */}
      <Button asChild size="lg" className={onPhoto ? "bg-white text-black hover:bg-white/90" : undefined}>
        <Link href={href}>
          {label} <ButtonArrow />
        </Link>
      </Button>
      {secondaryLabel && <Button
        asChild
        size="lg"
        variant="secondary"
        className={onPhoto ? "border-white/50 text-white hover:border-white hover:bg-white hover:text-black" : undefined}
      >
        <Link href={secondaryHref || "/about"}>{secondaryLabel}</Link>
      </Button>}
    </div>
  );
}

function Stats({ stats, className, onPhoto = false }: { stats: Stat[]; className?: string; onPhoto?: boolean }) {
  if (!stats.length) return null;
  return (
    <dl className={cn("flex animate-fade-up gap-10 border-t pt-8 [animation-delay:860ms]", onPhoto ? "border-white/25" : "border-line", className)}>
      {stats.map((s) => (
        <div key={s.label}>
          <dt className="sr-only">{s.label}</dt>
          <dd className="font-display text-5xl leading-none">{s.value}</dd>
          <dd aria-hidden className={cn("mt-2 text-sm", onPhoto ? "text-white/75" : "text-muted")}>{s.label}</dd>
        </div>
      ))}
    </dl>
  );
}

function HeroImage({ image, className, sizes, children, fit = "cover", slides }: { image?: ImageDTO; className?: string; sizes: string; children?: React.ReactNode; fit?: "cover" | "contain"; slides?: { images: ImageDTO[]; seconds: number } }) {
  return (
    <div className={cn("fx-photo overflow-hidden bg-surface-strong", className)}>
      {slides ? (
        <HeroSlides images={slides.images} seconds={slides.seconds} sizes={sizes} fit={fit} />
      ) : image ? (
        <Image src={image.url} alt={image.alt} fill priority sizes={sizes} className={cn("animate-zoom-out [animation-delay:200ms]", fit === "contain" ? "object-contain p-4" : "object-cover")} />
      ) : (
        <div className="flex h-full items-center justify-center p-10 text-center text-muted">
          Upload a hero picture in Admin → Studio → Content → Hero, or add product photos, to fill this space.
        </div>
      )}
      {children}
    </div>
  );
}

function FeaturedCard({ featured, className, label = "Featured" }: { featured?: ProductCardDTO; className?: string; label?: string }) {
  if (!featured) return null;
  return (
    <Link href={`/products/${featured.slug}`} className={cn("group animate-fade-up [animation-delay:1250ms]", className)}>
      <div className="flex animate-float items-center gap-4 rounded-md bg-canvas/95 p-3 pr-5 text-ink shadow-float backdrop-blur transition-transform duration-500 group-hover:-translate-y-1">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-sm bg-surface">
          {featured.image && <Image src={featured.image.url} alt="" fill sizes="64px" className="object-cover transition-transform duration-700 group-hover:scale-110" />}
        </div>
        <div className="min-w-0">
          <p className="text-eyebrow uppercase text-accent">{label}</p>
          <p className="truncate font-medium">{featured.name}</p>
          <p className="text-sm text-muted">From {formatINR(featured.priceFrom)}</p>
        </div>
      </div>
    </Link>
  );
}

function RotatingBadge({ className }: { className?: string }) {
  return (
    <Link
      href="#shop"
      aria-label="Scroll to categories"
      className={cn("group absolute flex size-28 animate-fade-up items-center justify-center rounded-full bg-canvas text-ink shadow-float [animation-delay:1100ms] md:size-32", className)}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 animate-spin-slow" aria-hidden>
        <defs>
          <path id="badge-circle" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <text className="fill-ink text-[9.5px] uppercase tracking-[0.28em]">
          <textPath href="#badge-circle">Handmade · Clay &amp; Glaze · Handmade ·</textPath>
        </text>
      </svg>
      <svg viewBox="0 0 24 24" className="size-6 transition-transform duration-500 group-hover:translate-y-1" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M12 5v14M6 13l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

/* ───────────── Split: copy left, framed photo right (Stone & Ink) ───────────── */

function SplitHero(props: Omit<Props, "layout">) {
  const c = useHeroContent(props);
  return (
    <section data-studio="hero" className="hero-root relative overflow-hidden">
      {/* soft clay-tone wash behind the composition */}
      <div aria-hidden className="pointer-events-none absolute -right-40 top-10 hidden size-[640px] rounded-full bg-surface blur-3xl lg:block" />

      <div className="container relative grid gap-12 pb-16 pt-8 lg:min-h-[min(calc(100svh-var(--header-h)),860px)] lg:grid-cols-12 lg:items-center lg:gap-8 lg:pb-24">
        <div className="lg:col-span-6">
          <p className="eyebrow animate-fade-up" {...c.eyebrowEdit}>{c.eyebrow}</p>
          <Headline lines={c.lines} className="mt-6" />
          <p className="mt-8 max-w-md animate-fade-up text-lg leading-relaxed text-muted [animation-delay:600ms]" {...c.subEdit}>{c.sub}</p>
          <Ctas href={c.ctaHref} label={c.ctaLabel} secondaryHref={c.secondaryHref} secondaryLabel={c.secondaryLabel} className="mt-10" />
          <Stats stats={props.stats} className="mt-14" />
        </div>

        <div className="relative h-[68svh] max-h-[640px] min-h-[420px] lg:col-span-6 lg:h-[80svh] lg:max-h-[760px]">
          <HeroImage image={c.heroImage} fit={c.fit} slides={c.slides} sizes="(min-width: 1024px) 50vw, 100vw" className="absolute inset-0 animate-clip-up rounded-lg lg:left-[8%] [animation-delay:200ms]">
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/20 via-transparent to-transparent" />
          </HeroImage>
          <RotatingBadge className="-top-4 right-4 lg:-right-4" />
          <FeaturedCard featured={props.featured} label={props.featuredLabel} className="absolute -bottom-6 left-4 right-4 sm:right-auto sm:w-80 lg:-left-2" />
        </div>
      </div>
    </section>
  );
}

/* ───────────── Centred: big centred headline, wide photo below (Sage, Blush) ───────────── */

function CenteredHero(props: Omit<Props, "layout">) {
  const c = useHeroContent(props);
  return (
    <section data-studio="hero" className="hero-root relative overflow-hidden pb-6 pt-10 md:pt-16">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 size-[720px] -translate-x-1/2 rounded-full bg-surface blur-3xl" />
      <div className="container relative flex flex-col items-center text-center">
        <p className="eyebrow animate-fade-up rounded-pill border border-line bg-paper/60 px-4 py-1.5" {...c.eyebrowEdit}>{c.eyebrow}</p>
        <Headline lines={c.lines} className="mt-8 max-w-5xl" />
        <p className="mt-8 max-w-xl animate-fade-up text-lg leading-relaxed text-muted [animation-delay:600ms]" {...c.subEdit}>{c.sub}</p>
        <Ctas href={c.ctaHref} label={c.ctaLabel} secondaryHref={c.secondaryHref} secondaryLabel={c.secondaryLabel} className="mt-10 justify-center" />
      </div>

      <div className="container relative mt-14 md:mt-20">
        <div className="relative">
          <HeroImage
            image={c.heroImage} fit={c.fit} slides={c.slides}
            sizes="100vw"
            className="relative aspect-[4/5] animate-clip-up rounded-lg sm:aspect-[16/9] lg:aspect-[21/9] [animation-delay:300ms]"
          />
          <FeaturedCard featured={props.featured} label={props.featuredLabel} className="absolute -bottom-6 left-4 right-4 sm:left-8 sm:right-auto sm:w-80" />
        </div>
        <Stats stats={props.stats} className="mx-auto mt-16 max-w-xl justify-center border-t-0 pt-0 text-center" />
      </div>
    </section>
  );
}

/* ───────────── Full-bleed: photo fills the screen, copy on top (Harbour, Midnight) ───────────── */

function FullBleedHero(props: Omit<Props, "layout">) {
  const c = useHeroContent(props);
  return (
    <section data-studio="hero" className="hero-root on-photo relative flex min-h-[min(calc(100svh-var(--header-h)),900px)] items-end overflow-hidden text-white">
      <HeroImage image={c.heroImage} fit={c.fit} slides={c.slides} sizes="100vw" className="absolute inset-0">
        {/* Fixed dark wash: the copy sits on a photo, whatever the theme colours are */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
      </HeroImage>

      <div className="container relative grid gap-10 pb-14 pt-24 md:pb-20 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <p className="text-eyebrow animate-fade-up uppercase text-white/80" {...c.eyebrowEdit}>{c.eyebrow}</p>
          <Headline lines={c.lines} className="mt-6 text-white" accent="text-accent-soft" />
          <p className="mt-8 max-w-lg animate-fade-up text-lg leading-relaxed text-white/80 [animation-delay:600ms]" {...c.subEdit}>{c.sub}</p>
          <Ctas href={c.ctaHref} label={c.ctaLabel} secondaryHref={c.secondaryHref} secondaryLabel={c.secondaryLabel} className="mt-10" onPhoto />
        </div>
        <div className="space-y-8 lg:col-span-4 lg:justify-self-end">
          <Stats stats={props.stats} onPhoto />
          <FeaturedCard featured={props.featured} label={props.featuredLabel} className="block sm:w-80" />
        </div>
      </div>
    </section>
  );
}

/* ───────────── Editorial: photo left, numbered copy right, hard rules (Gallery Mono) ───────────── */

function EditorialHero(props: Omit<Props, "layout">) {
  const c = useHeroContent(props);
  return (
    <section data-studio="hero" className="hero-root border-b border-line">
      <div className="container grid gap-0 lg:min-h-[min(calc(100svh-var(--header-h)),820px)] lg:grid-cols-2">
        <HeroImage
          image={c.heroImage} fit={c.fit} slides={c.slides}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="relative aspect-square animate-clip-up border border-line lg:aspect-auto [animation-delay:150ms]"
        />
        <div className="flex flex-col justify-between border-x border-b border-line lg:border-l-0 lg:border-t">
          <div className="flex items-center justify-between border-b border-line px-6 py-4 text-eyebrow uppercase">
            <span>Index / 01</span>
            <span className="text-muted" {...c.eyebrowEdit}>{c.eyebrow}</span>
          </div>
          <div className="px-6 py-10 md:px-10 md:py-14">
            <Headline lines={c.lines} />
            <p className="mt-8 max-w-md animate-fade-up leading-relaxed text-muted [animation-delay:600ms]" {...c.subEdit}>{c.sub}</p>
            <Ctas href={c.ctaHref} label={c.ctaLabel} secondaryHref={c.secondaryHref} secondaryLabel={c.secondaryLabel} className="mt-10" />
          </div>
          <div className="grid grid-cols-1 border-t border-line sm:grid-cols-[1fr_auto]">
            <Stats stats={props.stats} className="border-t-0 px-6 py-6" />
            <FeaturedCard featured={props.featured} label={props.featuredLabel} className="block p-4 sm:w-80" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Minimal: type only, no hero photo (Nordic Frost) ───────────── */

function MinimalHero(props: Omit<Props, "layout">) {
  const c = useHeroContent(props);
  return (
    <section data-studio="hero" className="hero-root container pb-10 pt-16 md:pb-16 md:pt-28">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-9">
          <p className="eyebrow animate-fade-up" {...c.eyebrowEdit}>{c.eyebrow}</p>
          <Headline lines={c.lines} className="mt-8" />
        </div>
        <div className="space-y-8 lg:col-span-3 lg:pb-3">
          <p className="animate-fade-up leading-relaxed text-muted [animation-delay:600ms]" {...c.subEdit}>{c.sub}</p>
          <Ctas href={c.ctaHref} label={c.ctaLabel} secondaryHref={c.secondaryHref} secondaryLabel={c.secondaryLabel} />
        </div>
      </div>
      <div className="mt-14 flex flex-wrap items-end justify-between gap-8 border-t border-line pt-8">
        <Stats stats={props.stats} className="border-t-0 pt-0" />
        <FeaturedCard featured={props.featured} label={props.featuredLabel} className="block w-full sm:w-80" />
      </div>
    </section>
  );
}

/* ───────────── Collage: copy beside three overlapping photos (Terracotta, Coastal) ───────────── */

function CollageHero(props: Omit<Props, "layout">) {
  const c = useHeroContent(props);
  const extra = (props.gallery ?? []).filter((g) => g.url !== c.heroImage?.url);
  const [second, third] = [extra[0] ?? c.heroImage, extra[1] ?? c.heroImage];
  return (
    <section data-studio="hero" className="hero-root relative overflow-hidden">
      <div className="container grid gap-14 pb-20 pt-10 lg:min-h-[min(calc(100svh-var(--header-h)),820px)] lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="lg:col-span-5">
          <p className="eyebrow animate-fade-up" {...c.eyebrowEdit}>{c.eyebrow}</p>
          <Headline lines={c.lines} className="mt-6" />
          <p className="mt-8 max-w-md animate-fade-up text-lg leading-relaxed text-muted [animation-delay:600ms]" {...c.subEdit}>{c.sub}</p>
          <Ctas href={c.ctaHref} label={c.ctaLabel} secondaryHref={c.secondaryHref} secondaryLabel={c.secondaryLabel} className="mt-10" />
          <Stats stats={props.stats} className="mt-12" />
        </div>

        <div className="relative h-[520px] sm:h-[600px] lg:col-span-7">
          <HeroImage image={c.heroImage} fit={c.fit} slides={c.slides} sizes="(min-width: 1024px) 35vw, 70vw" className="absolute left-0 top-0 h-[78%] w-[58%] animate-clip-up rounded-lg shadow-float [animation-delay:150ms]" />
          <HeroImage image={second} sizes="(min-width: 1024px) 25vw, 50vw" className="absolute right-0 top-[8%] h-[46%] w-[38%] animate-clip-up rounded-lg shadow-float [animation-delay:350ms]" />
          <HeroImage image={third} sizes="(min-width: 1024px) 28vw, 55vw" className="absolute bottom-0 right-[8%] h-[40%] w-[48%] animate-clip-up rounded-lg shadow-float [animation-delay:550ms]" />
          <RotatingBadge className="bottom-[34%] left-[46%] z-10" />
          <FeaturedCard featured={props.featured} label={props.featuredLabel} className="absolute -bottom-4 left-0 z-10 w-[min(20rem,90%)]" />
        </div>
      </div>
    </section>
  );
}

/* ───────────── Framed: overlapping photos on offset frames, sticker and price callout ───────────── */

function FramedHero(props: Omit<Props, "layout">) {
  const c = useHeroContent(props);
  const extra = (props.gallery ?? []).filter((g) => g.url !== c.heroImage?.url);
  const second = extra[0] ?? c.heroImage;
  return (
    <section data-studio="hero" className="hero-root relative overflow-hidden">
      <div className="container grid gap-14 pb-20 pt-10 lg:min-h-[min(calc(100svh-var(--header-h)),800px)] lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="lg:col-span-6">
          <p className="eyebrow animate-fade-up !text-accent" {...c.eyebrowEdit}>{c.eyebrow}</p>
          <Headline lines={c.lines} className="mt-5" />
          <p className="mt-7 max-w-md animate-fade-up leading-relaxed text-muted [animation-delay:600ms]" {...c.subEdit}>{c.sub}</p>
          <Ctas href={c.ctaHref} label={c.ctaLabel} secondaryHref={c.secondaryHref} secondaryLabel={c.secondaryLabel} className="mt-9" />
          <Stats stats={props.stats} className="mt-12 [&_dd.font-display]:text-4xl [&_dd.font-display]:text-accent" />
        </div>

        <div className="relative h-[480px] sm:h-[560px] lg:col-span-6">
          {/* offset frames behind the photos */}
          <span aria-hidden className="absolute right-0 top-0 h-[70%] w-[68%] translate-x-3 translate-y-3 bg-accent/15" />
          <HeroImage image={c.heroImage} fit={c.fit} slides={c.slides} sizes="(min-width: 1024px) 34vw, 70vw" className="absolute right-0 top-0 h-[70%] w-[68%] animate-clip-up [animation-delay:150ms]" />
          <span aria-hidden className="absolute bottom-[6%] left-0 h-[52%] w-[42%] -translate-x-3 translate-y-3 bg-ink/10" />
          <HeroImage image={second} sizes="(min-width: 1024px) 22vw, 45vw" className="absolute bottom-[6%] left-0 h-[52%] w-[42%] animate-clip-up border-4 border-canvas [animation-delay:350ms]" />
          {/* round sticker */}
          <span className="absolute -top-4 right-0 z-10 flex size-24 rotate-12 animate-fade-up flex-col items-center justify-center rounded-full bg-accent text-center text-on-accent shadow-float [animation-delay:900ms] md:size-28">
            <span className="text-[10px] uppercase tracking-[0.2em]">New</span>
            <span className="font-display text-2xl leading-none">drop</span>
          </span>
          {/* featured price callout */}
          {props.featured && (
            <Link href={`/products/${props.featured.slug}`} className="absolute bottom-0 right-2 z-10 min-w-48 animate-fade-up border border-line bg-paper/95 px-4 py-3 text-ink shadow-float backdrop-blur [animation-delay:1100ms]">
              <span className="block text-[11px] uppercase tracking-[0.14em] text-muted">01 — {props.featured.name}</span>
              <span className="text-lg font-semibold text-accent">{formatINR(props.featured.priceFrom)}</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/* ───────────── Search: full-width photo, tinted, with a big search box (marketplace style) ───────────── */

function SearchHero(props: Omit<Props, "layout">) {
  const c = useHeroContent(props);
  const search = props.search ?? { placeholder: "Search the shop", instant: true, popular: [] };
  return (
    <section data-studio="hero" className="hero-root on-photo relative overflow-hidden text-white">
      <HeroImage image={c.heroImage} fit={c.fit} slides={c.slides} sizes="100vw" className="absolute inset-0">
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-accent/55 via-black/45 to-black/70" />
      </HeroImage>
      <div className="container relative flex min-h-[560px] flex-col items-center justify-center gap-6 py-20 text-center md:min-h-[640px]">
        <p className="text-eyebrow animate-fade-up uppercase text-white/85" {...c.eyebrowEdit}>{c.eyebrow}</p>
        <Headline lines={c.lines} className="max-w-4xl text-white" accent="text-accent-soft" />
        <p className="max-w-xl animate-fade-up text-lg text-white/85 [animation-delay:500ms]" {...c.subEdit}>{c.sub}</p>
        <SearchBox config={search} className="w-full max-w-xl animate-fade-up text-left text-ink [animation-delay:650ms]" />
        <Stats stats={props.stats} onPhoto className="mt-4 justify-center border-t-0 pt-0" />
      </div>
    </section>
  );
}
