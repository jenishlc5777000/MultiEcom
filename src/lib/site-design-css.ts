import { FONTS, type Theme } from "@/config/themes";
import type { SiteConfig } from "./site-config";

/**
 * Turns Admin → Studio choices into CSS rules and <html> data attributes.
 * Inputs are schema-validated (hex colours, enums, bounded integers), so the
 * generated CSS can't be used to inject anything.
 */

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

const MARQUEE_SECONDS = { slow: 70, normal: 40, fast: 20 } as const;

export function siteDesignCss(site: SiteConfig, theme: Theme): string {
  const { colors, gradient, animation } = site.design;
  const c = site.cards;
  const rules: string[] = [];
  const root: string[] = [];

  // Colour overrides on top of the theme.
  if (colors.enabled) {
    for (const [key, token] of [["canvas", "canvas"], ["surface", "surface"], ["ink", "ink"], ["muted", "muted"], ["accent", "accent"]] as const) {
      const v = colors[key];
      if (v) root.push(`--${token}:${rgb(v)}`);
    }
    if (colors.canvas) root.push(`--paper:${theme.dark ? rgb(colors.canvas) : "255 255 255"}`);
  }

  // Typography and corner overrides.
  const ty = site.design.typography;
  if (ty.display !== "theme") root.push(`--font-display:${FONTS[ty.display].css}`);
  if (ty.body !== "theme") root.push(`--font-sans:${FONTS[ty.body].css}`);
  if (ty.weight >= 100) root.push(`--display-weight:${ty.weight}`);
  if (ty.capitals !== "theme") root.push(`--display-case:${ty.capitals === "on" ? "uppercase" : "none"}`);
  if (ty.scale > 0) root.push(`--display-scale:${((theme.type.scale * ty.scale) / 100).toFixed(3)}`);
  const sh = site.design.shape;
  if (sh.small >= 0) root.push(`--r-sm:${sh.small}px`);
  if (sh.medium >= 0) root.push(`--r-md:${sh.medium}px`);
  if (sh.large >= 0) root.push(`--r-lg:${sh.large}px`);
  if (sh.buttons !== "theme") root.push(`--r-pill:${sh.buttons === "pill" ? "9999px" : sh.buttons === "rounded" ? "10px" : "0px"}`);

  // Product grid and card sizing.
  const mdCols = Math.min(3, c.columns);
  root.push(`--grid-cols:${c.columns}`, `--grid-cols-md:${mdCols}`, `--grid-cols-sm:${c.columnsMobile}`, `--grid-gap:${c.gap}px`);
  root.push(`--marquee-duration:${MARQUEE_SECONDS[animation.marqueeSpeed]}s`);
  // Product page photo shape (Studio → Pages & lists → Product page).
  const pp = site.pages.product;
  root.push(`--pdp-ratio:${pp.photoRatio.replace(":", "/")}`, `--pdp-fit:${pp.photoFit}`);

  if (gradient.enabled) {
    root.push(`--brand-gradient:linear-gradient(${gradient.angle}deg, ${gradient.from}, ${gradient.to})`);
    root.push(`--brand-gradient-soft:linear-gradient(${gradient.angle}deg, ${gradient.from}26, ${gradient.to}26)`);
  }

  // Same specificity as the theme block, and emitted after it, so overrides win.
  rules.push(`html[data-theme]{${root.join(";")}}`);
  if (ty.bodySize > 0) rules.push(`body{font-size:${ty.bodySize}px}`);

  if (c.aspect !== "theme") rules.push(`.product-card-media{aspect-ratio:${c.aspect.replace("/", " / ")} !important}`);
  if (c.radius >= 0) rules.push(`.product-card-media{border-radius:${c.radius}px !important}`, `[data-cards="framed"] .product-card{border-radius:${c.radius + 6}px !important}`);
  rules.push(`.product-card-title{font-size:${c.titleSize}px}`, `.product-card-price{font-size:${c.priceSize}px}`);
  if (c.textAlign === "center") rules.push(`.product-card-body{text-align:center}`, `.product-card-body > div{flex-direction:column;align-items:center;gap:.25rem}`);
  if (c.maxWidth > 0) rules.push(`.product-card-wrap{max-width:${c.maxWidth}px;margin-inline:auto}`);
  if (!c.showSwatches) rules.push(`.product-card-swatches{display:none !important}`);
  if (!c.showRating) rules.push(`.product-card-rating{display:none !important}`);
  if (!c.showBadges) rules.push(`.product-card-badges{display:none !important}`);
  else if (!c.badgesOnPhone) rules.push(`@media (max-width:639px){.product-card-badges>:not(.keep-on-phone){display:none !important}}`);
  if (!c.showArrow) rules.push(`.product-card-arrow{display:none !important}`);
  if (c.hover === "none" || !animation.hoverZoom) rules.push(`.product-card-media img{transform:none !important}`);
  if (c.hover === "swap") rules.push(`.product-card-media img{transform:none !important}`);
  if (c.hover === "lift") rules.push(`.product-card{transition:transform .5s cubic-bezier(.2,.7,.2,1)}`, `.product-card:hover{transform:translateY(-6px)}`, `.product-card-media img{transform:none !important}`);
  if (c.hover === "none" || c.hover === "lift") rules.push(`.product-card-media img + img{display:none}`, `.product-card-media img{opacity:1 !important}`);

  if (gradient.enabled) {
    if (gradient.buttons) rules.push(`.btn-primary{background-image:var(--brand-gradient);color:#fff;border-color:transparent}`, `.btn-primary:hover{filter:brightness(1.08)}`);
    if (gradient.hero) rules.push(`.hero-root{background-image:var(--brand-gradient-soft)}`);
    if (gradient.headings) rules.push(`h1 em,h2 em{background-image:var(--brand-gradient);-webkit-background-clip:text;background-clip:text;color:transparent !important;padding-right:.08em}`);
    if (gradient.announcement) rules.push(`.announcement-bar{background-image:var(--brand-gradient);color:#fff}`);
    if (gradient.panels) rules.push(`.brand-panel{background-image:var(--brand-gradient);color:#fff}`, `.brand-panel :is(h1,h2,p,span){color:#fff}`);
    if (gradient.footer) rules.push(`.site-footer{background-image:var(--brand-gradient);color:#fff}`);
  }

  return rules.join("\n");
}

/** Data attributes on <html> that switch CSS behaviour (see globals.css). */
export function siteHtmlAttrs(site: SiteConfig) {
  return {
    "data-motion": site.design.animation.level,
    // Studio → Shopping: hide every heart button / favourites link when off.
    "data-favs": site.shopping.favourites.enabled ? "on" : "off",
    "data-fav-cards": site.shopping.favourites.showOnCards ? "on" : "off",
    "data-reveal-style": site.design.animation.reveal,
  } as const;
}
