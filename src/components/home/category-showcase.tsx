import { makeT } from "@/lib/labels";
import { getSiteConfig } from "@/services/site-config.service";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { RichTitle } from "@/components/content/rich-title";
import { Reveal } from "@/components/motion/reveal";
import type { CategoryLayout } from "@/config/themes";
import { cn } from "@/lib/utils";
import type { CategoryDTO } from "@/types/dto";
import { SectionHeading } from "./section-heading";

type Props = { categories: CategoryDTO[]; layout?: CategoryLayout };
type ShowcaseProps = Props & { eyebrow?: string; title?: string; linkLabel?: string };

/** Category section of the landing page; the layout comes from the active theme. */
export async function CategoryShowcase({ categories, layout = "mosaic", eyebrow, title = "Find your *piece*", linkLabel }: ShowcaseProps) {
  const t = makeT((await getSiteConfig()).labels);
  eyebrow ??= t("home.shopByCategory");
  linkLabel ??= t("home.allCategories");
  if (!categories.length) return null;
  return (
    <section id="shop" data-studio="categories" className="container scroll-mt-24 space-y-10">
      <SectionHeading eyebrow={eyebrow} title={<RichTitle text={title} />} href="/category" linkLabel={linkLabel} />
      <CategoryBlock categories={categories} layout={layout} />
    </section>
  );
}

/** The category grid/list on its own (also used by the direct-shop and bento home pages). */
export function CategoryBlock({ categories, layout = "mosaic" }: Props) {
  if (layout === "cards") return <CardsLayout categories={categories} />;
  if (layout === "list") return <ListLayout categories={categories} />;
  if (layout === "circles") return <CirclesLayout categories={categories} />;
  if (layout === "pills") return <PillsLayout categories={categories} />;
  if (layout === "tiles") return <TilesLayout categories={categories} />;
  return <MosaicLayout categories={categories} />;
}

const subLabel = (c: CategoryDTO) =>
  c.children.length ? c.children.slice(0, 3).map((k) => k.name).join(" · ") + (c.children.length > 3 ? ` +${c.children.length - 3}` : "") : "";

/* ───────────── Mosaic: one tall tile, the rest fill around it ───────────── */

/**
 * The 2×2 block beside the big tile is always filled completely:
 * 1 tile → 2×2, 2 → two wide rows, 3 → two squares + one wide, 4 → four squares.
 */
function smallSpan(count: number, index: number) {
  if (count === 1) return "col-span-2 md:row-span-2";
  if (count === 2) return "col-span-2";
  if (count === 3 && index === 2) return "col-span-2";
  return "";
}

