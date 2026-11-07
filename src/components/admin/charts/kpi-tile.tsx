import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Stat tile: label · value · delta vs a named period. The delta is shown as an
 * arrow, a signed percentage and text, never colour alone. Values use the sans
 * face with proportional figures (DESIGN.md: serif is not used for data).
 */
export function KpiTile({ label, value, delta, period, hero = false }: { label: string; value: string; delta: number | null; period: string; hero?: boolean }) {
  const dir = delta === null || Math.abs(delta) < 0.005 ? "flat" : delta > 0 ? "up" : "down";
  const Icon = dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : Minus;
  return (
    <div className={cn("rounded-lg border border-line bg-paper/60 p-5", hero && "bg-ink text-canvas sm:col-span-2 lg:col-span-1")}>
      <p className={cn("text-sm", hero ? "text-canvas/70" : "text-muted")}>{label}</p>
      <p className={cn("mt-2 font-sans font-semibold leading-none tracking-tight", hero ? "text-5xl" : "text-3xl")}>{value}</p>
      <p
        className={cn(
          "mt-3 inline-flex items-center gap-1 text-xs",
          dir === "up" && (hero ? "text-ready-soft" : "text-ready"),
          dir === "down" && (hero ? "text-accent-soft" : "text-danger"),
          dir === "flat" && (hero ? "text-canvas/60" : "text-muted"),
        )}
      >
        <Icon className="size-3.5" aria-hidden />
        {delta === null ? "No data for the previous period" : `${delta > 0 ? "+" : ""}${(delta * 100).toFixed(0)}% vs ${period}`}
      </p>
    </div>
  );
}
