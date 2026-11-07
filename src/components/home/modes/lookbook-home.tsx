import Image from "next/image";
import Link from "next/link";
import { ClosingCta } from "@/components/home/closing-cta";
import { Headline } from "@/components/home/hero";
import { Reveal } from "@/components/motion/reveal";
import { ProductCard, ProductGrid } from "@/components/product/product-card";
import { Button, ButtonArrow } from "@/components/ui/button";
import { titleLines } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { getProductsByCategory } from "@/services/catalog.service";
import type { CategoryDTO } from "@/types/dto";
import type { HomeData } from "./types";


/**
 * Magazine-style home page: a masthead, a cover photo, then one "chapter"
 * spread per category with a few of its pieces.
 */
export async function LookbookHome(d: HomeData) {
  const chapters = d.categories.slice(0, 4);
  // A few products for each chapter (the category plus its subcategories).
  const picks = await Promise.all(chapters.map((c) => getProductsByCategory([c.id, ...c.children.map((k) => k.id)]).then((r) => r.products.slice(0, 2))));
  const month = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const lines = titleLines(d.banner?.title || d.site.content.hero.title);

  return (
    <div className="space-y-24 pb-8 md:space-y-36">
      {/* Masthead */}
      <section className="container pt-6 md:pt-10">
        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-line py-3 text-eyebrow uppercase">
          <span>The Lookbook</span>
          <span className="text-muted">{month}</span>
          <span className="hidden text-muted sm:inline">{d.categories.length} chapters · {d.stats[0]?.value ?? d.newest.length} pieces</span>
        </div>
        <div className="py-12 text-center md:py-20">
          <Headline lines={lines} className="mx-auto max-w-5xl" />
          <p className="mx-auto mt-8 max-w-xl animate-fade-up text-lg leading-relaxed text-muted [animation-delay:600ms]">
            {d.banner?.subtitle || d.site.content.hero.subtitle}
          </p>
        </div>
        {d.heroImage && (
          <figure>
            <div className="relative aspect-[4/5] animate-clip-up overflow-hidden rounded-lg bg-surface-strong sm:aspect-[16/9] lg:aspect-[21/9]">
              <Image src={d.heroImage.url} alt={d.heroImage.alt} fill priority sizes="100vw" className="animate-zoom-out object-cover" />
            </div>
            <figcaption className="mt-3 flex justify-between text-sm text-muted">
              <span>Cover</span>
              {d.featured && <Link href={`/products/${d.featured.slug}`} className="link-underline">{d.featured.name}</Link>}
            </figcaption>
          </figure>
        )}
      </section>

      {/* Chapters */}
      {chapters.map((c, i) => (
        <Chapter key={c.id} category={c} index={i} products={picks[i] ?? []} />
      ))}

      {d.newest.length > 0 && (
        <section className="container space-y-10">
          <div className="border-t border-line pt-6 text-center">
            <p className="eyebrow">Also in this issue</p>
            <h2 className="mt-3 text-h2">New from the <em className="italic">studio</em></h2>
          </div>
          <ProductGrid products={d.newest.slice(0, 8)} />
        </section>
      )}

      <ClosingCta content={d.site.content.closing} />
    </div>
  );
}

function Chapter({ category: c, index, products }: { category: CategoryDTO; index: number; products: Parameters<typeof ProductCard>[0]["product"][] }) {
  const flip = index % 2 === 1;
  return (
    <section className="container grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-14">
      <Reveal className={cn("relative aspect-[4/5] overflow-hidden rounded-lg bg-surface-strong lg:col-span-7", flip && "lg:order-2")}>
        {c.image && <Image src={c.image.url} alt="" fill sizes="(min-width: 1024px) 58vw, 100vw" className="parallax object-cover" />}
        <span className="absolute left-4 top-4 bg-canvas/90 px-3 py-1 text-eyebrow uppercase text-ink">Chapter {String(index + 1).padStart(2, "0")}</span>
      </Reveal>
      <div className={cn("space-y-8 lg:col-span-5", flip && "lg:order-1")}>
        <Reveal className="space-y-4">
          <p className="font-display text-7xl italic leading-none text-accent/70">{String(index + 1).padStart(2, "0")}</p>
          <h2 className="text-h1">{c.name}</h2>
          {c.children.length > 0 && <p className="text-muted">Featuring {c.children.map((k) => k.name).join(", ")}.</p>}
        </Reveal>
        {products.length > 0 && (
          <ul className="grid grid-cols-2 gap-4">
            {products.map((p) => (
              <li key={p.id}><ProductCard product={p} sizes="(min-width: 1024px) 20vw, 50vw" /></li>
            ))}
          </ul>
        )}
        <Button asChild variant="secondary">
          <Link href={`/category/${c.slug}`}>
            Read the {c.name.toLowerCase()} chapter <ButtonArrow />
          </Link>
        </Button>
      </div>
    </section>
  );
}
