"use client";

import { Minus, Plus } from "lucide-react";
import Image from "next/image";
import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { addToCartAction } from "@/actions/cart.actions";
import { Button } from "@/components/ui/button";
import { cn, formatINR } from "@/lib/utils";
import type { ImageDTO, ProductDetailDTO, VariantDTO } from "@/types/dto";
import { ProductGallery, ShowcaseGallery, type LabelledImage } from "./product-gallery";
import { RatingStars } from "./rating-stars";
import { OptionChips, OptionSheet, type Option } from "./variant-picker";

function uniqueBy<T>(items: (T | null)[], key: (t: T) => string) {
  const map = new Map<string, T>();
  for (const i of items) if (i) map.set(key(i), i);
  return [...map.values()];
}

/** Variant photos first (labelled Main / Side / Bottom), then the product's own photos. */
function galleryFor(product: ProductDetailDTO, v?: VariantDTO): LabelledImage[] {
  const variant: LabelledImage[] = v
    ? ([["Main", v.images.main], ["Side", v.images.side], ["Bottom", v.images.bottom]] as const).flatMap(([label, img]) => (img ? [{ ...img, label }] : []))
    : [];
  const own = product.images.map((img, i) => ({ ...img, label: variant.length || product.images.length > 1 ? `View ${i + 1}` : "Main" }));
  return variant.length ? [...variant, ...own] : own.map((img, i) => (i === 0 ? { ...img, label: "Main" } : img));
}

/** Product-option settings that come from the product's category (Admin → Categories). */
export type OptionSettings = { glazeLabel: string; sizeLabel: string; glazeStyle: "" | "photo" | "color" | "chips" };

/**
 * Owns the selected variant, so it renders the gallery (variant photos), the
 * pickers and the buy buttons. Static details are passed in as `children`.
 * Layout "showcase" is the Nibbea-style page (labelled thumbnails, glaze photo
 * tiles, quantity, Add to Cart + Buy Now); "classic" is the original.
 */
