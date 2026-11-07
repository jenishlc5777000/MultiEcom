import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ListingLayout } from "@/config/themes";
import { Reveal } from "@/components/motion/reveal";
import { cn, formatINR } from "@/lib/utils";
import type { ProductCardDTO } from "@/types/dto";
import { AvailabilityBadge } from "./availability-badge";
import { ProductCard, ProductGrid } from "./product-card";
import { RatingStars } from "./rating-stars";

/**
 * Product lists in five layouts (picked by the theme or Admin → Studio → Pages):
 * grid, list rows, compact grid, masonry wall, large tiles.
 */
export function ProductListing({ products, layout = "grid" }: { products: ProductCardDTO[]; layout?: ListingLayout }) {
  if (layout === "list") return <ListRows products={products} />;
  if (layout === "compact") {
    return (
      <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 [&_.product-card-price]:text-[13px] [&_.product-card-title]:text-[13px]">
        {products.map((p, i) => (
          <Reveal as="li" key={p.id} delay={(i % 6) * 50}>
            <ProductCard product={p} priority={i < 6} sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw" />
          </Reveal>
        ))}
      </ul>
    );
  }
  if (layout === "masonry") {
    // Alternating photo heights in CSS columns, like a pin board.
    const ratios = ["4 / 5", "1 / 1", "3 / 4", "4 / 5", "2 / 3", "1 / 1"];
    return (
      <ul className="columns-2 gap-4 md:columns-3 md:gap-6 lg:columns-4">
        {products.map((p, i) => (
          <li key={p.id} className="mb-6 break-inside-avoid [&_.product-card-media]:![aspect-ratio:var(--r)]" style={{ "--r": ratios[i % ratios.length] } as React.CSSProperties}>
            <ProductCard product={p} priority={i < 4} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" />
          </li>
        ))}
      </ul>
    );
  }
  if (layout === "large") {
    return (
      <ul className="grid gap-x-6 gap-y-14 sm:grid-cols-2 [&_.product-card-title]:text-lg">
        {products.map((p, i) => (
          <Reveal as="li" key={p.id} delay={(i % 2) * 100}>
            <ProductCard product={p} priority={i < 2} sizes="(min-width: 640px) 50vw, 100vw" />
          </Reveal>
        ))}
      </ul>
    );
  }
  return <ProductGrid products={products} />;
}

/** One product per row: photo, details, price and a clear call to action. */
function ListRows({ products }: { products: ProductCardDTO[] }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {products.map((p, i) => {
        const sold = p.availability === "SOLD";
        return (
          <Reveal as="li" key={p.id} delay={(i % 6) * 40}>
            <Link href={`/products/${p.slug}`} className="group grid grid-cols-[96px_1fr] items-center gap-4 py-4 sm:grid-cols-[140px_1fr_auto] sm:gap-6 md:py-5">
              <span className="product-card-media relative aspect-square overflow-hidden rounded-md bg-surface">
                {p.image && <Image src={p.image.url} alt={p.image.alt} fill sizes="140px" priority={i < 4} className="object-cover transition-transform duration-700 group-hover:scale-105" />}
              </span>
              <span className="min-w-0 space-y-1.5">
                <span className="block font-display text-xl leading-tight transition-colors group-hover:text-accent md:text-2xl">{p.name}</span>
                <span className="flex flex-wrap items-center gap-2 text-sm text-muted">
                  <AvailabilityBadge availability={p.availability} />
                  <span>{p.type === "CRAFT" ? "Craft kit" : "Ceramic"}</span>
                  {p.swatches.length > 0 && (
                    <span className="flex items-center gap-1" aria-label={`Glazes: ${p.swatches.map((s) => s.name).join(", ")}`}>
                      {p.swatches.slice(0, 5).map((s) => <span key={s.name} className="size-3 rounded-full border border-ink/15" style={{ backgroundColor: s.hex ?? "#ccc" }} />)}
                    </span>
                  )}
                  {p.ratingCount > 0 && <RatingStars value={p.ratingAvg} count={p.ratingCount} compact />}
                </span>
                <span className="block text-lg tabular-nums sm:hidden">{sold ? "Sold" : formatINR(p.priceFrom)}</span>
              </span>
              <span className="hidden items-center gap-5 sm:flex">
                <span className="text-right tabular-nums">
                  {p.compareAtFrom && !sold && <span className="block text-sm text-muted line-through">{formatINR(p.compareAtFrom)}</span>}
                  <span className={cn("text-xl", p.compareAtFrom && !sold && "text-accent")}>{sold ? "Sold" : formatINR(p.priceFrom)}</span>
                </span>
                <span className="flex size-11 items-center justify-center rounded-pill border border-line transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-canvas">
                  <ArrowUpRight className="size-5" aria-hidden />
                </span>
              </span>
            </Link>
          </Reveal>
        );
      })}
    </ul>
  );
}
