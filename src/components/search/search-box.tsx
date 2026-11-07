"use client";

import { ArrowUpRight, Loader2, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { cn, formatINR } from "@/lib/utils";

type Suggestion = { products: { name: string; slug: string; priceFrom: number; image?: string }[]; categories: { name: string; slug: string }[] };

export type SearchBoxConfig = { placeholder: string; instant: boolean; popular: string[] };

/**
 * Search input with instant suggestions (products + categories) and keyboard
 * support. Used by the header overlay, the header dropdown, the "store search"
 * header and the search page. Enter goes to the full results page.
 */
export function SearchBox({
  config,
  size = "md",
  defaultValue = "",
  autoFocus = false,
  onNavigate,
  className,
}: {
  config: SearchBoxConfig;
  size?: "sm" | "md" | "lg";
  defaultValue?: string;
  autoFocus?: boolean;
  /** Called when a result is chosen (e.g. to close the overlay). */
  onNavigate?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const id = useId();
  const [q, setQ] = useState(defaultValue);
  const [data, setData] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!config.instant || q.trim().length < 2) {
      setData(null);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal });
        if (res.ok) setData((await res.json()) as Suggestion);
      } catch {
        /* aborted or offline: keep the last results */
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, config.instant]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const items = [
    ...(data?.categories ?? []).map((c) => ({ href: `/category/${c.slug}`, label: c.name, kind: "category" as const })),
    ...(data?.products ?? []).map((p) => ({ href: `/products/${p.slug}`, label: p.name, kind: "product" as const, p })),
  ];
  const go = (href: string) => {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  };
  const submit = () => q.trim() && go(`/search?q=${encodeURIComponent(q.trim())}`);
  const showPanel = open && (items.length > 0 || (q.trim().length < 2 && config.popular.length > 0) || (data && q.trim().length >= 2));
  const big = size === "lg";

  return (
    <div ref={wrap} className={cn("relative", className)}>
      <form
        role="search"
        action="/search"
        onSubmit={(e) => {
          e.preventDefault();
          if (active >= 0 && items[active]) go(items[active]!.href);
          else submit();
        }}
      >
        <label className="relative block">
          <span className="sr-only">Search the shop</span>
          <Search className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted", big ? "left-0 size-7" : "left-4 size-4")} aria-hidden />
          <input
            name="q"
            type="search"
            role="combobox"
            aria-expanded={Boolean(showPanel)}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            autoComplete="off"
            autoFocus={autoFocus}
            value={q}
            placeholder={config.placeholder}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setActive(-1);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(-1, a - 1)); }
              if (e.key === "Escape") setOpen(false);
            }}
            className={cn(
              "w-full text-ink placeholder:text-muted/70 focus:outline-none",
              big
                ? "border-0 border-b-2 border-line bg-transparent py-4 pl-11 pr-10 font-display text-3xl focus:border-ink md:text-5xl"
                : size === "sm"
                  ? "min-h-10 rounded-pill border border-line bg-paper pl-11 pr-9 text-sm focus:border-ink"
                  : "min-h-12 rounded-pill border border-line bg-paper pl-11 pr-10 text-[15px] focus:border-ink",
            )}
          />
          {loading ? (
            <Loader2 className={cn("absolute top-1/2 size-4 -translate-y-1/2 animate-spin text-muted", big ? "right-1" : "right-4")} aria-hidden />
          ) : q ? (
            <button type="button" aria-label="Clear search" onClick={() => { setQ(""); setData(null); }} className={cn("absolute top-1/2 -translate-y-1/2 text-muted hover:text-ink", big ? "right-1" : "right-3.5")}>
              <X className="size-4" />
            </button>
          ) : null}
        </label>
      </form>

      {showPanel && (
        <div id={`${id}-list`} role="listbox" className={cn("fx-panel z-50 mt-2 overflow-hidden rounded-lg border border-line bg-paper text-ink shadow-float", big ? "relative" : "absolute inset-x-0 top-full")}>
          {q.trim().length < 2 ? (
            <div className="p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {config.popular.map((term) => (
                  <button key={term} type="button" onClick={() => go(`/search?q=${encodeURIComponent(term)}`)} className="inline-flex min-h-9 items-center rounded-pill border border-line px-3 text-sm hover:border-ink">
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {items.length === 0 && !loading && <p className="p-4 text-sm text-muted">No quick matches. Press Enter to search everything.</p>}
              <ul className={cn("max-h-[60vh] overflow-y-auto", big && "grid gap-1 p-2 sm:grid-cols-2")}>
                {items.map((it, i) => (
                  <li key={it.href} role="option" aria-selected={i === active}>
                    <Link
                      href={it.href}
                      onClick={(e) => { e.preventDefault(); go(it.href); }}
                      onMouseEnter={() => setActive(i)}
                      className={cn("flex items-center gap-3 px-4 py-2.5 transition-colors", i === active ? "bg-surface" : "hover:bg-surface", big && "rounded-md")}
                    >
                      {it.kind === "product" ? (
                        <span className="relative size-11 shrink-0 overflow-hidden rounded-sm bg-surface">
                          {it.p.image && <Image src={it.p.image} alt="" fill sizes="44px" className="object-cover" />}
                        </span>
                      ) : (
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-sm bg-surface text-[10px] font-semibold uppercase text-muted">Cat</span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{it.label}</span>
                        <span className="text-xs text-muted">{it.kind === "product" ? formatINR(it.p.priceFrom) : "Category"}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={submit} className="flex w-full items-center justify-between border-t border-line px-4 py-3 text-sm font-medium hover:bg-surface">
                See all results for “{q.trim()}” <ArrowUpRight className="size-4" aria-hidden />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
