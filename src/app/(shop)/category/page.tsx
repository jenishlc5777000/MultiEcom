import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/content/page-hero";
import { CategoryBlock } from "@/components/home/category-showcase";
import { Reveal } from "@/components/motion/reveal";
import { getCategories, getCategoryCounts } from "@/services/catalog.service";
import { getSiteConfig } from "@/services/site-config.service";
import { getActiveTheme } from "@/services/store.service";

export const metadata = { title: "Shop" };

/** All categories. Layout, subcategory links and counts come from Admin → Studio → Pages. */
export default async function CategoriesPage() {
  // Studio → Visibility.
  if (!(await getSiteConfig()).visibility.pages.categories) notFound();
  const [categories, site, theme, counts] = await Promise.all([getCategories(), getSiteConfig(), getActiveTheme(), getCategoryCounts()]);
  const opts = site.pages.categoriesIndex;
  const layout = opts.layout === "theme" ? theme.layout.categories : opts.layout;
  const count = (id: string) => (opts.showCounts ? counts[id] ?? 0 : null);

  return (
    <div data-studio="categories-page">
      <PageHero eyebrow="Shop" title={<>Browse by <em className="italic text-accent">category</em></>} />
      <div className="container space-y-16">
        {categories.length === 0 && <p className="text-muted">No categories yet.</p>}

        {layout === "tree" ? (
          /* Tree: each category with all its subcategories, like a store directory */
          <ul className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c, i) => (
              <Reveal as="li" key={c.id} delay={(i % 3) * 80} className="space-y-4">
                <Link href={`/category/${c.slug}`} className="group flex items-center gap-4">
                  <span className="fx-panel relative size-20 shrink-0 overflow-hidden rounded-md bg-surface">
                    {c.image && <Image src={c.image.url} alt="" fill sizes="80px" className="object-cover transition-transform duration-700 group-hover:scale-110" />}
                  </span>
                  <span>
                    <span className="block font-display text-3xl leading-none transition-colors group-hover:text-accent">{c.name}</span>
                    {count(c.id) !== null && <span className="text-sm text-muted">{count(c.id)} pieces</span>}
                  </span>
                </Link>
                {opts.showSubcategories && c.children.length > 0 && (
                  <ul className="space-y-1 border-l border-line pl-4">
                    {c.children.map((k) => (
                      <li key={k.id}>
                        <Link href={`/category/${k.slug}`} className="flex min-h-9 items-center justify-between text-muted transition-colors hover:text-ink">
                          <span className="link-underline">{k.name}</span>
                          {count(k.id) !== null && <span className="text-xs tabular-nums">{count(k.id)}</span>}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link href={`/category/${c.slug}`} className="inline-flex min-h-9 items-center gap-1 text-sm font-medium">
                        All {c.name.toLowerCase()} <ArrowUpRight className="size-4" aria-hidden />
                      </Link>
                    </li>
                  </ul>
                )}
              </Reveal>
            ))}
          </ul>
        ) : (
          <>
            <CategoryBlock categories={categories} layout={layout} />
            {/* Subcategory directory under the main layout */}
            {opts.showSubcategories && categories.some((c) => c.children.length > 0) && (
              <section className="space-y-6 border-t border-line pt-10">
                <h2 className="text-h3">Browse subcategories</h2>
                <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                  {categories.filter((c) => c.children.length > 0).map((c) => (
                    <li key={c.id}>
                      <Link href={`/category/${c.slug}`} className="mb-2 inline-block text-eyebrow uppercase text-muted hover:text-ink">{c.name}</Link>
                      <ul className="flex flex-wrap gap-2">
                        {c.children.map((k) => (
                          <li key={k.id}>
                            <Link href={`/category/${k.slug}`} className="inline-flex min-h-9 items-center gap-2 rounded-pill border border-line bg-paper/60 px-3 text-sm transition-colors hover:border-ink">
                              {k.name}
                              {count(k.id) !== null && <span className="text-xs text-muted">{count(k.id)}</span>}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
