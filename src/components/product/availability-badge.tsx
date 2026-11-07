import type { Availability } from "@/models/Product";
import { cn } from "@/lib/utils";

/** Tags: tinted background + full-strength text colour (passes WCAG AA). */
const styles: Record<Availability, { label: string; className: string; dot: string }> = {
  READY_STOCK: { label: "Ready to ship", className: "bg-ready/10 text-ready", dot: "bg-ready" },
  MADE_TO_ORDER: { label: "Made to order", className: "bg-mto/10 text-mto", dot: "bg-mto" },
  SOLD: { label: "Sold", className: "bg-sold/10 text-sold", dot: "bg-sold" },
};

export function AvailabilityBadge({ availability, className }: { availability: Availability; className?: string }) {
  const s = styles[availability];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium", s.className, className)}>
      <span className={cn("size-1.5 rounded-full", s.dot, availability === "READY_STOCK" && "animate-pulse")} aria-hidden />
      {s.label}
    </span>
  );
}

export function UniqueBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-pill bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent", className)}>
      One of a kind
    </span>
  );
}
