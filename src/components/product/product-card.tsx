import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { FavouriteButton } from "@/components/shopping/favourite-button";
import { cn, formatINR } from "@/lib/utils";
import type { ProductCardDTO } from "@/types/dto";
import { AvailabilityBadge, UniqueBadge } from "./availability-badge";
import { RatingStars } from "./rating-stars";

const MAX_SWATCHES = 4;

export function ProductCard({ product, priority = false, sizes }: { product: ProductCardDTO; priority?: boolean; sizes?: string }) {
  const sold = product.availability === "SOLD";
  const extra = product.swatches.length - MAX_SWATCHES;

  return (
    // Wrapper: the favourite button sits over the card but outside the link.
    <div className="product-card-wrap relative">
    <Link href={`/products/${product.slug}`} data-studio="product-card" className="product-card group block rounded-lg outline-offset-4" aria-label={`${product.name}, ${sold ? "sold" : `from ${formatINR(product.priceFrom)}`}`}>
      <div className="product-card-media relative aspect-[4/5] overflow-hidden rounded-lg bg-surface">
        {product.image && (
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            priority={priority}
            sizes={sizes ?? "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"}
            className={cn(
              "object-cover transition-[transform,opacity] duration-1000 ease-out group-hover:scale-[1.06]",
              product.hoverImage && "group-hover:opacity-0",
              sold && "opacity-70 grayscale-[35%]",
            )}
          />
        )}
        {product.hoverImage && (
          <Image
            src={product.hoverImage.url}
            alt=""
            fill
            sizes={sizes ?? "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"}
            className="scale-[1.06] object-cover opacity-0 transition-[transform,opacity] duration-1000 ease-out group-hover:scale-100 group-hover:opacity-100"
          />
        )}

        {/* subtle bottom shade so tags/arrow stay legible on light photos */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/15 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <div className="product-card-badges absolute inset-x-3 top-3 pr-11 flex flex-wrap items-start justify-between gap-2">
          <AvailabilityBadge availability={product.availability} className="bg-canvas/90 backdrop-blur" />
          {product.isUnique && !sold && <UniqueBadge className="bg-canvas/90 backdrop-blur" />}
        </div>

        {/* Shown by the "listing" card style: price over the photo */}
        <span aria-hidden className="product-card-overlay-price">{sold ? "Sold" : formatINR(product.priceFrom)}</span>

        <span
          aria-hidden
          className="product-card-arrow absolute bottom-3 right-3 flex size-11 translate-y-3 items-center justify-center rounded-full bg-canvas text-ink opacity-0 shadow-float transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
        >
          <ArrowUpRight className="size-5 transition-transform duration-500 group-hover:rotate-45" />
        </span>
      </div>

      <div className="product-card-body mt-4 space-y-1.5 px-0.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="product-card-title line-clamp-2 font-sans text-[15px] font-medium leading-snug text-ink">
            <span className="link-underline">{product.name}</span>
          </h3>
          <p className="product-card-price shrink-0 text-right text-[15px] tabular-nums">
            {sold ? (
              <span className="text-muted">Sold</span>
            ) : (
              <>
                {product.compareAtFrom && <span className="mr-1.5 text-sm text-muted line-through">{formatINR(product.compareAtFrom)}</span>}
                <span className={product.compareAtFrom ? "text-accent" : "text-ink"}>{formatINR(product.priceFrom)}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex min-h-5 items-center justify-between gap-3">
          {product.swatches.length > 0 ? (
            <div className="product-card-swatches flex items-center gap-1.5" aria-label={`Glazes: ${product.swatches.map((s) => s.name).join(", ")}`}>
              {product.swatches.slice(0, MAX_SWATCHES).map((s) => (
                <span key={s.name} title={s.name} className="size-3.5 rounded-full border border-ink/15" style={{ backgroundColor: s.hex ?? "#ccc" }} />
              ))}
              {extra > 0 && <span className="text-xs text-muted">+{extra}</span>}
            </div>
          ) : (
            <span className="text-xs text-muted">{product.type === "CRAFT" ? "Craft kit" : "Ceramic"}</span>
          )}
          <span className="product-card-rating"><RatingStars value={product.ratingAvg} count={product.ratingCount} compact /></span>
        </div>
      </div>
      {/* Shown by the "listing" card style */}
      <span aria-hidden className="product-card-cta">View details <ArrowUpRight className="size-3.5" /></span>
    </Link>
    <FavouriteButton productId={product.id} name={product.name} className="product-card-fav absolute right-3 top-3 z-10" />
    </div>
  );
}

export function ProductGrid({ products }: { products: ProductCardDTO[] }) {
  return (
    <ul
      data-studio="product-list"
      // Columns and spacing come from Admin → Studio → Cards (CSS variables).
      className="grid grid-cols-[repeat(var(--grid-cols-sm,2),minmax(0,1fr))] gap-x-[calc(var(--grid-gap,24px)*0.66)] gap-y-10 sm:grid-cols-[repeat(var(--grid-cols-md,3),minmax(0,1fr))] md:gap-x-[var(--grid-gap,24px)] md:gap-y-14 lg:grid-cols-[repeat(var(--grid-cols,4),minmax(0,1fr))]"
    >
      {products.map((p, i) => (
        <Reveal as="li" key={p.id} delay={(i % 4) * 80}>
          <ProductCard product={p} priority={i < 4} />
        </Reveal>
      ))}
    </ul>
  );
}