export function ProductPurchase({
  product,
  children,
  imageSide = "left",
  layout = "classic",
  options,
}: {
  product: ProductDetailDTO;
  children: ReactNode;
  imageSide?: "left" | "right";
  layout?: "classic" | "showcase";
  options?: Partial<OptionSettings>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const showcase = layout === "showcase";
  const glazeLabel = options?.glazeLabel || "Glaze";
  const sizeLabel = options?.sizeLabel || "Size";
  // Showcase defaults to photo tiles for glazes; classic to colour dots.
  const glazeStyle = options?.glazeStyle || (showcase ? "photo" : "color");

  const first = product.variants.find((v) => v.inStock) ?? product.variants[0];
  const [glazeId, setGlazeId] = useState<string | null>(first?.glaze?.id ?? null);
  const [sizeId, setSizeId] = useState<string | null>(first?.size?.id ?? null);

  const glazes = useMemo(() => uniqueBy(product.variants.map((v) => v.glaze), (g) => g.id), [product.variants]);
  const sizes = useMemo(() => uniqueBy(product.variants.map((v) => v.size), (s) => s.id), [product.variants]);

  const find = (g: string | null, s: string | null) =>
    product.variants.find((v) => (v.glaze?.id ?? null) === g && (v.size?.id ?? null) === s);
  const variant = find(glazeId, sizeId);

  /** A photo for each glaze: the main photo of a variant in that glaze. */
  const glazePhoto = (gid: string): ImageDTO | undefined =>
    product.variants.find((v) => v.glaze?.id === gid && v.images.main)?.images.main ?? product.images[0];

  const glazeOptions: Option[] = glazes.map((g) => ({
    id: g.id,
    label: g.name,
    hex: glazeStyle === "chips" ? undefined : g.hex,
    swatchUrl: glazeStyle === "chips" ? undefined : g.swatchUrl,
    disabled: !product.variants.some((v) => v.glaze?.id === g.id && v.inStock),
  }));
  const sizeOptions: Option[] = sizes.map((s) => ({
    id: s.id, label: s.label, disabled: !find(glazeId, s.id)?.inStock,
  }));

  const selectGlaze = (id: string) => {
    setGlazeId(id);
    // keep size if that combo exists, else jump to the first available size for this glaze
    if (!find(id, sizeId)?.inStock) {
      setSizeId(product.variants.find((v) => v.glaze?.id === id && v.inStock)?.size?.id ?? sizeId);
    }
  };

  const canBuy = Boolean(variant?.inStock);
  const maxQty = Math.max(1, Math.min(20, variant?.stock && variant.stock > 0 ? variant.stock : 20));

  function submit(buyNow: boolean) {
    if (!variant) return;
    setError(null);
    startTransition(async () => {
      const res = await addToCartAction({ productId: product.id, variantId: variant.id, qty: showcase ? Math.min(qty, maxQty) : 1 });
      if (!res.ok) return setError(res.error);
      if (buyNow) router.push("/checkout");
      else {
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }
    });
  }

  const price = variant?.price ?? product.priceFrom;
  const label = product.availability === "SOLD" ? "Sold" : !variant ? "Choose options" : !canBuy ? "Out of stock" : "Add to Cart";
  const selectedGlaze = glazes.find((g) => g.id === glazeId);

  /* ───────────── Showcase (Nibbea) ───────────── */
  if (showcase) {
    return (
      <div className="grid gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-12">
        <div className={imageSide === "right" ? "md:order-2" : undefined}>
          <ShowcaseGallery images={galleryFor(product, variant)} resetKey={variant?.id ?? "none"} />
        </div>

        <div className="space-y-6">
          {glazes.length > 0 &&
            (glazeStyle === "photo" ? (
              <fieldset>
                <legend className="mb-3 font-display text-lg">
                  {glazeLabel}: <span className="text-ink">{selectedGlaze?.name ?? "Choose"}</span>
                </legend>
                <div className="flex flex-wrap gap-3">
                  {glazes.map((g) => {
                    const photo = glazePhoto(g.id);
                    const on = g.id === glazeId;
                    const disabled = !product.variants.some((v) => v.glaze?.id === g.id && v.inStock);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        aria-pressed={on}
                        disabled={disabled}
                        onClick={() => selectGlaze(g.id)}
                        className={cn("w-20 text-center text-xs transition-opacity sm:w-24", disabled && "cursor-not-allowed opacity-40")}
                      >
                        <span className={cn("relative mb-1.5 block aspect-square overflow-hidden rounded-sm border-2 bg-surface", on ? "border-ink" : "border-transparent hover:border-line")}>
                          {photo ? (
                            <Image src={photo.url} alt="" fill sizes="96px" className="object-cover" />
                          ) : (
                            <span className="absolute inset-2 rounded-full" style={{ backgroundColor: g.hex ?? "#ccc" }} />
                          )}
                        </span>
                        <span className={cn(on ? "font-semibold text-ink" : "text-muted")}>{g.name}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ) : (
              <OptionChips title={glazeLabel} options={glazeOptions} value={glazeId} onChange={selectGlaze} />
            ))}

          {sizes.length > 0 && (
            <fieldset>
              <legend className="mb-3 font-display text-lg">{sizeLabel}</legend>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={o.id === sizeId}
                    disabled={o.disabled}
                    onClick={() => setSizeId(o.id)}
                    className={cn(
                      "min-h-11 min-w-24 rounded-pill border px-4 text-sm transition-colors",
                      o.id === sizeId ? "border-ink bg-ink text-canvas" : "border-line bg-paper hover:border-ink",
                      o.disabled && "cursor-not-allowed opacity-40 line-through",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="space-y-2">
            <h1 className="text-[clamp(2rem,3.4vw,3rem)] leading-tight">{product.name}</h1>
            {product.ratingCount > 0 && (
              <a href="#reviews" className="inline-flex items-center gap-2 text-sm">
                <RatingStars value={product.ratingAvg} count={product.ratingCount} />
              </a>
            )}
            <p className="flex items-baseline gap-3">
              <span className="font-display text-3xl text-ink">{formatINR(price)}</span>
              {variant?.compareAtPrice && variant.compareAtPrice > variant.price && <span className="text-muted line-through">{formatINR(variant.compareAtPrice)}</span>}
            </p>
            {product.availability === "MADE_TO_ORDER" && product.leadTimeDays && <p className="text-sm text-mto">Made for you, ships in about {product.leadTimeDays} days.</p>}
            {product.availability === "READY_STOCK" && variant && variant.stock > 0 && variant.stock <= 3 && <p className="text-sm font-medium text-accent">Only {variant.stock} left</p>}
          </div>

          <div className="flex items-center gap-4">
            <span className="font-display text-lg">Quantity</span>
            <div className="inline-flex items-center rounded-pill border border-line">
              <button type="button" aria-label="Fewer" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} className="inline-flex size-10 items-center justify-center disabled:opacity-30"><Minus className="size-4" /></button>
              <output aria-live="polite" className="w-10 text-center tabular-nums">{qty}</output>
              <button type="button" aria-label="More" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} className="inline-flex size-10 items-center justify-center disabled:opacity-30"><Plus className="size-4" /></button>
            </div>
          </div>

          <div className="space-y-3">
            <Button size="lg" className="w-full" disabled={!canBuy || pending} onClick={() => submit(false)}>
              {added ? "Added ✓" : label}
            </Button>
            <Button size="lg" variant="outline" className="w-full" disabled={!canBuy || pending} onClick={() => submit(true)}>
              Buy Now
            </Button>
          </div>
          <p role="status" aria-live="polite" className="min-h-5 text-sm text-danger">{error}</p>

          {children}
        </div>
      </div>
    );
  }

  /* ───────────── Classic ───────────── */
  const buttons = (
    <>
      <Button size="lg" variant="outline" className="flex-1" disabled={!canBuy || pending} onClick={() => submit(false)}>
        {added ? "Added ✓" : label}
      </Button>
      <Button size="lg" className="flex-1" disabled={!canBuy || pending} onClick={() => submit(true)}>
        Buy Now
      </Button>
    </>
  );

  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-12">
      <div className={imageSide === "right" ? "md:order-2" : undefined}>
        <ProductGallery images={galleryFor(product, variant)} resetKey={variant?.id ?? "none"} />
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-[clamp(2.25rem,4vw,3.5rem)] leading-none">{product.name}</h1>
          {product.patternName && <p className="text-muted">Pattern: {product.patternName}</p>}
          <p className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-ink">{formatINR(price)}</span>
            {variant?.compareAtPrice && variant.compareAtPrice > variant.price && (
              <span className="text-muted line-through">{formatINR(variant.compareAtPrice)}</span>
            )}
          </p>
          {product.availability === "MADE_TO_ORDER" && product.leadTimeDays && (
            <p className="text-sm text-mto">Made for you, ships in about {product.leadTimeDays} days.</p>
          )}
          {product.availability === "READY_STOCK" && variant && variant.stock > 0 && variant.stock <= 3 && (
            <p className="text-sm font-medium text-accent">Only {variant.stock} left</p>
          )}
        </div>

        {/* Pickers: bottom sheets on mobile, chips on desktop */}
        <div className="space-y-3 md:hidden">
          {glazes.length > 0 && <OptionSheet title={glazeLabel} options={glazeOptions} value={glazeId} onChange={selectGlaze} />}
          {sizes.length > 0 && <OptionSheet title={sizeLabel} options={sizeOptions} value={sizeId} onChange={setSizeId} />}
        </div>
        <div className="hidden space-y-5 md:block">
          {glazes.length > 0 && <OptionChips title={glazeLabel} options={glazeOptions} value={glazeId} onChange={selectGlaze} />}
          {sizes.length > 0 && <OptionChips title={sizeLabel} options={sizeOptions} value={sizeId} onChange={setSizeId} />}
        </div>

        <div className="hidden gap-3 md:flex">{buttons}</div>
        <p role="status" aria-live="polite" className="min-h-5 text-sm text-danger">
          {error}
        </p>

        {children}
      </div>

      {/* Sticky mobile purchase bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-line bg-canvas/95 p-3 pb-safe backdrop-blur md:hidden">
        {buttons}
      </div>
      <div className="h-20 md:hidden" aria-hidden />
    </div>
  );
}