function MosaicLayout({ categories }: { categories: CategoryDTO[] }) {
  const tiles = categories.slice(0, 5);
  return (
    <ul className="grid grid-cols-2 gap-4 md:auto-rows-[290px] md:grid-cols-4 md:gap-6">
      {tiles.map((c, i) => {
        const big = i === 0;
        return (
          <Reveal as="li" key={c.id} delay={i * 90} className={cn("min-h-0", big ? "col-span-2 md:row-span-2" : smallSpan(tiles.length - 1, i - 1))}>
            <Link href={`/category/${c.slug}`} className="group relative block h-full overflow-hidden rounded-lg bg-surface-strong">
              <div className={cn("relative w-full md:aspect-auto md:h-full", big ? "aspect-[4/5]" : "aspect-square")}>
                {c.image && (
                  <Image
                    src={c.image.url}
                    alt=""
                    fill
                    sizes={big ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"}
                    className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                  />
                )}
              </div>
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent transition-opacity duration-500 group-hover:from-black/70" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 md:p-6">
                <span className={cn("font-display leading-none text-white", big ? "text-4xl md:text-6xl" : "text-2xl md:text-3xl")}>{c.name}</span>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-canvas text-ink transition-transform duration-500 group-hover:rotate-45 md:size-12">
                  <ArrowUpRight className="size-5" aria-hidden />
                </span>
              </div>
            </Link>
          </Reveal>
        );
      })}
    </ul>
  );
}

/* ───────────── Cards: equal cards with the name and subcategories below ───────────── */

function CardsLayout({ categories }: { categories: CategoryDTO[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
      {categories.slice(0, 8).map((c, i) => (
        <Reveal as="li" key={c.id} delay={(i % 4) * 90}>
          <Link
            href={`/category/${c.slug}`}
            className="fx-panel group block h-full rounded-lg border border-line bg-paper p-2.5 transition-[box-shadow,transform] duration-500 hover:-translate-y-1 hover:shadow-float"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-surface">
              {c.image && (
                <Image src={c.image.url} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105" />
              )}
            </div>
            <div className="flex items-start justify-between gap-3 px-2 pb-2 pt-4">
              <div className="min-w-0">
                <p className="font-display text-2xl leading-tight">{c.name}</p>
                {subLabel(c) && <p className="mt-1 truncate text-sm text-muted">{subLabel(c)}</p>}
              </div>
              <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-canvas transition-transform duration-500 group-hover:rotate-45">
                <ArrowUpRight className="size-4" aria-hidden />
              </span>
            </div>
          </Link>
        </Reveal>
      ))}
    </ul>
  );
}

/* ───────────── List: big numbered rows, photo appears on hover ───────────── */

function ListLayout({ categories }: { categories: CategoryDTO[] }) {
  return (
    <ul className="border-t border-line">
      {categories.map((c, i) => (
        <Reveal as="li" key={c.id} delay={i * 70} className="border-b border-line">
          <Link href={`/category/${c.slug}`} className="group relative grid grid-cols-[auto_1fr_auto] items-center gap-4 py-6 md:gap-10 md:py-8">
            <span className="w-10 text-sm tabular-nums text-muted md:w-16">{String(i + 1).padStart(2, "0")}</span>
            <div className="min-w-0">
              <p className="font-display text-4xl leading-none transition-[transform,color] duration-500 group-hover:translate-x-2 group-hover:text-accent md:text-6xl">
                {c.name}
              </p>
              {subLabel(c) && <p className="mt-2 truncate text-sm text-muted">{subLabel(c)}</p>}
            </div>
            <span className="flex items-center gap-4">
              {/* thumbnail slides in on hover (desktop) */}
              <span className="relative hidden h-24 w-0 overflow-hidden rounded-md bg-surface transition-[width] duration-500 ease-out group-hover:w-36 md:block">
                {c.image && <Image src={c.image.url} alt="" fill sizes="144px" className="object-cover" />}
              </span>
              <span className="flex size-11 items-center justify-center rounded-pill border border-line transition-colors duration-300 group-hover:border-ink group-hover:bg-ink group-hover:text-canvas md:size-14">
                <ArrowUpRight className="size-5 transition-transform duration-500 group-hover:rotate-45" aria-hidden />
              </span>
            </span>
          </Link>
        </Reveal>
      ))}
    </ul>
  );
}

/* ───────────── Circles: round photo icons in a scrollable row ───────────── */

function CirclesLayout({ categories }: { categories: CategoryDTO[] }) {
  return (
    <ul className="no-scrollbar -mx-5 flex gap-5 overflow-x-auto px-5 pb-2 md:mx-0 md:flex-wrap md:justify-center md:gap-10 md:px-0">
      {categories.map((c, i) => (
        <Reveal as="li" key={c.id} delay={i * 70} className="shrink-0">
          <Link href={`/category/${c.slug}`} className="group flex w-24 flex-col items-center gap-3 text-center md:w-32">
            <span className="relative size-24 overflow-hidden rounded-full border-2 border-line bg-surface transition-[border-color,transform] duration-500 group-hover:-translate-y-1 group-hover:border-accent md:size-32">
              {c.image && <Image src={c.image.url} alt="" fill sizes="128px" className="object-cover transition-transform duration-700 group-hover:scale-110" />}
            </span>
            <span className="text-sm font-medium leading-tight md:text-base">{c.name}</span>
            {c.children.length > 0 && <span className="-mt-2 text-xs text-muted">{c.children.length} types</span>}
          </Link>
        </Reveal>
      ))}
    </ul>
  );
}

/* ───────────── Pills: compact chips with subcategories ───────────── */

function PillsLayout({ categories }: { categories: CategoryDTO[] }) {
  return (
    <ul className="flex flex-wrap gap-3">
      {categories.flatMap((c) => [
        <li key={c.id}>
          <Link
            href={`/category/${c.slug}`}
            className="group inline-flex min-h-12 items-center gap-3 rounded-pill border border-line bg-paper py-1.5 pl-1.5 pr-5 transition-colors hover:border-ink hover:bg-ink hover:text-canvas"
          >
            <span className="relative size-9 overflow-hidden rounded-pill bg-surface">
              {c.image && <Image src={c.image.url} alt="" fill sizes="36px" className="object-cover" />}
            </span>
            <span className="font-medium">{c.name}</span>
          </Link>
        </li>,
        ...c.children.map((k) => (
          <li key={k.id}>
            <Link href={`/category/${k.slug}`} className="inline-flex min-h-12 items-center rounded-pill border border-dashed border-line px-4 text-sm text-muted transition-colors hover:border-ink hover:text-ink">
              {c.name} › {k.name}
            </Link>
          </li>
        )),
      ])}
    </ul>
  );
}

/* ───────────── Tiles: short photo tiles with a label (marketplace "browse by style") ───────────── */

function TilesLayout({ categories }: { categories: CategoryDTO[] }) {
  // Subcategories make the best tiles; categories without any show as themselves.
  const tiles = categories.flatMap((c) => (c.children.length ? c.children.map((k) => ({ ...k, parent: c.name })) : [{ ...c, parent: "" }])).slice(0, 12);
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {tiles.map((c, i) => (
        <Reveal as="li" key={c.id} delay={(i % 6) * 60}>
          <Link href={`/category/${c.slug}`} className="fx-panel group relative block aspect-[4/3] overflow-hidden rounded-lg bg-surface-strong">
            {c.image && <Image src={c.image.url} alt="" fill sizes="(min-width: 1024px) 16vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />}
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <span className="absolute inset-x-3 bottom-2.5 text-white">
              <span className="block font-display text-lg leading-tight">{c.name}</span>
              {c.parent && <span className="text-[11px] text-white/75">{c.parent}</span>}
            </span>
          </Link>
        </Reveal>
      ))}
    </ul>
  );
}
