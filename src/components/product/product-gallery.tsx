"use client";

import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { ImageDTO } from "@/types/dto";

export type LabelledImage = ImageDTO & { label?: string };

/**
 * Showcase (Nibbea) gallery: labelled vertical thumbnails (Main / Side / Bottom)
 * beside one big image on desktop; swipeable with dots on mobile.
 */
export function ShowcaseGallery({ images, resetKey }: { images: LabelledImage[]; resetKey: string }) {
  const [ref, api] = useEmblaCarousel({ loop: images.length > 1 });
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setIndex(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  useEffect(() => {
    api?.reInit();
    api?.scrollTo(0, true);
    setIndex(0);
  }, [api, resetKey]);

  if (!images.length) return <div className="aspect-[var(--pdp-ratio,4/5)] rounded-lg bg-surface" />;

  return (
    <div className="flex gap-4">
      {images.length > 1 && (
        <div className="hidden w-20 shrink-0 flex-col gap-3 md:flex">
          {images.map((img, i) => (
            <button
              key={`${img.url}-thumb-${i}`}
              type="button"
              onClick={() => api?.scrollTo(i)}
              aria-label={`Show ${img.label ?? `image ${i + 1}`}`}
              aria-current={i === index}
              className="group text-center text-xs"
            >
              <span className={cn("relative mb-1 block aspect-square overflow-hidden rounded-sm border-2 bg-surface", i === index ? "border-ink" : "border-transparent opacity-75 group-hover:opacity-100")}>
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </span>
              {img.label && <span className={cn(i === index ? "font-semibold text-ink" : "text-muted")}>{img.label}</span>}
            </button>
          ))}
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-3">
        <div ref={ref} className="overflow-hidden rounded-sm bg-surface">
          <div className="flex">
            {images.map((img, i) => (
              <div key={`${img.url}-${i}`} className="relative aspect-[var(--pdp-ratio,4/5)] min-w-0 shrink-0 basis-full">
                <Image src={img.url} alt={img.alt} fill priority={i === 0} sizes="(min-width: 768px) 50vw, 100vw" className="[object-fit:var(--pdp-fit,cover)]" />
              </div>
            ))}
          </div>
        </div>
        {images.length > 1 && (
          <div className="flex justify-center gap-1 md:hidden" aria-hidden>
            {images.map((_, i) => (
              <span key={i} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-6 bg-ink" : "w-1.5 bg-surface-strong")} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Swipeable gallery with dots (mobile) and thumbnails (desktop). Resets when the variant changes. */
export function ProductGallery({ images, resetKey }: { images: ImageDTO[]; resetKey: string }) {
  const [ref, api] = useEmblaCarousel({ loop: images.length > 1 });
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setIndex(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  useEffect(() => {
    api?.reInit();
    api?.scrollTo(0, true);
    setIndex(0);
  }, [api, resetKey]);

  if (!images.length) return <div className="aspect-[var(--pdp-ratio,4/5)] rounded-lg bg-surface" />;

  return (
    <div className="space-y-3">
      <div ref={ref} className="overflow-hidden rounded-lg bg-surface">
        <div className="flex">
          {images.map((img, i) => (
            <div key={`${img.url}-${i}`} className="relative aspect-[var(--pdp-ratio,4/5)] min-w-0 shrink-0 basis-full">
              <Image
                src={img.url}
                alt={img.alt}
                fill
                priority={i === 0}
                sizes="(min-width: 768px) 50vw, 100vw"
                className="[object-fit:var(--pdp-fit,cover)]"
              />
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <>
          <div className="flex justify-center gap-1 md:hidden" aria-hidden>
            {images.map((_, i) => (
              <span key={i} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-6 bg-ink" : "w-1.5 bg-surface-strong")} />
            ))}
          </div>
          <div className="hidden gap-3 md:flex">
            {images.map((img, i) => (
              <button
                key={`${img.url}-thumb-${i}`}
                type="button"
                onClick={() => api?.scrollTo(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "relative size-20 overflow-hidden rounded-lg border-2",
                  i === index ? "border-ink" : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
