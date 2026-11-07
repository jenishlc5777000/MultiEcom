"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useFavourites } from "@/lib/client-lists";
import { cn } from "@/lib/utils";

/**
 * Heart toggle for a product. Hidden everywhere when favourites are turned
 * off in Studio → Shopping (html[data-favs="off"] .fav-ui { display:none }).
 */
export function FavouriteButton({ productId, name, variant = "icon", className }: { productId: string; name: string; variant?: "icon" | "button"; className?: string }) {
  const { has, toggle } = useFavourites();
  const on = has(productId);
  const label = on ? `Remove ${name} from favourites` : `Add ${name} to favourites`;
  const click = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(productId);
  };
  if (variant === "button") {
    return (
      <button type="button" onClick={click} aria-pressed={on} aria-label={label} className={cn("fav-ui inline-flex min-h-12 items-center gap-2 rounded-pill border border-line px-5 text-sm font-medium transition-colors hover:border-ink", on && "border-accent text-accent", className)}>
        <Heart className={cn("size-[18px]", on && "fill-current")} aria-hidden /> {on ? "Saved to favourites" : "Add to favourites"}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={click}
      aria-pressed={on}
      aria-label={label}
      title={on ? "In your favourites" : "Add to favourites"}
      className={cn("fav-ui flex size-9 items-center justify-center rounded-full bg-canvas/90 text-ink shadow-sm backdrop-blur transition-transform hover:scale-110", on && "text-accent", className)}
    >
      <Heart className={cn("size-[17px]", on && "fill-current")} aria-hidden />
    </button>
  );
}

/** Header link to /favourites with a count (for the header bar). */
export function FavouritesLink({ className }: { className?: string }) {
  const { list } = useFavourites();
  return (
    <Link href="/favourites" aria-label={`Favourites, ${list.length} item${list.length === 1 ? "" : "s"}`} className={cn("fav-ui relative inline-flex size-touch items-center justify-center rounded-full transition-colors hover:bg-surface", className)}>
      <Heart className="size-5" strokeWidth={1.5} aria-hidden />
      {list.length > 0 && (
        <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] leading-4 text-on-accent">{list.length}</span>
      )}
    </Link>
  );
}
