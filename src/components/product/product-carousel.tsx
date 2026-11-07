"use client";

import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import { Button, ButtonArrow } from "@/components/ui/button";
import type { ProductCardDTO } from "@/types/dto";
import { ProductCard } from "./product-card";

type Props = { eyebrow?: string; title: string; products: ProductCardDTO[]; href?: string };

/** Swipeable row with a progress bar; arrow buttons on desktop. */
export function ProductCarousel({ eyebrow, title, products, href }: Props) {
  const [ref, api] = useEmblaCarousel({ align: "start", dragFree: true, containScroll: "trimSnaps" });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [progress, setProgress] = useState(0);

  const sync = useCallback(() => {
    if (!api) return;
    setCanPrev(api.canScrollPrev());
    setCanNext(api.canScrollNext());
    setProgress(Math.max(0, Math.min(1, api.scrollProgress())));
  }, [api]);

  useEffect(() => {
    if (!api) return;
    sync();
    api.on("select", sync).on("reInit", sync).on("scroll", sync);
    return () => {
      api.off("select", sync).off("reInit", sync).off("scroll", sync);
    };
  }, [api, sync]);

  if (!products.length) return null;

  return (
    <section aria-label={title} className="space-y-8">
      <Reveal className="flex items-end justify-between gap-6">
        <div className="space-y-3">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2 className="text-h2">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {href && (
            <Button asChild variant="link" className="mr-4 hidden sm:inline-flex">
              <Link href={href}>View all <ButtonArrow /></Link>
            </Button>
          )}
          <Button variant="secondary" size="icon" className="hidden md:inline-flex" onClick={() => api?.scrollPrev()} disabled={!canPrev} aria-label="Previous">
            <ArrowLeft />
          </Button>
          <Button variant="secondary" size="icon" className="hidden md:inline-flex" onClick={() => api?.scrollNext()} disabled={!canNext} aria-label="Next">
            <ArrowRight />
          </Button>
        </div>
      </Reveal>

      <div ref={ref} className="-mx-5 overflow-hidden px-5 md:-mx-10 md:px-10">
        <ul className="flex gap-4 md:gap-6">
          {products.map((p, i) => (
            <Reveal as="li" key={p.id} delay={Math.min(i, 4) * 80} className="min-w-0 shrink-0 basis-[72%] sm:basis-[42%] lg:basis-[23.5%]">
              <ProductCard product={p} sizes="(min-width: 1024px) 24vw, (min-width: 640px) 42vw, 72vw" />
            </Reveal>
          ))}
        </ul>
      </div>

      {(canPrev || canNext) && (
        <div className="h-px w-full bg-line" aria-hidden>
          <div className="h-px origin-left bg-ink transition-transform duration-300 ease-out" style={{ transform: `scaleX(${0.15 + progress * 0.85})` }} />
        </div>
      )}
    </section>
  );
}
