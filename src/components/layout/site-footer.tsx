import Link from "next/link";
import { ArrowUpRight, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { RichTitle } from "@/components/content/rich-title";
import { mainNav, policyPages, siteConfig } from "@/config/site";
import { cn, formatINR } from "@/lib/utils";
import { hasPublishedPosts } from "@/services/blog.service";
import { getCategories } from "@/services/catalog.service";
import { getSiteConfig } from "@/services/site-config.service";
import { getStoreInfo } from "@/services/store.service";
import { Logo, Wordmark } from "./logo";

type Col = { title: string; links: { href: string; label: string }[] };

/** Site footer. The design and text come from Admin → Studio → Footer. */
export async function SiteFooter() {
  const [categories, store, site, blogLive] = await Promise.all([getCategories(), getStoreInfo(), getSiteConfig(), hasPublishedPosts().catch(() => false)]);
  const f = site.footer;
  // Studio → Visibility: no links to pages that are switched off.
  const vis = site.visibility.pages;
  const v = f.variant;

  // Colour family: dark (ink), light (surface) or accent.
  const tone = v === "light" || v === "cards" || v === "split" ? "light" : v === "accent" ? "accent" : "dark";
  const shell = cn(
    "site-footer mt-24 overflow-hidden md:mt-32",
    tone === "light" ? "border-t border-line bg-surface text-ink" : tone === "accent" ? "bg-accent text-on-accent" : "bg-ink text-canvas",
  );
  const linkCls = tone === "light" ? "text-ink/80 hover:text-ink" : tone === "accent" ? "text-on-accent/85 hover:text-on-accent" : "text-canvas/85 hover:text-canvas";
  const muted = tone === "light" ? "text-muted" : tone === "accent" ? "text-on-accent/75" : "text-canvas/70";
  const heading = cn("text-eyebrow uppercase", tone === "light" ? "text-muted" : tone === "accent" ? "text-on-accent/60" : "text-canvas/50");
  const rule = tone === "light" ? "border-line" : tone === "accent" ? "border-on-accent/20" : "border-canvas/10";

  const studio = [
    ...(vis.about ? mainNav.filter((l) => l.href === "/about") : []),
    ...(site.contactForm.enabled && vis.contact ? [{ href: "/contact", label: "Contact" }] : []),
    ...(site.shopping.offersPage.enabled ? [{ href: "/offers", label: site.shopping.offersPage.title }] : []),
    // Admin → Blog → settings ("Show in the footer"), once a post is published.
    ...(site.blog.enabled && site.blog.showInFooter && blogLive ? [{ href: "/blog", label: site.blog.footerLabel || site.blog.title }] : []),
    ...(site.shopping.favourites.enabled ? [{ href: "/favourites", label: "Favourites" }] : []),
    { href: "/profile", label: "Your orders" },
    { href: "/cart", label: "Cart" },
  ];
  const columns = [
    f.showCategories && { title: "Shop", links: [...categories.map((c) => ({ href: `/category/${c.slug}`, label: c.name })), ...(vis.search ? [{ href: "/search", label: "Search" }] : [])] },
    { title: "Studio", links: studio },
    f.showPolicies && vis.policies && { title: "Help", links: policyPages.map((p) => ({ href: `/policies/${p.slug}`, label: p.label })) },
  ].filter(Boolean) as Col[];

  const centeredRow = v === "centered" || v === "minimal" || v === "stacked";
  const contact = f.showContact && (store.contactEmail || store.contactPhone || store.instagram) && (
    <ul className={cn("space-y-1 text-sm", centeredRow && "flex flex-wrap justify-center gap-x-6 space-y-0")}>
      {store.contactEmail && <li><a className="link-underline" href={`mailto:${store.contactEmail}`}>{store.contactEmail}</a></li>}
      {store.contactPhone && <li><a className="link-underline" href={`tel:${store.contactPhone}`}>{store.contactPhone}</a></li>}
      {store.instagram && <li><a className="link-underline" href={store.instagram} target="_blank" rel="noreferrer">Instagram</a></li>}
    </ul>
  );

  const linkList = (col: Col, className?: string) => (
    <ul className={cn("space-y-1", className)}>
      {col.links.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className={cn("inline-flex min-h-9 items-center transition-colors", linkCls)}>
            <span className="link-underline">{l.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
  const columnsNav = (className = "grid grid-cols-2 gap-10 sm:grid-cols-3") => (
    <nav aria-label="Footer" className={className}>
      {columns.map((col) => (
        <div key={col.title}>
          <p className={cn("mb-4", heading)}>{col.title}</p>
          {linkList(col)}
        </div>
      ))}
    </nav>
  );

  const bottom = (
    <div className={cn("container flex flex-col gap-2 border-t py-6 pb-28 text-xs md:flex-row md:justify-between md:pb-6", rule, tone === "light" ? "text-muted" : muted)}>
      <p>© {new Date().getFullYear()} {siteConfig.name}</p>
      {f.copyright && <p>{f.copyright}</p>}
    </div>
  );

  /* ───────────── Minimal: one row of links ───────────── */
  if (v === "minimal") {
    const links = columns.flatMap((c) => c.links).filter((l, i, all) => all.findIndex((x) => x.href === l.href) === i);
    return (
      <footer data-studio="footer" className={shell}>
        <div className="container flex flex-col items-center gap-6 py-12 text-center">
          <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            {links.map((l) => <Link key={l.href} href={l.href} className={cn("link-underline", linkCls)}>{l.label}</Link>)}
          </nav>
          {contact}
        </div>
        {bottom}
      </footer>
    );
  }

  /* ───────────── Centred: logo, tagline, columns, all centred ───────────── */
  if (v === "centered") {
    return (
      <footer data-studio="footer" className={shell}>
        <div className="container flex flex-col items-center gap-8 pb-12 pt-16 text-center md:pt-20">
          <Logo brand={site.logo} />
          {f.tagline && <p className={cn("max-w-md", muted)}>{f.tagline}</p>}
          {columnsNav("grid gap-8 sm:grid-cols-3 sm:gap-16")}
          {contact}
        </div>
        {bottom}
      </footer>
    );
  }

  /* ───────────── Stacked: giant centred wordmark, rows of links ───────────── */
  if (v === "stacked") {
    return (
      <footer data-studio="footer" className={shell}>
        <div className="container flex flex-col items-center gap-10 pb-12 pt-16 text-center md:pt-24">
          <p className="w-full select-none" aria-hidden>
            <Wordmark brand={site.logo} className="block text-[16vw] leading-[0.85] md:text-[12vw]" accentClassName="text-accent" />
          </p>
          {f.tagline && <p className={cn("max-w-lg text-lg", muted)}>{f.tagline}</p>}
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title} className="flex flex-wrap justify-center gap-x-7 gap-y-1 text-sm">
              {col.links.map((l) => <Link key={l.href} href={l.href} className={cn("link-underline", linkCls)}>{l.label}</Link>)}
            </nav>
          ))}
          {contact}
        </div>
        {bottom}
      </footer>
    );
  }

  /* ───────────── Split: big statement left, links right ───────────── */
  if (v === "split") {
    return (
      <footer data-studio="footer" className={shell}>
        <div className="container grid gap-14 pb-12 pt-16 lg:grid-cols-2 lg:gap-20 md:pt-24">
          <div className="space-y-8">
            <Logo brand={site.logo} />
            <p className="max-w-xl font-display text-h2 leading-tight">{f.tagline || siteConfig.description}</p>
            {contact}
            {site.contactForm.enabled && vis.contact && (
              <Link href="/contact" className="btn-primary inline-flex min-h-12 items-center gap-2 rounded-pill bg-ink px-6 text-sm font-medium text-canvas">
                Get in touch <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            )}
          </div>
          {columnsNav("grid grid-cols-2 gap-10 self-end sm:grid-cols-3")}
        </div>
        {bottom}
      </footer>
    );
  }

  /* ───────────── Cards: each link group in its own card ───────────── */
  if (v === "cards") {
    return (
      <footer data-studio="footer" className={shell}>
        <div className="container space-y-6 pb-12 pt-16">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-3">
              <Logo brand={site.logo} />
              {f.tagline && <p className={cn("max-w-sm", muted)}>{f.tagline}</p>}
            </div>
            {contact}
          </div>
          <nav aria-label="Footer" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {columns.map((col) => (
              <div key={col.title} className="rounded-lg border border-line bg-paper p-6">
                <p className={cn("mb-3", heading)}>{col.title}</p>
                {linkList(col, "grid grid-cols-2 gap-x-4 space-y-0")}
              </div>
            ))}
          </nav>
        </div>
        {bottom}
      </footer>
    );
  }

  /* ───────────── Mega: trust strip + every category and subcategory ───────────── */
  if (v === "mega") {
    const shipping =
      store.shippingFlatFee === 0
        ? "Free shipping"
        : store.freeShippingThreshold > 0
          ? `Free shipping over ${formatINR(store.freeShippingThreshold)}`
          : `${formatINR(store.shippingFlatFee)} flat shipping`;
    const trust = [
      { icon: Truck, title: shipping, href: "/policies/shipping" },
      { icon: RotateCcw, title: `${store.returnWindowDays}-day returns`, href: "/policies/returns" },
      { icon: ShieldCheck, title: "Secure UPI & card checkout", href: "/policies/terms" },
    ];
    return (
      <footer data-studio="footer" className={shell}>
        <div className={cn("border-b", rule)}>
          <ul className="container grid gap-4 py-6 sm:grid-cols-3">
            {trust.map((t) => (
              <li key={t.title}>
                <Link href={t.href} className={cn("flex items-center gap-3 text-sm", linkCls)}>
                  <t.icon className="size-5 shrink-0 text-accent-soft" aria-hidden /> {t.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="container grid gap-12 pb-10 pt-14 lg:grid-cols-[1fr_3fr]">
          <div className="space-y-4">
            <Logo brand={site.logo} />
            {f.tagline && <p className={cn("max-w-xs", muted)}>{f.tagline}</p>}
            {contact}
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-4">
            {f.showCategories &&
              categories.map((c) => (
                <div key={c.id}>
                  <Link href={`/category/${c.slug}`} className={cn("mb-3 block", heading, "hover:opacity-100")}>{c.name}</Link>
                  {linkList({ title: c.name, links: [...c.children.map((k) => ({ href: `/category/${k.slug}`, label: k.name })), { href: `/category/${c.slug}`, label: `All ${c.name.toLowerCase()}` }] })}
                </div>
              ))}
            {columns.filter((c) => c.title !== "Shop").map((col) => (
              <div key={col.title}>
                <p className={cn("mb-3", heading)}>{col.title}</p>
                {linkList(col)}
              </div>
            ))}
          </nav>
        </div>
        {bottom}
      </footer>
    );
  }

  /* ───────────── Call to action: contact band above the columns ───────────── */
  if (v === "cta") {
    return (
      <footer data-studio="footer" className={shell}>
        <div className="container pt-16 md:pt-20">
          <div className={cn("brand-panel flex flex-col items-start justify-between gap-6 rounded-lg bg-canvas/10 p-8 md:flex-row md:items-center md:p-12")}>
            <div className="space-y-2">
              <p className="font-display text-h2 text-canvas"><RichTitle text="Have a *question*?" emClassName="italic text-accent-soft" /></p>
              <p className="max-w-md text-canvas/70">{f.tagline || "We're happy to help with orders, custom pieces and gifts."}</p>
            </div>
            <Link href={site.contactForm.enabled && vis.contact ? "/contact" : store.contactEmail ? `mailto:${store.contactEmail}` : "/about"} className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-pill bg-canvas px-6 text-sm font-medium text-ink">
              Contact us <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
        <div className="container grid gap-12 pb-10 pt-14 md:grid-cols-[1.2fr_2fr]">
          <div className="space-y-4">
            <Logo brand={site.logo} />
            {contact}
          </div>
          {columnsNav()}
        </div>
        {bottom}
      </footer>
    );
  }

  /* ───────────── "bigbrand", "columns", "light", "accent": link columns ───────────── */
  return (
    <footer data-studio="footer" className={shell}>
      <div className="container grid gap-12 pb-10 pt-16 md:grid-cols-[1.2fr_2fr] md:pt-24">
        <div className="space-y-4">
          {v !== "bigbrand" && <Logo brand={site.logo} />}
          {f.tagline && <p className={cn("max-w-xs", muted)}>{f.tagline}</p>}
          {contact}
        </div>
        {columnsNav()}
      </div>

      {v === "bigbrand" && (
        <div className="container" aria-hidden>
          <p className="select-none whitespace-nowrap text-[19vw] text-canvas/[0.08] md:text-[15vw]">
            <Wordmark brand={site.logo} className="leading-[0.8]" accentClassName="" />
          </p>
        </div>
      )}

      {bottom}
    </footer>
  );
}
