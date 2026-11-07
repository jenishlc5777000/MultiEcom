"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatINR } from "@/lib/utils";

type Point = { date: string; revenue: number; orders: number };

const H = 260;
const PAD = { top: 28, right: 8, bottom: 28, left: 52 };

/** Round the axis max up to a clean step (1/2/5 × 10^n), in rupees. */
function niceTicks(maxRupees: number, count = 4) {
  if (maxRupees <= 0) return [0, 1000, 2000, 3000, 4000];
  const raw = maxRupees / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  return Array.from({ length: count + 1 }, (_, i) => i * step).filter((t, i, a) => i === 0 || a[i - 1]! < maxRupees || t <= step * count);
}

const compact = (rupees: number) =>
  rupees >= 100000 ? `₹${(rupees / 100000).toFixed(rupees % 100000 ? 1 : 0)}L` : rupees >= 1000 ? `₹${(rupees / 1000).toFixed(rupees % 1000 ? 1 : 0)}K` : `₹${rupees}`;

const dayLabel = (iso: string, withYear = false) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) });

/**
 * Daily revenue, single series in the accent hue (the title names it, so no legend).
 * Hover or arrow keys move a readout; the peak day is labelled directly; a table
 * view below carries every value.
 */
export function RevenueChart({ series }: { series: Point[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => e && setWidth(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(() => {
    const maxRupees = Math.max(0, ...series.map((p) => p.revenue / 100));
    const ticks = niceTicks(maxRupees);
    const top = ticks.at(-1) ?? 1;
    const innerW = width - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const band = innerW / Math.max(1, series.length);
    const barW = Math.max(2, Math.min(24, band - 2)); // ≤24px, ≥2px surface gap between bars
    const y = (rupees: number) => PAD.top + innerH - (rupees / top) * innerH;
    const peak = series.reduce((best, p, i) => (p.revenue > (series[best]?.revenue ?? -1) ? i : best), 0);
    const labelEvery = Math.ceil(series.length / Math.max(2, Math.floor(innerW / 72)));
    return { ticks, y, band, barW, innerH, peak, labelEvery, baseline: PAD.top + innerH };
  }, [series, width]);

  const total = series.reduce((n, p) => n + p.revenue, 0);
  const shown = active ?? null;
  const ap = shown !== null ? series[shown] : undefined;

  const onKey = (e: React.KeyboardEvent) => {
    if (!series.length) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      setActive((i) => {
        const cur = i ?? (e.key === "ArrowRight" ? -1 : series.length);
        return Math.min(series.length - 1, Math.max(0, cur + (e.key === "ArrowRight" ? 1 : -1)));
      });
    }
    if (e.key === "Escape") setActive(null);
  };

  return (
    <div>
      <div
        ref={wrap}
        className="relative outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-4 focus-visible:ring-offset-canvas"
        tabIndex={0}
        role="group"
        aria-label={`Revenue per day, ${series.length} days, total ${formatINR(total)}. Use left and right arrow keys to read each day.`}
        onKeyDown={onKey}
        onBlur={() => setActive(null)}
        onPointerLeave={() => setActive(null)}
      >
        <svg width={width} height={H} className="block" aria-hidden>
          {/* gridlines + y ticks: hairline, solid, recessive */}
          {layout.ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={layout.y(t)} y2={layout.y(t)} stroke="rgb(var(--line))" strokeWidth={1} />
              <text x={PAD.left - 10} y={layout.y(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">
                {compact(t)}
              </text>
            </g>
          ))}

          {series.map((p, i) => {
            const x = PAD.left + i * layout.band + (layout.band - layout.barW) / 2;
            const yTop = layout.y(p.revenue / 100);
            const h = layout.baseline - yTop;
            const r = Math.min(4, layout.barW / 2, h);
            const isActive = shown === i;
            return (
              <g key={p.date}>
                {h > 0 && (
                  <path
                    d={`M${x},${layout.baseline} V${yTop + r} Q${x},${yTop} ${x + r},${yTop} H${x + layout.barW - r} Q${x + layout.barW},${yTop} ${x + layout.barW},${yTop + r} V${layout.baseline} Z`}
                    className="transition-opacity duration-150"
                    fill="rgb(var(--accent))"
                    opacity={shown === null || isActive ? 1 : 0.45}
                  />
                )}
                {/* hit target: the whole band, taller than the mark */}
                <rect x={PAD.left + i * layout.band} y={PAD.top} width={layout.band} height={layout.innerH} fill="transparent" onPointerEnter={() => setActive(i)} />
                {i % layout.labelEvery === 0 && (
                  <text x={x + layout.barW / 2} y={H - 8} textAnchor="middle" className="fill-muted text-[11px]">
                    {dayLabel(p.date)}
                  </text>
                )}
              </g>
            );
          })}

          {/* selective direct label: the peak day only */}
          {series[layout.peak]?.revenue ? (
            <text
              x={PAD.left + layout.peak * layout.band + layout.band / 2}
              y={layout.y((series[layout.peak]?.revenue ?? 0) / 100) - 8}
              textAnchor="middle"
              className="fill-ink text-[11px] font-medium tabular-nums"
            >
              {compact(Math.round((series[layout.peak]?.revenue ?? 0) / 100))}
            </text>
          ) : null}

          <line x1={PAD.left} x2={width - PAD.right} y1={layout.baseline} y2={layout.baseline} stroke="rgb(var(--muted))" strokeOpacity={0.4} />
        </svg>

        {ap && shown !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 z-10 min-w-36 -translate-x-1/2 rounded-md border border-line bg-paper px-3 py-2 text-sm shadow-float"
            style={{ left: Math.min(width - 80, Math.max(80, PAD.left + shown * layout.band + layout.band / 2)) }}
          >
            <p className="font-semibold tabular-nums text-ink">{formatINR(ap.revenue)}</p>
            <p className="flex items-center gap-2 text-muted">
              <span className="h-0.5 w-3 rounded-full bg-accent" aria-hidden />
              {dayLabel(ap.date, true)} · {ap.orders} order{ap.orders === 1 ? "" : "s"}
            </p>
          </div>
        )}
      </div>

      <details className="mt-3 text-sm">
        <summary className="inline-flex min-h-9 cursor-pointer items-center text-muted hover:text-ink">View as table</summary>
        <div className="mt-2 max-h-64 overflow-y-auto rounded-md border border-line">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 text-right font-medium">Orders</th>
                <th className="px-3 py-2 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {series.map((p) => (
                <tr key={p.date} className="border-t border-line/70">
                  <td className="px-3 py-1.5">{dayLabel(p.date, true)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{p.orders}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{formatINR(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
