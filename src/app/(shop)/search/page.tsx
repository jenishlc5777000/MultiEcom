import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHero } from "@/components/content/page-hero";
import { ProductFilters } from "@/components/product/product-filters";
import { ProductListing } from "@/components/product/product-listing";
import { SearchBox } from "@/components/search/search-box";
import type { ListingLayout } from "@/config/themes";
import { browseParams, filterValues, withParams } from "@/lib/browse-params";
import { cn } from "@/lib/utils";
import { getCategories, getCategoryBySlug, searchProducts } from "@/services/catalog.service";
import { getSiteConfig } from "@/services/site-config.service";
import { getActiveTheme } from "@/services/store.service";

export const metadata = { title: "Search" };

/** Search results with filters; behaviour comes from Admin → Studio → Search. */
export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  // Studio → Visibility.
  if (!(await getSiteConfig()).visibility.pages.search) notFound();
  const p = browseParams.parse(await searchParams);
  const q = p.q ?? "";
  const [site, theme, tree] = await Promise.all([getSiteConfig(), getActiveTheme(), getCategories()]);
  const s = site.search;
  const cat = s.filterCategory && p.cat ? await getCategoryBySlug(p.cat) : null;

  const { products, total, pageCount } = await searchProducts(q, p.page, {
    categoryIds: cat?.productCategoryIds,
    availability: s.filterAvailability ? p.availability : undefined,
    min: s.filterPrice ? p.min : undefined,
    max: s.filterPrice ? p.max : undefined,
    sort: p.sort ?? s.defaultSort,
  });
  const listing: ListingLayout = s.listing === "theme" ? theme.layout.listing : s.listing;
  const searched = Boolean(q || cat || p.availability || p.min !== undefined || p.max !== undefined);
  const categoryOptions = tree.flatMap((c) => [{ slug: c.slug, name: c.name, depth: 0 as const }, ...c.children.map((k) => ({ slug: k.slug, name: k.name, depth: 1 as const }))]);
  const filtersOn = s.showFilters && (s.filterCategory || s.filterAvailability || s.filterPrice);
  const filters = (layout: "bar" | "sidebar") => (
    <ProductFilters
      action="/search"
      values={{ ...filterValues(p), sort: p.sort ?? s.defaultSort }}
      hidden={q ? { q } : {}}
      layout={layout}
      show={{ availability: s.filterAvailability, price: s.filterPrice, sort: true }}
      sorts={["relevance", "new", "price-asc", "price-desc", "rating"]}
      categories={s.filterCategory ? categoryOptions : undefined}
    />
  );

  return (
    <div data-studio="search-page">
      <PageHero eyebrow="Search" title={<>What are you <em className="italic text-accent">looking for?</em></>} className="pb-8 md:pb-10" />
      <div className="container space-y-10">
        <SearchBox config={{ placeholder: s.placeholder, instant: s.instant, popular: s.popular }} size="lg" defaultValue={q} autoFocus={!q} className="max-w-3xl" />

        {!searched && s.popular.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted">Popular searches</p>
            <div className="flex flex-wrap gap-2">
              {s.popular.map((term) => (
                <Link key={term} href={`/search?q=${encodeURIComponent(term)}`} className="inline-flex min-h-10 items-center rounded-pill border border-line bg-paper/60 px-4 text-sm transition-colors hover:border-ink">{term}</Link>
              ))}
            </div>
          </div>
        )}

        {searched && (
          <div className={cn(filtersOn && "grid gap-10 lg:grid-cols-[260px_1fr]")}>
            {filtersOn && <aside className="lg:sticky lg:top-24 lg:self-start">{filters("sidebar")}</aside>}
            <div className="space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-muted" role="status">
                  {total} result{total === 1 ? "" : "s"}
                  {q && <> for &ldquo;<span className="text-ink">{q}</span>&rdquo;</>}
                  {cat && <> in <span className="text-ink">{cat.name}</span></>}
                </p>
                {!filtersOn && filters("bar")}
              </div>
              {products.length > 0 ? (
                <ProductListing products={products} layout={listing} />
              ) : (
                <div className="fx-panel rounded-lg border border-line bg-paper/60 p-8 text-center">
                  <p className="text-lg">Nothing found.</p>
                  <p className="mt-1 text-sm text-muted">Try a shorter word, or clear the filters.</p>
                </div>
              )}
              {pageCount > 1 && (
                <nav aria-label="Pagination" className="flex justify-center gap-2">
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                    <Link key={n} href={withParams("/search", p, { page: n })} aria-current={n === p.page ? "page" : undefined} className={cn("flex size-touch items-center justify-center rounded-pill", n === p.page ? "bg-ink text-canvas" : "bg-surface hover:bg-surface-strong")}>
                      {n}
                    </Link>
                  ))}
                </nav>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
