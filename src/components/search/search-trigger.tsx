"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SearchBox, type SearchBoxConfig } from "./search-box";

/**
 * The header's search icon. Depending on Admin → Studio → Search it links
 * to the search page, opens a full-screen overlay, or drops down a search box.
 * "/" anywhere on the page opens it too.
 */
export function SearchTrigger({ mode, config, className }: { mode: "page" | "overlay" | "dropdown"; config: SearchBoxConfig; className?: string }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (mode === "page") return;
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName));
      if (e.key === "/" && !typing) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode]);

  useEffect(() => {
    if (mode !== "overlay") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open, mode]);

  if (mode === "page") {
    return (
      <Link href="/search" aria-label="Search" className={className}>
        <Search className="size-5" strokeWidth={1.5} />
      </Link>
    );
  }

  return (
    <>
      <button ref={btn} type="button" aria-label="Search" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={className}>
        <Search className="size-5" strokeWidth={1.5} />
      </button>

      {mode === "overlay" && open && (
        <div role="dialog" aria-modal="true" aria-label="Search" className="fixed inset-0 z-[70] overflow-y-auto bg-canvas/95 text-ink backdrop-blur-xl animate-in fade-in-0">
          <div className="container max-w-4xl py-6">
            <div className="flex justify-end">
              <button type="button" onClick={() => setOpen(false)} aria-label="Close search" className="inline-flex size-touch items-center justify-center rounded-full hover:bg-surface"><X className="size-6" /></button>
            </div>
            <p className="eyebrow mb-4 mt-6">Search</p>
            <SearchBox config={config} size="lg" autoFocus onNavigate={() => setOpen(false)} />
            <p className="mt-6 text-xs text-muted">Press <kbd className="rounded border border-line px-1">Esc</kbd> to close · <kbd className="rounded border border-line px-1">/</kbd> opens search anywhere</p>
          </div>
        </div>
      )}

      {mode === "dropdown" && open && (
        <div className={cn("absolute inset-x-0 top-full z-40 border-b border-line bg-canvas text-ink shadow-float animate-in fade-in-0 slide-in-from-top-2")}>
          <div className="container max-w-2xl py-5">
            <SearchBox config={config} autoFocus onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
