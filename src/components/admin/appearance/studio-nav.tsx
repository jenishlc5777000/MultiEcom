"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Brush, CaseSensitive, Contact, FileText, Footprints, Info, Layers, LayoutGrid, LayoutTemplate, Palette, PanelTop, Search, ShoppingBag, SlidersHorizontal, Eye,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hasUnsavedSections } from "./shared";

type TabDef = { value: string; label: string; icon: LucideIcon; hint: string };

/** Studio tabs, grouped by what the owner wants to do. */
export const STUDIO_GROUPS: { title: string; tabs: TabDef[] }[] = [
  {
    title: "Look",
    tabs: [
      { value: "theme", label: "Theme", icon: Palette, hint: "Pick a complete design" },
      { value: "style", label: "Fonts & colours", icon: Brush, hint: "Fonts, colours, effects, animation" },
      { value: "cards", label: "Product cards", icon: LayoutGrid, hint: "How products look in lists" },
    ],
  },
  {
    title: "Home page",
    tabs: [
      { value: "sections", label: "Sections", icon: Layers, hint: "Build the home page from blocks" },
      { value: "layout", label: "Layout & hero", icon: LayoutTemplate, hint: "Home page type, hero design" },
      { value: "content", label: "Content", icon: FileText, hint: "Hero, story, process texts and pictures" },
    ],
  },
  {
    title: "Site parts",
    tabs: [
      { value: "header", label: "Header & logo", icon: PanelTop, hint: "Header, menu, logo, favicon" },
      { value: "footer", label: "Footer", icon: Footprints, hint: "Footer design and text" },
      { value: "pages", label: "Pages & lists", icon: SlidersHorizontal, hint: "Category, product and list pages" },
      { value: "visibility", label: "Visibility", icon: Eye, hint: "Turn pages and parts on or off" },
    ],
  },
  {
    title: "Words",
    tabs: [
      { value: "labels", label: "Text & labels", icon: CaseSensitive, hint: "Every button, menu item and small heading" },
      { value: "contact", label: "Contact form", icon: Contact, hint: "Form, emails and replies" },
    ],
  },
  {
    title: "Shop features",
    tabs: [
      { value: "search", label: "Search", icon: Search, hint: "Search box and results" },
      { value: "shopping", label: "Shopping", icon: ShoppingBag, hint: "Favourites, offers, deals, recently viewed" },
    ],
  },
];

/** Settings the finder can jump to: tab + panel id + words people might type. */
const FIND: { tab: string; panel?: string; title: string; words: string }[] = [
  { tab: "theme", panel: "theme", title: "Theme", words: "design look template style switch" },
  { tab: "theme", panel: "theme-transfer", title: "Export / import", words: "backup download upload copy" },
  { tab: "style", panel: "typography", title: "Fonts & shapes", words: "font typography heading size corner radius rounded" },
  { tab: "style", panel: "colours", title: "Colours", words: "color colour background accent brand button" },
  { tab: "style", panel: "surface", title: "Surface style / effects", words: "glass neubrutalism shadow clay neon effect" },
  { tab: "style", panel: "gradient", title: "Gradient", words: "gradient background" },
  { tab: "style", panel: "animations", title: "Animations", words: "motion animation scroll reveal" },
  { tab: "cards", panel: "cards", title: "Product card style", words: "card product tile" },
  { tab: "cards", panel: "card-grid", title: "Cards per row & size", words: "columns grid gap width" },
  { tab: "cards", panel: "card-text", title: "Card text", words: "name price font size" },
  { tab: "cards", panel: "card-content", title: "What cards show", words: "badge rating swatch quick add" },
  { tab: "sections", panel: "sections", title: "Home page sections (builder)", words: "blocks builder add section banner gallery products" },
  { tab: "layout", panel: "home-type", title: "Home page type", words: "landing shop lookbook bento spotlight magazine marketplace gallery showcase" },
  { tab: "layout", panel: "hero", title: "Hero design", words: "hero banner top big picture" },
  { tab: "layout", panel: "categories", title: "Category section design", words: "categories home" },
  { tab: "layout", panel: "sections", title: "Landing sections on/off", words: "ticker story process new arrivals order" },
  { tab: "content", panel: "content-hero", title: "Hero text & pictures", words: "title headline subtitle button slideshow image featured" },
  { tab: "content", panel: "content-sections", title: "Section titles", words: "heading eyebrow" },
  { tab: "content", panel: "content-story", title: "Our story text", words: "about story" },
  { tab: "content", panel: "content-process", title: "The process steps", words: "steps how made" },
  { tab: "content", panel: "content-closing", title: "Closing call to action", words: "cta bottom" },
  { tab: "content", panel: "content-contact", title: "Contact page text", words: "contact intro" },
  { tab: "header", panel: "header", title: "Header design", words: "header top bar sticky announcement" },
  { tab: "header", panel: "category-menu", title: "Category menu flow", words: "menu mega dropdown drawer subcategories hover click" },
  { tab: "header", panel: "logo", title: "Logo", words: "logo brand name wordmark monogram" },
  { tab: "header", panel: "favicon", title: "Favicon (browser tab icon)", words: "favicon icon tab app" },
  { tab: "footer", panel: "footer", title: "Footer", words: "footer bottom tagline copyright" },
  { tab: "pages", panel: "listing", title: "Product lists", words: "list grid listing" },
  { tab: "pages", panel: "category-page", title: "Category pages & patterns", words: "category filters sort chips pattern mugs" },
  { tab: "pages", panel: "categories-page", title: "All categories page", words: "categories index" },
  { tab: "pages", panel: "product-page", title: "Product page", words: "product detail gallery reviews handmade note" },
  { tab: "visibility", panel: "visibility-parts", title: "Header / footer on or off", words: "hide show announcement tab bar" },
  { tab: "visibility", panel: "visibility-pages", title: "Pages on or off", words: "about contact search policies reviews hide" },
  { tab: "labels", title: "Text & labels (all buttons and menu words)", words: "add to cart buy now button menu shop footer free shipping returns sort filter quantity label text word rename" },
  { tab: "contact", panel: "contact-form", title: "Contact form", words: "form subjects phone" },
  { tab: "contact", panel: "contact-email", title: "Email to you", words: "notification email" },
  { tab: "contact", panel: "contact-reply", title: "Automatic reply", words: "auto reply email" },
  { tab: "search", panel: "search", title: "Header search", words: "search placeholder popular" },
  { tab: "search", panel: "search-results", title: "Search results page", words: "results" },
  { tab: "shopping", panel: "shop-favourites", title: "Favourites", words: "wishlist heart" },
  { tab: "shopping", panel: "shop-offers", title: "Offers", words: "discount sale offer" },
  { tab: "shopping", panel: "shop-hot", title: "Hot deals", words: "deal countdown" },
  { tab: "shopping", panel: "shop-best", title: "Most ordered", words: "bestseller popular" },
  { tab: "shopping", panel: "shop-recent", title: "Recently viewed", words: "history" },
];

