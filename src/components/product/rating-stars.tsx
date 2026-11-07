import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Stars are decorative; the rating is always also given as text. */
export function RatingStars({ value, count, className, compact = false }: { value: number; count?: number; className?: string; compact?: boolean }) {
  if (!count) return null;
  if (compact) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs text-muted", className)}>
        <Star className="size-3.5 fill-ink text-ink" aria-hidden />
        <span className="text-ink">{value.toFixed(1)}</span> ({count})
        <span className="sr-only">Rated {value.toFixed(1)} out of 5 from {count} reviews</span>
      </span>
    );
  }
  return (
    <div className={cn("flex items-center gap-1.5 text-sm", className)}>
      <div className="flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={cn("size-4", i <= Math.round(value) ? "fill-ink text-ink" : "text-line")} />
        ))}
      </div>
      <span className="text-ink">
        {value.toFixed(1)}
        <span className="text-muted"> ({count})</span>
      </span>
      <span className="sr-only">Rated {value.toFixed(1)} out of 5 from {count} reviews</span>
    </div>
  );
}
