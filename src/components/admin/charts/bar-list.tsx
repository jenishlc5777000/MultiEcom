import Link from "next/link";

type Row = { key: string; label: string; value: number; display: string; sub?: string; href?: string };

/**
 * Ranked horizontal bars, largest first, one hue (ink). Each bar has its value
 * at the tip and its name as a text label, so identity is never colour-only.
 * Bars: 10px thick, square at the baseline, 4px rounded data-end.
 */
export function BarList({ rows, emptyText = "No data in this period." }: { rows: Row[]; emptyText?: string }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-muted">{emptyText}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-4">
      {rows.map((r) => {
        const pct = Math.max(1.5, (r.value / max) * 100);
        const label = r.href ? (
          <Link href={r.href} className="truncate hover:underline">{r.label}</Link>
        ) : (
          <span className="truncate">{r.label}</span>
        );
        return (
          <li key={r.key} title={`${r.label}: ${r.display}`}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-baseline gap-2">
                {label}
                {r.sub && <span className="shrink-0 text-xs text-muted">{r.sub}</span>}
              </span>
              <span className="shrink-0 font-medium tabular-nums">{r.display}</span>
            </div>
            <div className="h-2.5 w-full" aria-hidden>
              <div className="h-full rounded-r-[4px] bg-ink transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