/**
 * Studio navigation: tabs grouped by task, a "find a setting" box, and a
 * warning before leaving a tab with unsaved changes.
 */
export function StudioNav({ current }: { current: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const tabName = new Map(STUDIO_GROUPS.flatMap((g) => g.tabs.map((t) => [t.value, t.label])));
    return FIND.filter((f) => words.every((w) => `${f.title} ${f.words} ${tabName.get(f.tab)}`.toLowerCase().includes(w))).slice(0, 8).map((f) => ({ ...f, tabLabel: tabName.get(f.tab) ?? f.tab }));
  }, [q]);

  // Unsaved changes: warn when closing / reloading the page.
  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedSections()) e.preventDefault();
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);
  // Close the finder on outside click.
  useEffect(() => {
    const onDown = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const confirmLeave = () => !hasUnsavedSections() || confirm("You have unsaved changes on this tab. Leave without saving?");
  const go = (tab: string, panel?: string) => {
    if (!confirmLeave()) return;
    setQ("");
    setOpen(false);
    router.push(`/admin/studio?tab=${tab}${panel ? `#${panel}` : ""}`);
    if (panel) setTimeout(() => document.getElementById(panel)?.scrollIntoView({ behavior: "smooth", block: "start" }), 600);
  };

  return (
    <div className="mb-6 space-y-4">
      <div ref={box} className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls="studio-find-list"
          aria-label="Find a setting"
          placeholder="Find a setting… e.g. logo, button text, colours, free shipping"
          value={q}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            if (e.key === "Enter" && results[active]) { e.preventDefault(); go(results[active].tab, results[active].panel); }
            if (e.key === "Escape") setOpen(false);
          }}
          className="h-11 w-full rounded-pill border border-line bg-paper pl-10 pr-4 text-sm shadow-sm outline-none focus:border-ink"
        />
        {open && q.trim() && (
          <ul id="studio-find-list" role="listbox" className="absolute inset-x-0 top-full z-40 mt-1 overflow-hidden rounded-lg border border-line bg-canvas shadow-float">
            {results.length === 0 && <li className="px-4 py-3 text-sm text-muted">Nothing found. Try another word, or browse the groups below.</li>}
            {results.map((r, i) => (
              <li key={`${r.tab}-${r.panel ?? ""}`} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r.tab, r.panel)}
                  className={cn("flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm", i === active && "bg-surface")}
                >
                  <span className="font-medium">{r.title}</span>
                  <span className="shrink-0 text-xs text-muted">{r.tabLabel}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <nav aria-label="Studio sections" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {STUDIO_GROUPS.map((g) => (
          <div key={g.title} className="rounded-lg border border-line bg-paper/60 p-2">
            <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted">{g.title}</p>
            <ul className="space-y-0.5">
              {g.tabs.map((t) => {
                const on = t.value === current;
                return (
                  <li key={t.value}>
                    <Link
                      href={`/admin/studio?tab=${t.value}`}
                      aria-current={on ? "page" : undefined}
                      title={t.hint}
                      onClick={(e) => { if (!on && !confirmLeave()) e.preventDefault(); }}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                        on ? "bg-ink text-canvas" : "text-ink/80 hover:bg-surface hover:text-ink",
                      )}
                    >
                      <t.icon className="size-4 shrink-0" strokeWidth={1.7} aria-hidden />
                      <span className="truncate">{t.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <p className="flex items-center gap-2 text-xs text-muted">
        <Info className="size-3.5" aria-hidden /> {STUDIO_GROUPS.flatMap((g) => g.tabs).find((t) => t.value === current)?.hint}
      </p>
    </div>
  );
}
