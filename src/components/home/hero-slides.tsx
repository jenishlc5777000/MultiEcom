"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { ImageDTO } from "@/types/dto";

/**
 * Hero pictures that change by themselves (Studio → Content → Hero → "Change
 * automatically"). Cross-fades; pauses when the visitor prefers reduced motion.
 */
export function HeroSlides({ images, sizes, fit = "cover", seconds = 6 }: { images: ImageDTO[]; sizes: string; fit?: "cover" | "contain"; seconds?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (images.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % images.length), Math.max(3, seconds) * 1000);
    return () => clearInterval(t);
  }, [images.length, seconds]);

  return (
    <>
      {images.map((img, n) => (
        <Image
          key={img.url}
          src={img.url}
          alt={n === i ? img.alt : ""}
          aria-hidden={n !== i}
          fill
          priority={n === 0}
          sizes={sizes}
          className={cn("transition-opacity duration-1000", fit === "contain" ? "object-contain p-4" : "object-cover", n === i ? "opacity-100" : "opacity-0")}
        />
      ))}
      {images.length > 1 && (
        <div className="absolute bottom-3 right-3 z-10 flex gap-1.5" role="tablist" aria-label="Hero pictures">
          {images.map((img, n) => (
            <button
              key={img.url}
              type="button"
              role="tab"
              aria-selected={n === i}
              aria-label={`Picture ${n + 1}`}
              onClick={() => setI(n)}
              className={cn("h-1.5 rounded-full bg-canvas/90 shadow transition-all", n === i ? "w-5" : "w-1.5 opacity-60")}
            />
          ))}
        </div>
      )}
    </>
  );
}
