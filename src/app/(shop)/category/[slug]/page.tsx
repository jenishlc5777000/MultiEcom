import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/content/page-hero";
import { ProductFilters } from "@/components/product/product-filters";
import { ProductListing } from "@/components/product/product-listing";
import type { ListingLayout } from "@/config/themes";
import { browseParams, filterValues, withParams } from "@/lib/browse-params";
import { cn } from "@/lib/utils";
import { getCategories, getCategoryBySlug, getProductsByCategory } from "@/services/catalog.service";
import { getSiteConfig } from "@/services/site-config.service";
import { getActiveTheme } from "@/services/store.service";
import type { CategoryDTO } from "@/types/dto";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategoryBySlug((await params).slug);
  return category ? { title: category.name, description: category.description } : {};
}

/**
 * Category / subcategory page. Layout (chips, sidebar, tabs, tiles), filters,
 * sorting and the product-list style come from Admin → Studio → Pages.
 */
export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, raw] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const p = browseParams.parse(raw);
  const [site, theme, tree] = await Promise.all([getSiteConfig(), getActiveTheme(), getCategories()]);
  const opts = site.pages.category;
  // Categories like Mugs ("choose a pattern first") list no products themselves.
  const { products, total, pageCount } = category.requiresChild
    ? { products: [], total: 0, pageCount: 0 }
    : await getProductsByCategory(category.productCategoryIds, p.page, {
        availability: opts.showFilters ? p.availability : undefined,
        min: opts.showFilters ? p.min : undefined,
        max: opts.showFilters ? p.max : undefined,
        sort: p.sort && p.sort !== "relevance" ? p.sort : "new",
      });
  const listing: ListingLayout = opts.listing === "theme" ? theme.layout.listing : opts.listing;
  // Links above the products: the subcategories, or the sibling patterns (Tapered / Round / Classic).
  const parent: NavParent | null = category.nav
    ? { id: `nav-${category.nav.parent.slug}`, slug: category.nav.parent.slug, name: category.nav.parent.name, image: category.nav.parent.image, children: category.nav.items, noAll: category.nav.parent.slug === category.slug ? category.requiresChild : category.depth === 2 }
    : null;
  const path = `/category/${slug}`;

  const filters = (layout: "bar" | "sidebar") =>
    (opts.showFilters || opts.showSort) && (
      <ProductFilters
        action={path}
        values={filterValues(p)}
        layout={layout}
        show={{ availability: opts.showFilters, price: opts.showFilters, sort: opts.showSort }}
      />
    );

  const results = (
    <div className="space-y-10">
      {products.length ? <ProductListing products={products} layout={listing} /> : <p className="py-10 text-muted">Nothing matches these filters yet.</p>}
      {pageCount > 1 && (
        <nav aria-label="Pagination" className="flex justify-center gap-2">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={withParams(path, p, { page: n })}
              aria-current={n === p.page ? "page" : undefined}
              className={cn("flex size-touch items-center justify-center rounded-pill transition-colors", n === p.page ? "bg-ink text-canvas" : "bg-surface text-ink hover:bg-surface-strong")}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );

  const breadcrumb = opts.showBreadcrumb && (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li><Link href="/category" className="link-underline">Shop</Link></li>
        {category.ancestors.map((a) => (
          <li key={a.slug} className="flex items-center gap-1.5"><span aria-hidden>/</span><Link href={`/category/${a.slug}`} className="link-underline">{a.name}</Link></li>
        ))}
        <li className="flex items-center gap-1.5"><span aria-hidden>/</span><span aria-current="page" className="text-ink">{category.name}</span></li>
      </ol>
    </nav>
  );

  const header = opts.showHero ? (
    <PageHero
      eyebrow={["Shop", ...category.ancestors.map((a) => a.name), ...(category.requiresChild ? [] : [`${total} piece${total === 1 ? "" : "s"}`])].join(" · ")}
      title={category.name}
      lead={category.description || undefined}
      className={opts.heroAlign === "center" ? "pb-8 text-center md:pb-12 [&_h1]:mx-auto [&_p]:mx-auto" : "pb-8 md:pb-12"}
    />
  ) : (
    <div className="container pb-4 pt-10">
      <h1 className="text-h2">{category.name}</h1>
      {!category.requiresChild && <p className="mt-1 text-sm text-muted">{total} piece{total === 1 ? "" : "s"}</p>}
    </div>
  );

  /* "Choose a pattern first": the patterns (Tapered / Round / Classic…), no product list. Design from Studio → Pages. */
  if (category.requiresChild) {
    return (
      <div data-studio="category-page">
        {header}
        <div className="container space-y-8">
          {breadcrumb}
          {opts.patternPrompt && <p className="text-lg text-muted">{opts.patternPrompt}</p>}
          <PatternPicker items={category.children} opts={opts} />
        </div>
      </div>
    );
  }

  /* Sidebar: category tree + filters on the left, products on the right */
  if (opts.layout === "sidebar") {
    return (
      <div>
        {header}
        <div className="container grid gap-10 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {breadcrumb}
            <CategoryTree tree={tree} activeSlug={slug} />
            {filters("sidebar")}
          </aside>
          {results}
        </div>
      </div>
    );
  }

  const subNav =
    opts.showChips && parent && parent.children.length > 0 ? (
      opts.layout === "tabs" ? (
        <SubcategoryTabs parent={parent} activeSlug={slug} />
      ) : opts.layout === "tiles" ? (
        <SubcategoryTiles parent={parent} activeSlug={slug} />
      ) : (
        <SubcategoryChips parent={parent} activeSlug={slug} />
      )
    ) : null;

  return (
    <div data-studio="category-page">
      {header}
      <div className="container space-y-8">
        {breadcrumb}
        {subNav}
        {filters("bar")}
        {results}
      </div>
    </div>
  );
}

/* ───────────── Subcategory navigation styles ───────────── */

type NavParent = { id: string; slug: string; name: string; image?: CategoryDTO["image"]; children: CategoryDTO["children"]; noAll?: boolean };
/** "All <parent>" first, unless the parent itself lists nothing (choose-a-pattern categories). */
const allOf = (parent: NavParent) => [...(parent.noAll ? [] : [{ id: parent.id, slug: parent.slug, name: `All ${parent.name}`, image: parent.image }]), ...parent.children];

function SubcategoryChips({ parent, activeSlug }: { parent: NavParent; activeSlug: string }) {
  return (
    <nav aria-label={`${parent.name} subcategories`} className="no-scrollbar -mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
      <ul className="flex gap-2">
        {allOf(parent).map((c) => {
          const active = c.slug === activeSlug;
          return (
            <li key={c.slug} className="shrink-0">
              <Link href={`/category/${c.slug}`} aria-current={active ? "page" : undefined} className={cn("inline-flex min-h-touch items-center rounded-pill border px-4 text-sm transition-colors", active ? "border-ink bg-ink text-canvas" : "border-line bg-paper/60 text-ink hover:border-ink")}>
                {c.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SubcategoryTabs({ parent, activeSlug }: { parent: NavParent; activeSlug: string }) {
  return (
    <nav aria-label={`${parent.name} subcategories`} className="no-scrollbar -mx-5 overflow-x-auto border-b border-line px-5 md:mx-0 md:px-0">
      <ul className="flex gap-8">
        {allOf(parent).map((c) => {
          const active = c.slug === activeSlug;
          return (
            <li key={c.slug} className="shrink-0">
              <Link href={`/category/${c.slug}`} aria-current={active ? "page" : undefined} className={cn("-mb-px inline-flex min-h-12 items-center border-b-2 text-[15px] transition-colors", active ? "border-ink font-medium text-ink" : "border-transparent text-muted hover:text-ink")}>
                {c.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SubcategoryTiles({ parent, activeSlug }: { parent: NavParent; activeSlug: string }) {
  return (
    <nav aria-label={`${parent.name} subcategories`}>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {allOf(parent).map((c) => {
          const active = c.slug === activeSlug;
          return (
            <li key={c.slug}>
              <Link href={`/category/${c.slug}`} aria-current={active ? "page" : undefined} className="group block text-center">
                <span className={cn("relative mb-2 block aspect-square overflow-hidden rounded-md bg-surface ring-offset-2 ring-offset-canvas transition", active ? "ring-2 ring-ink" : "group-hover:ring-1 group-hover:ring-line")}>
                  {c.image ? (
                    <Image src={c.image.url} alt="" fill sizes="160px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    // No picture yet (set one in Admin → Categories): a neat icon instead of an empty box.
                    <span className="flex h-full items-center justify-center text-muted"><LayoutGrid className="size-8" strokeWidth={1.4} aria-hidden /></span>
                  )}
                </span>
                <span className={cn("text-sm", active ? "font-medium" : "text-muted group-hover:text-ink")}>{c.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function CategoryTree({ tree, activeSlug }: { tree: CategoryDTO[]; activeSlug: string }) {
  return (
    <nav aria-label="Categories" className="fx-panel rounded-lg border border-line bg-paper/60 p-5">
      <p className="mb-3 text-sm font-semibold">Categories</p>
      <ul className="space-y-1 text-sm">
        {tree.map((c) => {
          const open = c.slug === activeSlug || c.children.some((k) => k.slug === activeSlug);
          return (
            <li key={c.id}>
              <Link href={`/category/${c.slug}`} aria-current={c.slug === activeSlug ? "page" : undefined} className={cn("flex min-h-9 items-center justify-between rounded-md px-2 transition-colors hover:bg-surface", c.slug === activeSlug && "bg-surface font-medium")}>
                {c.name}
                {c.children.length > 0 && <span className="text-xs text-muted">{c.children.length}</span>}
              </Link>
              {open && c.children.length > 0 && (
                <ul className="my-1 ml-3 space-y-0.5 border-l border-line pl-2">
                  {c.children.map((k) => (
                    <li key={k.id}>
                      <Link href={`/category/${k.slug}`} aria-current={k.slug === activeSlug ? "page" : undefined} className={cn("flex min-h-8 items-center rounded-md px-2 text-muted transition-colors hover:text-ink", k.slug === activeSlug && "font-medium text-ink")}>
                        {k.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ───────────── Pattern picker designs ───────────── */

type PatternOpts = { patternLayout: "tiles" | "cards" | "pills" | "list" | "carousel"; patternColumns: number; patternShape: "square" | "portrait" | "landscape" | "circle"; patternShowDescription: boolean };
type PatternItem = { id: string; name: string; slug: string; image?: { url: string; alt: string }; description?: string };

const SHAPE = { square: "aspect-square", portrait: "aspect-[4/5]", landscape: "aspect-[4/3]", circle: "aspect-square rounded-full" } as const;
const COLS: Record<number, string> = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-3 lg:grid-cols-4", 5: "sm:grid-cols-3 lg:grid-cols-5" };

function PatternPicker({ items, opts }: { items: PatternItem[]; opts: PatternOpts }) {
  const pic = (c: PatternItem, sizes: string, extra = "") => (
    <span className={cn("relative block overflow-hidden bg-surface", SHAPE[opts.patternShape], extra)}>
      {c.image && <Image src={c.image.url} alt="" fill sizes={sizes} className="object-cover transition-transform duration-700 group-hover:scale-105" />}
    </span>
  );
  const desc = (c: PatternItem) => opts.patternShowDescription && c.description ? <span className="mt-1 block text-sm text-muted">{c.description}</span> : null;

  switch (opts.patternLayout) {
    case "pills":
      return (
        <ul className="flex flex-wrap gap-3">
          {items.map((c) => (
            <li key={c.id}>
              <Link href={`/category/${c.slug}`} className="group inline-flex min-h-12 items-center gap-3 rounded-pill border border-line bg-paper py-1.5 pl-1.5 pr-5 text-[15px] font-medium transition-colors hover:border-ink">
                {c.image && <span className="relative size-9 overflow-hidden rounded-full bg-surface"><Image src={c.image.url} alt="" fill sizes="36px" className="object-cover" /></span>}
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      );
    case "list":
      return (
        <ul className="divide-y divide-line border-y border-line">
          {items.map((c) => (
            <li key={c.id}>
              <Link href={`/category/${c.slug}`} className="group flex items-center gap-5 py-4">
                <span className="w-24 shrink-0 sm:w-32">{pic(c, "128px", opts.patternShape === "circle" ? "" : "rounded-md")}</span>
                <span className="min-w-0 flex-1"><span className="font-display text-2xl">{c.name}</span>{desc(c)}</span>
                <span aria-hidden className="text-xl text-muted transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </li>
          ))}
        </ul>
      );
    case "carousel":
      return (
        <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
          {items.map((c) => (
            <li key={c.id} className="w-[70%] shrink-0 snap-start sm:w-[40%] lg:w-[24%]">
              <Link href={`/category/${c.slug}`} className="group block space-y-3">
                {pic(c, "(min-width: 1024px) 24vw, 70vw", opts.patternShape === "circle" ? "" : "rounded-lg")}
                <span className="block text-center"><span className="font-display text-xl">{c.name}</span>{desc(c)}</span>
              </Link>
            </li>
          ))}
        </ul>
      );
    case "cards":
      return (
        <ul className={cn("grid grid-cols-1 gap-6", COLS[opts.patternColumns])}>
          {items.map((c) => (
            <li key={c.id}>
              <Link href={`/category/${c.slug}`} className="group relative block overflow-hidden rounded-lg">
                {pic(c, "(min-width: 1024px) 33vw, 100vw")}
                <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" aria-hidden />
                <span className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <span className="font-display text-2xl">{c.name}</span>
                  {opts.patternShowDescription && c.description && <span className="mt-1 block text-sm text-white/85">{c.description}</span>}
                  <span className="mt-2 inline-block text-sm underline underline-offset-4">Shop {c.name.toLowerCase()} →</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      );
    default:
      return (
        <ul className={cn("grid grid-cols-2 gap-4", COLS[opts.patternColumns])}>
          {items.map((c) => (
            <li key={c.id}>
              <Link href={`/category/${c.slug}`} className={cn("group block overflow-hidden transition-shadow", opts.patternShape === "circle" ? "text-center" : "fx-panel rounded-lg border border-line bg-paper hover:shadow-float")}>
                {pic(c, "(min-width: 1024px) 25vw, 50vw")}
                <span className={cn("flex items-center gap-2 px-4 py-3", opts.patternShape === "circle" ? "justify-center" : "justify-between")}>
                  <span><span className="font-display text-xl">{c.name}</span>{desc(c)}</span>
                  {opts.patternShape !== "circle" && <span aria-hidden className="text-muted transition-transform group-hover:translate-x-1">→</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      );
  }
}
