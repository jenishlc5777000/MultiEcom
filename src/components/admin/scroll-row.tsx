"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Horizontal row that scrolls when it doesn't fit, with a scroll indicator:
 * faded edges, arrow buttons and a thin progress bar. The current item
 * (aria-current) is scrolled into view, and the mouse wheel scrolls sideways.
 */
export function ScrollRow({ children, label, className }: { children: React.ReactNode; label: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ overflow: false, start: true, end: true, progress: 0, thumb: 1 });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setState({
      overflow: max > 2,
      start: el.scrollLeft <= 2,
      end: el.scrollLeft >= max - 2,
      progress: max > 0 ? el.scrollLeft / max : 0,
      thumb: el.scrollWidth > 0 ? el.clientWidth / el.scrollWidth : 1,
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Bring the current tab into view (without moving the page vertically).
    const current = el.querySelector<HTMLElement>("[aria-current]");
    if (current) el.scrollLeft = current.offsetLeft - el.clientWidth / 2 + current.offsetWidth / 2;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // Vertical mouse wheel scrolls the row sideways while it can.
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      const next = Math.min(max, Math.max(0, el.scrollLeft + e.deltaY));
      if (next === el.scrollLeft) return;
      e.preventDefault();
      el.scrollLeft = next;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      ro.disconnect();
      el.removeEventListener("wheel", onWheel);
    };
  }, [measure]);

  const nudge = (dir: -1 | 1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.7, behavior: "smooth" });
  const arrow = "absolute top-1/2 z-10 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-canvas text-ink shadow-float transition-all duration-300 hover:bg-surface";

  return (
    <div className={cn("relative mb-6", className)}>
      <div className="relative">
        <div
          ref={ref}
          onScroll={measure}
          role="navigation"
          aria-label={label}
          className="no-scrollbar flex gap-1 overflow-x-auto scroll-smooth px-1 py-1"
          style={
            state.overflow
              ? {
                  maskImage: `linear-gradient(to right, ${state.start ? "#000" : "transparent"} 0, #000 48px, #000 calc(100% - 48px), ${state.end ? "#000" : "transparent"} 100%)`,
                  WebkitMaskImage: `linear-gradient(to right, ${state.start ? "#000" : "transparent"} 0, #000 48px, #000 calc(100% - 48px), ${state.end ? "#000" : "transparent"} 100%)`,
                }
              : undefined
          }
        >
          {children}
        </div>
        {state.overflow && (
          <>
            <button type="button" aria-label="Scroll left" tabIndex={-1} onClick={() => nudge(-1)} className={cn(arrow, "-left-1", state.start ? "pointer-events-none scale-75 opacity-0" : "opacity-100")}>
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <button type="button" aria-label="Scroll right" tabIndex={-1} onClick={() => nudge(1)} className={cn(arrow, "-right-1", state.end ? "pointer-events-none scale-75 opacity-0" : "opacity-100")}>
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </>
        )}
      </div>
      {state.overflow && (
        // Progress track: the thumb's width is the visible share, its position the scroll position.
        <div className="mx-1 mt-2 h-[3px] overflow-hidden rounded-full bg-line/70" aria-hidden>
          <div
            className="h-full rounded-full bg-ink/70 transition-[margin] duration-150 ease-out"
            style={{ width: `${Math.max(12, state.thumb * 100)}%`, marginLeft: `${state.progress * (100 - Math.max(12, state.thumb * 100))}%` }}
          />
        </div>
      )}
    </div>
  );
}
