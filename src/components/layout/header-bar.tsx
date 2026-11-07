"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, ShoppingCart, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { mainNav, policyPages } from "@/config/site";
import { cn } from "@/lib/utils";
import type { CategoryDTO } from "@/types/dto";
import { defaultSiteConfig, type SiteConfig } from "@/lib/site-config";
import { SearchBox } from "@/components/search/search-box";
import { SearchTrigger } from "@/components/search/search-trigger";
import { FavouritesLink } from "@/components/shopping/favourite-button";
import { Logo } from "./logo";

type Props = {
  categories: CategoryDTO[];
  cartCount: number;
  announcement: string;
  /** Admin → Studio → Header & logo. */
  header?: SiteConfig["header"];
  brand?: SiteConfig["logo"];
  /** For the "topbar" header's utility strip. */
  contact?: { email: string; phone: string };
  /** Admin → Studio → Search. */
  search?: SiteConfig["search"];
  /** Main links after Studio → Visibility / Shopping (default: mainNav). */
  nav?: { href: string; label: string }[];
  /** Policy links (empty when policy pages are off). */
  policies?: { href: string; label: string }[];
  /** Header extras: favourites heart, search icon (off when the search page is off). */
  features?: { favourites: boolean; search: boolean; announcement: boolean };
};

/**
 * Desktop: logo · Shop (mega-menu) / About / Shipping · search, account, "Cart (n)".
 * Transparent at the top of the page, solid with blur once scrolled, hides on
 * scroll down and returns on scroll up. Mobile: logo · cart · animated menu.
 */
export function HeaderBar({
  categories, cartCount, announcement: announcementText, header: headerIn = defaultSiteConfig.header, brand, contact, search = defaultSiteConfig.search,
  nav: navIn, policies: policiesIn, features = { favourites: false, search: true, announcement: true },
}: Props) {
  const mainLinks = navIn ?? [...mainNav];
  const policyLinks = policiesIn ?? policyPages.map((p) => ({ href: `/policies/${p.slug}`, label: p.label }));
  const announcement = features.announcement ? announcementText : "";
  const header = { ...headerIn, showSearch: headerIn.showSearch && features.search };
  const searchCfg = { placeholder: search.placeholder, instant: search.instant, popular: search.popular };
  const v = header.variant;
  const bold = v === "bold";
  const floating = v === "floating";
  const centered = v === "centered";
  const accent = v === "accent";
  const boxed = v === "boxed";
  const compact = v === "compact";
  // Two-row designs: the inline menu moves to a second row on desktop.
  const stacked = v === "stacked";
  const searchBar = v === "search";
  const topbar = v === "topbar";
  /** Bars filled with a strong colour: light text and inverted cart button. */
  const inverse = bold || accent;
  // Minimal: no inline navigation, the full-screen menu is used on every screen size.
  const menuEverywhere = v === "minimal";
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastY = useRef(0);
  const headerRef = useRef<HTMLElement>(null);
  // Client: menus open on click (not hover) and subcategories start collapsed (Studio → Header).
  const hoverOpen = header.menuTrigger === "hover";
  const collapsed = header.menuSubcategories === "collapsed";
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggleExpanded = (id: string) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const nibbea = v === "nibbea";
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      setHidden(y > 240 && y > lastY.current + 4);
      if (y < lastY.current - 4) setHidden(false);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on navigation.
  useEffect(() => {
    setMegaOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMegaOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  useEffect(() => {
    if (!megaOpen || hoverOpen) return;
    const onDown = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setMegaOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [megaOpen, hoverOpen]);

  const openMega = () => {
    clearTimeout(closeTimer.current);
    setMegaOpen(true);
  };
  const closeMegaSoon = () => {
    closeTimer.current = setTimeout(() => setMegaOpen(false), 120);
  };

  const solid = scrolled || megaOpen || mobileOpen;
  const featured = categories.slice(0, 4);

  /** "Shop" mega-menu trigger + main links. Boxed: uppercase with dividers. */
  const desktopNav = (extra?: string) => (
    <nav aria-label="Main" className={cn("hidden items-center", boxed ? "gap-0 divide-x divide-ink/20 text-[13px] uppercase tracking-[0.14em]" : "gap-8", !menuEverywhere && "lg:flex", extra)}>
      <button
        type="button"
        aria-expanded={megaOpen}
        aria-controls="mega-menu"
        onMouseEnter={hoverOpen ? openMega : undefined}
        onClick={() => setMegaOpen((o) => !o)}
        className={cn("inline-flex min-h-touch items-center gap-1", boxed ? "px-5" : "text-[15px]")}
      >
        <span className={cn("link-underline", megaOpen && "[background-size:100%_1px]")}>Shop</span>
        <ChevronDown className={cn("size-4 transition-transform duration-300", megaOpen && "rotate-180")} aria-hidden />
      </button>
      {mainLinks.map((l) => (
        <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined} className={cn("link-underline inline-flex min-h-touch items-center", boxed ? "px-5" : "text-[15px]")} onMouseEnter={hoverOpen ? closeMegaSoon : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {announcement && header.announcement === "bar" && (
        <div data-studio="announcement" className="announcement-bar bg-ink px-4 py-2 text-center text-xs tracking-wide text-canvas">{announcement}</div>
      )}
      {announcement && header.announcement === "marquee" && (
        <div data-studio="announcement" className="announcement-bar overflow-hidden bg-ink py-2 text-xs tracking-wide text-canvas" role="note" aria-label={announcement}>
          <div className="flex w-max animate-marquee gap-16 pr-16" aria-hidden>
            {Array.from({ length: 8 }, (_, i) => <span key={i} className="whitespace-nowrap">{announcement}</span>)}
          </div>
        </div>
      )}
      {topbar && (
        <div className="hidden border-b border-line bg-surface text-xs text-muted md:block">
          <div className="container flex h-9 items-center justify-between gap-6">
            <span className="flex gap-5">
              {contact?.phone && <a href={`tel:${contact.phone}`} className="link-underline">{contact.phone}</a>}
              {contact?.email && <a href={`mailto:${contact.email}`} className="link-underline">{contact.email}</a>}
              {!contact?.phone && !contact?.email && <span>Handmade in small batches</span>}
            </span>
            <span className="flex gap-5">
              <Link href="/policies/shipping" className="link-underline">Shipping</Link>
              <Link href="/policies/returns" className="link-underline">Returns</Link>
              <Link href="/contact" className="link-underline">Contact</Link>
              <Link href="/profile" className="link-underline">Your orders</Link>
            </span>
          </div>
        </div>
      )}
      <header
        data-studio="header"
        className={cn(
          header.sticky ? "sticky top-0" : "relative",
          "z-50 transition-[transform,background-color,box-shadow,border-color] duration-500 ease-out",
          bold
            ? "border-b border-ink bg-ink text-canvas"
            : accent
              ? "border-b border-accent bg-accent text-on-accent"
              : floating
                ? "border-b border-transparent bg-transparent pt-3"
                : boxed
                  ? "border-y-2 border-ink bg-canvas"
                  : solid || stacked || searchBar || topbar || compact || nibbea
                    ? "border-b border-line/80 bg-canvas/90 backdrop-blur-xl"
                    : "border-b border-transparent bg-transparent",
          !inverse && !floating && !boxed && scrolled && !megaOpen && "shadow-[0_1px_0_0_rgb(var(--line))]",
          header.sticky && header.hideOnScroll && hidden && !megaOpen && !mobileOpen && "-translate-y-full",
        )}
        ref={headerRef}
        onMouseLeave={hoverOpen ? closeMegaSoon : undefined}
      >
        {nibbea ? (
          /* Nibbea: "Category" menu button · centred logo · labelled icons */
          <div className="container grid h-[calc(var(--header-h)+8px)] grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div>
              <button
                type="button"
                aria-expanded={megaOpen || mobileOpen}
                aria-controls="mega-menu"
                onClick={() => {
                  if (window.matchMedia("(min-width: 1024px)").matches) setMegaOpen((o) => !o);
                  else setMobileOpen((o) => !o);
                }}
                className="btn-primary inline-flex min-h-11 items-center gap-2 rounded-pill bg-ink px-4 text-sm font-medium text-canvas transition-colors hover:bg-ink/90"
              >
                <Menu className="size-5" aria-hidden />
                <span className="hidden sm:inline">Category</span>
                <ChevronDown className={cn("size-4 transition-transform duration-300", (megaOpen || mobileOpen) && "rotate-180")} aria-hidden />
              </button>
            </div>
            <Logo brand={brand} onClick={() => setMobileOpen(false)} className="justify-self-center" />
            <div className="flex items-center justify-self-end gap-1 sm:gap-3">
              {features.favourites && <FavouritesLink className="hidden sm:inline-flex" />}
              {header.showAccount && (
                <Link href="/profile" className="hidden min-w-12 flex-col items-center gap-0.5 rounded-md px-1.5 py-1 text-[11px] font-medium text-ink transition-colors hover:text-accent sm:inline-flex">
                  <User className="size-5" strokeWidth={1.6} aria-hidden />
                  Profile
                </Link>
              )}
              {header.showSearch && (
                <span className="inline-flex min-w-12 flex-col items-center gap-0.5 px-1.5 py-1 text-[11px] font-medium text-ink">
                  <SearchTrigger mode={search.mode} config={searchCfg} className="inline-flex size-5 items-center justify-center transition-colors hover:text-accent [&_svg]:!size-5" />
                  <span aria-hidden>Search</span>
                </span>
              )}
              <Link href="/cart" aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`} className="relative inline-flex min-w-12 flex-col items-center gap-0.5 rounded-md px-1.5 py-1 text-[11px] font-medium text-ink transition-colors hover:text-accent">
                <ShoppingCart className="size-5" strokeWidth={1.6} aria-hidden />
                {cartCount > 0 && (
                  <span key={cartCount} className="absolute -top-0.5 right-1 inline-flex min-w-4 animate-in zoom-in-50 items-center justify-center rounded-full bg-accent px-1 text-[10px] leading-4 text-on-accent">{cartCount}</span>
                )}
                Cart
              </Link>
            </div>
          </div>
        ) : (
        <div
          className={cn(
            "container flex items-center justify-between gap-6",
            compact ? "h-14" : stacked ? "h-[calc(var(--header-h)+8px)]" : "h-[var(--header-h)]",
            (centered || stacked) && "lg:grid lg:grid-cols-[1fr_auto_1fr]",
            floating && "max-w-[calc(1360px-2rem)] rounded-[min(var(--r-lg),28px)] border border-line bg-canvas/90 shadow-float backdrop-blur-xl",
          )}
        >
          {/* Stacked: an empty left cell keeps the logo centred */}
          {stacked && <span className="hidden lg:block" aria-hidden />}
          <Logo
            brand={brand}
            onClick={() => setMobileOpen(false)}
            className={cn(
              (centered || stacked) && "lg:justify-self-center",
              centered && "lg:order-2",
              stacked && "lg:[&>span]:!text-[40px]",
              compact && "[&>span]:!text-[24px]",
            )}
          />

          {searchBar && header.showSearch && (
            <SearchBox config={searchCfg} size="sm" className="hidden max-w-xl flex-1 text-ink md:block" />
          )}

          {/* Desktop navigation (on its own row for the stacked and search designs) */}
          {!stacked && !searchBar && desktopNav(cn(centered && "lg:order-1 lg:justify-self-start"))}

          <div className={cn("flex items-center gap-1", (centered || stacked) && "lg:order-3 lg:justify-self-end")}>
            {header.showSearch && !searchBar && (
              <SearchTrigger
                mode={search.mode}
                config={searchCfg}
                className={cn("hidden size-touch items-center justify-center rounded-full transition-colors md:inline-flex", inverse ? "hover:bg-white/10" : "hover:bg-surface")}
              />
            )}
            {features.favourites && <FavouritesLink className={cn("hidden md:inline-flex", inverse && "hover:bg-white/10")} />}
            {header.showAccount && (
              <Link href="/profile" aria-label="Account" className={cn("hidden size-touch items-center justify-center rounded-full transition-colors md:inline-flex", inverse ? "hover:bg-white/10" : "hover:bg-surface")}>
                <User className="size-5" strokeWidth={1.5} />
              </Link>
            )}
            <Link
              href="/cart"
              aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
              className={cn(
                "ml-1 inline-flex items-center gap-2 rounded-pill px-4 text-sm font-medium transition-colors",
                compact ? "min-h-10" : "min-h-touch",
                inverse ? "bg-canvas text-ink hover:bg-canvas/85" : boxed ? "border-2 border-ink text-ink hover:bg-ink hover:text-canvas" : "btn-primary bg-ink text-canvas hover:bg-ink/85",
              )}
            >
              Cart
              <span key={cartCount} className={cn("inline-flex min-w-5 animate-in zoom-in-50 items-center justify-center rounded-full px-1.5 text-xs leading-5 duration-300", inverse || boxed ? "bg-ink text-canvas" : "bg-canvas text-ink")}>
                {cartCount}
              </span>
            </Link>

            {/* Mobile menu toggle: two lines morph into an X */}
            <button
              type="button"
              className={cn("relative ml-1 inline-flex size-touch items-center justify-center rounded-full", !menuEverywhere && "lg:hidden")}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((o) => !o)}
            >
              <span className={cn("absolute h-px w-5 bg-current transition-transform duration-300", mobileOpen ? "rotate-45" : "-translate-y-[4px]")} />
              <span className={cn("absolute h-px w-5 bg-current transition-transform duration-300", mobileOpen ? "-rotate-45" : "translate-y-[4px]")} />
            </button>
          </div>
        </div>
        )}

        {/* Second row: centred menu (stacked) or category bar (search) */}
        {stacked && (
          <div className="hidden border-t border-line/70 lg:block">
            <div className="container flex h-12 items-center justify-center">{desktopNav()}</div>
          </div>
        )}
        {searchBar && (
          <div className="hidden border-t border-line/70 lg:block">
            <nav aria-label="Categories" className="container flex h-11 items-center gap-7 text-sm">
              <button type="button" aria-expanded={megaOpen} aria-controls="mega-menu" onMouseEnter={hoverOpen ? openMega : undefined} onClick={() => setMegaOpen((o) => !o)} className="inline-flex items-center gap-1 font-medium">
                All categories <ChevronDown className={cn("size-4 transition-transform duration-300", megaOpen && "rotate-180")} aria-hidden />
              </button>
              {header.showCategoryBar && categories.slice(0, 7).map((c) => (
                <Link key={c.id} href={`/category/${c.slug}`} onMouseEnter={hoverOpen ? closeMegaSoon : undefined} className="link-underline text-muted hover:text-ink">{c.name}</Link>
              ))}
              <span className="ml-auto flex gap-6 text-muted">
                {mainLinks.map((l) => <Link key={l.href} href={l.href} onMouseEnter={hoverOpen ? closeMegaSoon : undefined} className="link-underline hover:text-ink">{l.label}</Link>)}
              </span>
            </nav>
          </div>
        )}

        {/* Desktop mega-menu */}
        <div
          id="mega-menu"
          onMouseEnter={hoverOpen ? openMega : undefined}
          className={cn(
            "absolute inset-x-0 top-full hidden border-b border-line bg-canvas text-ink shadow-float transition-all duration-500 ease-out",
            !menuEverywhere && "lg:block",
            megaOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0",
          )}
        >
          <div className="container grid grid-cols-[220px_1fr] gap-12 py-10">
            <div className="space-y-6">
              <p className="eyebrow">Shop</p>
              <ul className="space-y-2">
                {categories.map((c) => (
                  <li key={c.id}>
                    <span className="flex items-center gap-2">
                      <Link href={`/category/${c.slug}`} className="link-underline font-display text-2xl" tabIndex={megaOpen ? 0 : -1}>
                        {c.name}
                      </Link>
                      {collapsed && c.children.length > 0 && (
                        <button
                          type="button"
                          aria-expanded={expanded.has(c.id)}
                          aria-label={`${expanded.has(c.id) ? "Hide" : "Show"} ${c.name} subcategories`}
                          onClick={() => toggleExpanded(c.id)}
                          tabIndex={megaOpen ? 0 : -1}
                          className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-ink"
                        >
                          <ChevronDown className={cn("size-4 transition-transform duration-300", expanded.has(c.id) && "rotate-180")} aria-hidden />
                        </button>
                      )}
                    </span>
                    {c.children.length > 0 && (!collapsed || expanded.has(c.id)) && (
                      <ul className="mb-2 mt-1 space-y-1 border-l border-line pl-3">
                        {c.children.map((k) => (
                          <li key={k.id}>
                            <Link href={`/category/${k.slug}`} className="link-underline text-sm text-muted hover:text-ink" tabIndex={megaOpen ? 0 : -1}>
                              {k.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
                <li className="pt-2">
                  <Link href="/category" className="link-underline text-sm text-muted" tabIndex={megaOpen ? 0 : -1}>
                    All categories →
                  </Link>
                </li>
              </ul>
            </div>
            <ul className="grid grid-cols-4 gap-5">
              {featured.map((c, i) => (
                <li
                  key={c.id}
                  className={cn("transition-all duration-500 ease-out", megaOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0")}
                  style={{ transitionDelay: megaOpen ? `${80 + i * 60}ms` : "0ms" }}
                >
                  <Link href={`/category/${c.slug}`} className="group block" tabIndex={megaOpen ? 0 : -1}>
                    <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-surface">
                      {c.image && <Image src={c.image.url} alt="" fill sizes="240px" className="object-cover transition-transform duration-700 group-hover:scale-105" />}
                    </div>
                    <p className="mt-3 text-sm">{c.name}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      {/* Mobile full-screen menu */}
      <div
        id="mobile-menu"
        className={cn(
          "fixed inset-0 z-40 flex flex-col overflow-hidden bg-canvas text-ink pt-[calc(var(--header-h)+1rem)] transition-[opacity,visibility] duration-500",
          !menuEverywhere && "lg:hidden",
          mobileOpen ? "visible opacity-100" : "invisible opacity-0",
        )}
        aria-hidden={!mobileOpen}
      >
        <nav aria-label="Mobile" className="container w-full min-w-0 flex-1 overflow-y-auto overflow-x-hidden pb-32">
          <p className="eyebrow mb-4">Shop</p>
          <ul className="space-y-1">
            {[
              ...categories.map((c) => ({ href: `/category/${c.slug}`, label: c.name, children: c.children })),
              { href: "/category", label: "All categories", children: [] },
            ].map((l, i) => (
              <li key={l.href}>
                <div className="flex items-center gap-2 overflow-hidden">
                  <Link
                    href={l.href}
                    tabIndex={mobileOpen ? 0 : -1}
                    className={cn("block py-1 font-display text-[42px] leading-tight transition-transform duration-700 ease-out", mobileOpen ? "translate-y-0" : "translate-y-full")}
                    style={{ transitionDelay: mobileOpen ? `${100 + i * 50}ms` : "0ms" }}
                  >
                    {l.label}
                  </Link>
                  {collapsed && l.children.length > 0 && (
                    <button
                      type="button"
                      aria-expanded={expanded.has(l.href)}
                      aria-label={`${expanded.has(l.href) ? "Hide" : "Show"} ${l.label} subcategories`}
                      onClick={() => toggleExpanded(l.href)}
                      tabIndex={mobileOpen ? 0 : -1}
                      className="inline-flex size-touch shrink-0 items-center justify-center rounded-full border border-line text-muted"
                    >
                      <ChevronDown className={cn("size-5 transition-transform duration-300", expanded.has(l.href) && "rotate-180")} aria-hidden />
                    </button>
                  )}
                </div>
                {l.children.length > 0 && (!collapsed || expanded.has(l.href)) && (
                  <ul className={cn("mb-3 flex flex-wrap gap-2 transition-opacity duration-700", mobileOpen ? "opacity-100" : "opacity-0")}>
                    {l.children.map((k) => (
                      <li key={k.id}>
                        <Link
                          href={`/category/${k.slug}`}
                          tabIndex={mobileOpen ? 0 : -1}
                          className="inline-flex min-h-9 items-center rounded-pill border border-line px-3 text-sm text-muted"
                        >
                          {k.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-1 border-t border-line pt-6 text-[15px]">
            {[
              ...mainLinks.filter((l) => !l.href.startsWith("/policies/")),
              ...policyLinks,
            ].map((l) => (
              <Link key={l.href} href={l.href} tabIndex={mobileOpen ? 0 : -1} className="flex min-h-touch items-center text-muted hover:text-ink">
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}
