import { z } from "zod";
import { FONT_KEYS } from "@/config/themes";
import { builderSchema } from "./builder";
import { labelsSchema } from "./labels";

/**
 * Everything the owner can customise in Admin → Studio, with defaults.
 * One schema is the single source of truth: the dashboard form, the server
 * validation and the storefront all read these types. Stored on the Setting
 * document (key "store") under `site`; anything missing falls back to the
 * defaults below, so old documents keep working.
 *
 * Colour values are validated hex codes and every other style value is an
 * enum or a bounded number, so they are safe to write into generated CSS.
 * Free text (content) is only ever rendered as React text, never into CSS/HTML.
 */

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #A24A25");
const optionalHex = z.union([hex, z.literal("")]).default("");
const text = (max: number, def: string) => z.string().trim().max(max).default(def);
const link = (def: string) =>
  z
    .string()
    .trim()
    .max(300)
    // Internal paths, anchors or http(s) links only: no javascript: URLs.
    .refine((v) => v === "" || v.startsWith("/") || v.startsWith("#") || /^https?:\/\//.test(v), "Use a path like /category or a full https:// link")
    .default(def);
const int = (min: number, max: number, def: number) => z.coerce.number().int().min(min).max(max).default(def);
const image = z.object({ url: z.string().max(500), publicId: z.string().max(300), alt: z.string().max(200).default("") }).nullable().default(null);

export const HOME_MODES = ["theme", "landing", "shop", "lookbook", "spotlight", "bento", "marketplace", "magazine", "showcase", "gallery"] as const;
export const HERO_LAYOUTS = ["theme", "split", "centered", "fullbleed", "editorial", "minimal", "collage", "framed", "search"] as const;
export const CATEGORY_LAYOUTS = ["theme", "mosaic", "cards", "list", "circles", "pills", "tiles"] as const;
export const CARD_STYLES = ["theme", "classic", "framed", "square", "minimal", "overlay", "numbered", "listing"] as const;
export const CARD_ASPECTS = ["theme", "4/5", "3/4", "1/1", "2/3", "4/3", "16/9"] as const;
export const EFFECTS = ["theme", "none", "brutal", "glass", "soft", "clay", "neon", "offset"] as const;
export const BACKDROPS = ["theme", "plain", "mesh", "grid", "dots", "grain"] as const;
export const LISTINGS = ["theme", "grid", "list", "compact", "masonry", "large"] as const;
export const CATEGORY_PAGE_LAYOUTS = ["top", "sidebar", "tabs", "tiles"] as const;
export const CATEGORY_INDEX_LAYOUTS = ["theme", "mosaic", "cards", "list", "circles", "pills", "tiles", "tree"] as const;
export const SEARCH_MODES = ["page", "overlay", "dropdown"] as const;
export const SORTS = ["relevance", "new", "price-asc", "price-desc", "rating"] as const;
export const HEADER_VARIANTS = ["classic", "centered", "minimal", "bold", "floating", "stacked", "search", "topbar", "accent", "compact", "boxed", "nibbea"] as const;
export const FOOTER_VARIANTS = ["bigbrand", "columns", "centered", "minimal", "light", "split", "mega", "cards", "accent", "cta", "stacked"] as const;

const designSchema = z.object({
  /** "theme" = use the active theme's choice. */
  homeMode: z.enum(HOME_MODES).default("theme"),
  hero: z.enum(HERO_LAYOUTS).default("theme"),
  categories: z.enum(CATEGORY_LAYOUTS).default("theme"),
  sectionOrder: z.enum(["theme", "story-first", "shop-first"]).default("theme"),
  /** Surface treatment and page background ("theme" = the theme's own). */
  effect: z.enum(EFFECTS).default("theme"),
  /** N°01-style numbered section labels. */
  chrome: z.enum(["theme", "none", "numbered"]).default("theme"),
  background: z.enum(BACKDROPS).default("theme"),
  /** Fonts and heading style on top of the theme ("theme" / -1 = keep the theme's). */
  typography: z
    .object({
      display: z.enum(["theme", ...FONT_KEYS]).default("theme"),
      body: z.enum(["theme", ...FONT_KEYS]).default("theme"),
      weight: int(-1, 900, -1),
      capitals: z.enum(["theme", "on", "off"]).default("theme"),
      /** Heading size in percent of the theme's (0 = theme). */
      scale: int(0, 160, 0),
      /** Body text size in px (0 = default 16px). */
      bodySize: int(0, 20, 0),
      /** How *highlighted* words look in headings. */
      emphasis: z.enum(["theme", "italic", "accent", "marker"]).default("theme"),
    })
    .default({}),
  /** Corner shapes on top of the theme (-1 = keep the theme's). */
  shape: z
    .object({
      small: int(-1, 40, -1),
      medium: int(-1, 48, -1),
      large: int(-1, 64, -1),
      buttons: z.enum(["theme", "pill", "rounded", "square"]).default("theme"),
    })
    .default({}),
  /** Landing-page sections that can be switched off. */
  sections: z
    .object({
      marquee: z.boolean().default(true),
      categories: z.boolean().default(true),
      readyToShip: z.boolean().default(true),
      story: z.boolean().default(true),
      process: z.boolean().default(true),
      newArrivals: z.boolean().default(true),
      promise: z.boolean().default(true),
      closingCta: z.boolean().default(true),
    })
    .default({}),
  colors: z
    .object({
      enabled: z.boolean().default(false),
      canvas: optionalHex,
      surface: optionalHex,
      ink: optionalHex,
      muted: optionalHex,
      accent: optionalHex,
    })
    .default({}),
  gradient: z
    .object({
      enabled: z.boolean().default(false),
      from: hex.default("#A24A25"),
      to: hex.default("#E7A07F"),
      angle: int(0, 360, 135),
      buttons: z.boolean().default(true),
      hero: z.boolean().default(true),
      headings: z.boolean().default(false),
      announcement: z.boolean().default(true),
      panels: z.boolean().default(false),
      footer: z.boolean().default(false),
    })
    .default({}),
  animation: z
    .object({
      level: z.enum(["full", "subtle", "none"]).default("full"),
      reveal: z.enum(["fade-up", "fade", "zoom", "slide"]).default("fade-up"),
      marqueeSpeed: z.enum(["slow", "normal", "fast"]).default("normal"),
      hoverZoom: z.boolean().default(true),
    })
    .default({}),
});

const cardsSchema = z.object({
  style: z.enum(CARD_STYLES).default("theme"),
  aspect: z.enum(CARD_ASPECTS).default("theme"),
  /** -1 = theme's corners. */
  radius: int(-1, 48, -1),
  titleSize: int(12, 24, 15),
  priceSize: int(12, 24, 15),
  textAlign: z.enum(["left", "center"]).default("left"),
  columns: int(2, 6, 4),
  columnsMobile: int(1, 2, 2),
  gap: int(8, 48, 24),
  /** 0 = fill the column. */
  maxWidth: int(0, 480, 0),
  showSwatches: z.boolean().default(true),
  showRating: z.boolean().default(true),
  showBadges: z.boolean().default(true),
  /** Phones: hide the "Ready to ship" badges so they don't cover the small product photos. */
  badgesOnPhone: z.boolean().default(false),
  showArrow: z.boolean().default(true),
  hover: z.enum(["zoom", "lift", "swap", "none"]).default("zoom"),
});

const headerSchema = z.object({
  variant: z.enum(HEADER_VARIANTS).default("classic"),
  sticky: z.boolean().default(true),
  hideOnScroll: z.boolean().default(true),
  showSearch: z.boolean().default(true),
  showAccount: z.boolean().default(true),
  announcement: z.enum(["bar", "marquee", "hidden"]).default("bar"),
  /** "All categories" / Shop menu: open on click only, or also on hover. */
  menuTrigger: z.enum(["click", "hover"]).default("click"),
  /** Subcategories in the menu: collapsed until the customer expands a category, always shown, or never (top level only). */
  menuSubcategories: z.enum(["collapsed", "expanded", "hidden"]).default("collapsed"),
  /** Category menu design: mega panel with pictures, compact dropdown, columns, or a side drawer. */
  menuStyle: z.enum(["mega", "dropdown", "columns", "drawer"]).default("mega"),
  /** Category pictures in the mega menu / drawer. */
  menuImages: z.boolean().default(true),
  menuLabel: text(30, "All categories"),
  /** "All categories →" link at the bottom of the menu. */
  menuAllLink: z.boolean().default(true),
  /** The row of category links under the "Store search" header. */
  showCategoryBar: z.boolean().default(false),
});

const logoSchema = z.object({
  type: z.enum(["text", "image"]).default("text"),
  /** Text logo look: wordmark ("Nibbea") or monogram (initials in a square above a spaced wordmark). */
  style: z.enum(["wordmark", "monogram"]).default("wordmark"),
  /** Monogram letters (1–3), e.g. "N". */
  mark: z.string().trim().max(3).default(""),
  /** Text logo: the accent part is shown in italic accent colour. */
  textBefore: text(30, "Nibbea"),
  textAccent: text(10, ""),
  textAfter: text(30, ""),
  image,
  height: int(20, 96, 36),
  /** Browser tab icon (favicon) and phone app icon: initials tile, the logo picture, or a separate picture. */
  faviconSource: z.enum(["generated", "logo", "upload"]).default("generated"),
  favicon: image,
  /** Square behind the icon: theme colour, white, or none. */
  faviconBg: z.enum(["theme", "white", "transparent"]).default("theme"),
  /** Space around the picture on the app icon (% of the size). */
  faviconPadding: int(0, 30, 12),
});

const footerSchema = z.object({
  variant: z.enum(FOOTER_VARIANTS).default("bigbrand"),
  tagline: text(200, "Handmade ceramics and craft kits."),
  copyright: text(120, "All prices in INR."),
  showCategories: z.boolean().default(true),
  showPolicies: z.boolean().default(true),
  showContact: z.boolean().default(true),
});

const pagesSchema = z.object({
  /** Product list layout used everywhere unless a page overrides it. */
  listing: z.enum(LISTINGS).default("theme"),
  category: z
    .object({
      /** Where subcategories and filters sit: chips on top, a sidebar, tabs, or photo tiles. */
      layout: z.enum(CATEGORY_PAGE_LAYOUTS).default("top"),
      listing: z.enum(LISTINGS).default("theme"),
      showFilters: z.boolean().default(true),
      showSort: z.boolean().default(true),
      showHero: z.boolean().default(true),
      showChips: z.boolean().default(true),
      showBreadcrumb: z.boolean().default(true),
      heroAlign: z.enum(["left", "center"]).default("left"),
      /**
       * "Choose a pattern first" categories (e.g. Mugs → Tapered / Round / Classic):
       * how the patterns are shown before any products.
       */
      patternLayout: z.enum(["tiles", "cards", "pills", "list", "carousel"]).default("tiles"),
      patternColumns: int(2, 5, 4),
      patternShape: z.enum(["square", "portrait", "landscape", "circle"]).default("square"),
      patternPrompt: text(160, "Choose a style to see the pieces."),
      patternShowDescription: z.boolean().default(false),
    })
    .default({}),
  product: z
    .object({
      imageSide: z.enum(["left", "right"]).default("left"),
      /** Product page design: classic, or showcase (labelled thumbnails, photo glaze swatches, quantity, Add to Cart + Buy Now). */
      layout: z.enum(["classic", "showcase"]).default("classic"),
      showBreadcrumb: z.boolean().default(true),
      showReviews: z.boolean().default(true),
      handmadeNote: text(240, "Each piece is handmade, so small variations in glaze and form are part of its character."),
      /** Shape of the big product photo (same on phone and laptop), and whether it fills the frame or shows the whole photo. */
      photoRatio: z.enum(["4:5", "1:1", "3:4", "2:3", "4:3"]).default("4:5"),
      photoFit: z.enum(["cover", "contain"]).default("cover"),
    })
    .default({}),
  shopAll: z
    .object({
      showSubcategories: z.boolean().default(true),
      listing: z.enum(LISTINGS).default("theme"),
    })
    .default({}),
  /** The "All categories" page (/category). */
  categoriesIndex: z
    .object({
      layout: z.enum(CATEGORY_INDEX_LAYOUTS).default("theme"),
      showSubcategories: z.boolean().default(true),
      showCounts: z.boolean().default(true),
    })
    .default({}),
});

const contentSchema = z.object({
  hero: z
    .object({
      eyebrow: text(80, "Handmade ceramics & craft kits"),
      /** Lines separated by "/"; wrap a word in *asterisks* to emphasise it. */
      title: text(160, "Made slowly, / for the *everyday* / table."),
      subtitle: text(300, "Mugs, bowls, planters and kits for your own hands, thrown, glazed and fired piece by piece."),
      ctaLabel: text(40, "Shop the collection"),
      ctaHref: link("/category"),
      secondaryLabel: text(40, "Our story"),
      secondaryHref: link("/about"),
      /**
       * Let an active homepage banner (old seeded data, no editor in the dashboard) replace the
       * title, text, button and picture. Off by default so what is typed in Studio always shows.
       * (Renamed from `useBanner`, whose old default "on" hid Studio edits.)
       */
      useBannerText: z.boolean().default(false),
      /** The numbers under the hero (ready to ship, glazes, categories). */
      showStats: z.boolean().default(false),
      /** Hero pictures uploaded in Studio → Content → Hero. First = main picture; the rest feed collage / framed layouts. Empty = newest product photo. */
      images: z.array(z.object({ url: z.string().max(500), publicId: z.string().max(300), alt: z.string().max(200).default("") })).max(6).default([]),
      /**
       * Where the hero picture comes from:
       *  auto = uploaded pictures, else the newest product photo;
       *  upload = only the pictures uploaded here;
       *  products = product photos (newest, ready to ship, or the products chosen below).
       */
      imageSource: z.enum(["auto", "upload", "products"]).default("auto"),
      productSource: z.enum(["newest", "ready", "chosen"]).default("newest"),
      productIds: z.array(z.string().regex(/^[a-f0-9]{24}$/)).max(12).default([]),
      productCount: int(2, 12, 5),
      /** Change the picture by itself every few seconds (when there is more than one). */
      rotate: z.boolean().default(false),
      rotateSeconds: int(3, 20, 6),
      /** cover = fill the frame (may crop); contain = show the whole picture. */
      imageFit: z.enum(["cover", "contain"]).default("cover"),
      /** The small product card on the picture: newest in-stock piece, a chosen product, or hidden. */
      featured: z.enum(["auto", "product", "hide"]).default("auto"),
      featuredProductId: z.union([z.string().regex(/^[a-f0-9]{24}$/), z.literal("")]).default(""),
      featuredLabel: text(30, "Featured"),
    })
    .default({}),
  sections: z
    .object({
      categoriesEyebrow: text(60, "Shop by category"),
      categoriesTitle: text(80, "Find your *piece*"),
      readyEyebrow: text(60, "Ready to ship"),
      readyTitle: text(80, "In the studio, ready to go"),
      newEyebrow: text(60, "New from the studio"),
      newTitle: text(80, "Just out of the *kiln*"),
    })
    .default({}),
  story: z
    .object({
      eyebrow: text(60, "Our story"),
      title: text(120, "From our wheel / to your *table*"),
      body: text(1200, "Because every piece is made by hand, no two are exactly alike: glazes pool, drip and break differently in every firing."),
      ctaLabel: text(40, "Read our story"),
    })
    .default({}),
  process: z
    .object({
      eyebrow: text(60, "The process"),
      title: text(80, "How a piece is *made*"),
      steps: z
        .array(z.object({ title: text(40, ""), body: text(240, "") }))
        .max(6)
        .default([
          { title: "Shape", body: "Each form starts as a lump of clay, thrown on the wheel or built by hand." },
          { title: "Trim & dry", body: "Pieces are trimmed, refined and left to dry slowly so they don't crack." },
          { title: "Glaze", body: "Glazes are brushed, dipped or poured, and every piece takes them a little differently." },
          { title: "Fire", body: "A long kiln firing turns clay to stoneware and melts the glaze to glass." },
        ]),
    })
    .default({}),
  closing: z
    .object({
      title: text(120, "Bring something *handmade* home."),
      body: text(240, "Many pieces are one of a kind. When they're gone, they're gone."),
      ctaLabel: text(40, "Shop the collection"),
      ctaHref: link("/category"),
    })
    .default({}),
  contact: z
    .object({
      title: text(80, "Get in *touch*"),
      intro: text(400, "Questions about an order, a custom piece or a workshop? Send us a message and we'll reply within two working days."),
    })
    .default({}),
});

const searchSchema = z.object({
  /** How the header search opens: go to the search page, a full-screen overlay, or a dropdown. */
  mode: z.enum(SEARCH_MODES).default("overlay"),
  /** Show matching products while typing. */
  instant: z.boolean().default(true),
  suggestionCount: int(3, 10, 6),
  showCategoryMatches: z.boolean().default(true),
  placeholder: text(80, "Search mugs, bowls, glazes…"),
  /** Quick-search chips shown before typing. */
  popular: z
    .array(z.string().max(40))
    .max(12)
    .transform((list) => list.map((x) => x.trim()).filter(Boolean).slice(0, 10))
    .default(["Mugs", "Celadon", "Planters", "Gift", "Craft kit"]),
  /** Search results page. */
  listing: z.enum(LISTINGS).default("theme"),
  showFilters: z.boolean().default(true),
  filterCategory: z.boolean().default(true),
  filterAvailability: z.boolean().default(true),
  filterPrice: z.boolean().default(true),
  defaultSort: z.enum(SORTS).default("relevance"),
});

/** {{name}}, {{email}}, {{phone}}, {{subject}}, {{message}}, {{store}} are replaced when sending. */
const contactFormSchema = z.object({
  enabled: z.boolean().default(true),
  showPhone: z.boolean().default(true),
  /** Where new messages are emailed; empty = the store contact email. */
  notifyEmail: z.union([z.string().trim().email(), z.literal("")]).default(""),
  notifySubject: text(160, "New message from {{name}}: {{subject}}"),
  notifyBody: text(3000, "{{name}} ({{email}}, {{phone}}) wrote:\n\n{{message}}"),
  autoReply: z.boolean().default(true),
  autoReplySubject: text(160, "We got your message, {{name}}"),
  autoReplyBody: text(3000, "Hi {{name}},\n\nThanks for writing to {{store}}. We'll get back to you within two working days.\n\nYour message:\n{{message}}"),
  successMessage: text(300, "Thanks! Your message is on its way. We'll reply by email soon."),
  subjects: z
    .array(z.string().max(60))
    .max(12)
    // Blank lines are ignored; an empty list falls back to "General question".
    .transform((list) => {
      const clean = list.map((x) => x.trim()).filter(Boolean).slice(0, 10);
      return clean.length ? clean : ["General question"];
    })
    .default(["Order question", "Custom order", "Workshops", "Something else"]),
});


/* ───────────── Shopping features (Studio → Shopping) ───────────── */

const productIds = z.array(z.string().regex(/^[a-f0-9]{24}$/)).max(48).default([]);

/** Store pages where an offers / hot deals / most ordered list can also be shown. */
export const MERCH_PAGES = ["home", "categories", "category", "product", "search", "cart", "favourites", "about", "contact"] as const;
export type MerchPage = (typeof MERCH_PAGES)[number];
export const merchPageLabels: Record<MerchPage, string> = {
  home: "Home page",
  categories: "All categories page",
  category: "Category pages",
  product: "Product pages",
  search: "Search page",
  cart: "Cart",
  favourites: "Favourites page",
  about: "About page",
  contact: "Contact page",
};
/** Where the list sits on the chosen pages, and how many products it shows. */
const placement = {
  showOn: z.array(z.enum(MERCH_PAGES)).max(MERCH_PAGES.length).default([]),
  position: z.enum(["top", "bottom"]).default("bottom"),
  placeCount: int(2, 12, 4),
};

const shoppingSchema = z.object({
  favourites: z
    .object({
      enabled: z.boolean().default(true),
      /** Heart button on product cards and product pages. */
      showOnCards: z.boolean().default(true),
      /** Heart link with a count in the header. */
      showInHeader: z.boolean().default(true),
      title: text(80, "Your favourites"),
    })
    .default({}),
  recentlyViewed: z
    .object({
      enabled: z.boolean().default(true),
      onProductPage: z.boolean().default(true),
      onHome: z.boolean().default(false),
      count: int(2, 12, 8),
      title: text(80, "Recently viewed"),
    })
    .default({}),
  offers: z
    .object({
      enabled: z.boolean().default(true),
      title: text(80, "Offers"),
      subtitle: text(200, "Handpicked pieces at a special price."),
      /** Products the owner picked; with `includeDiscounted`, any product with a compare-at price joins too. */
      productIds,
      includeDiscounted: z.boolean().default(true),
      ...placement,
    })
    .default({}),
  hotDeals: z
    .object({
      enabled: z.boolean().default(true),
      title: text(80, "Hot deals"),
      subtitle: text(200, "Limited-time prices. Grab them before they're gone."),
      productIds,
      /** Optional end time (ISO) shown as a countdown on the offers page. */
      endsAt: z.string().max(40).refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Pick a valid date").default(""),
      ...placement,
    })
    .default({}),
  bestsellers: z
    .object({
      enabled: z.boolean().default(true),
      title: text(80, "Most ordered"),
      subtitle: text(200, "What everyone's buying right now."),
      /** auto = from paid orders; manual = the products picked below. */
      mode: z.enum(["auto", "manual"]).default("auto"),
      productIds,
      count: int(2, 24, 8),
      ...placement,
    })
    .default({}),
  /** The /offers page that collects offers, hot deals and most ordered. */
  offersPage: z
    .object({
      enabled: z.boolean().default(true),
      title: text(80, "Offers & deals"),
      showInNav: z.boolean().default(true),
    })
    .default({}),
});
export type ShoppingConfig = z.infer<typeof shoppingSchema>;

/* ───────────── Blog (Admin → Blog → Blog settings) ───────────── */

const blogSchema = z.object({
  enabled: z.boolean().default(true),
  title: text(60, "Journal"),
  intro: text(300, "Notes from the studio: how pieces are made, glaze stories and care tips."),
  /** Link in the footer (and optionally the header menu). */
  showInFooter: z.boolean().default(true),
  footerLabel: text(40, "Blog"),
  showInNav: z.boolean().default(false),
  perPage: int(3, 24, 9),
  layout: z.enum(["grid", "list"]).default("grid"),
  showAuthor: z.boolean().default(true),
  showDate: z.boolean().default(true),
  showReadingTime: z.boolean().default(true),
});
export type BlogConfig = z.infer<typeof blogSchema>;

/* ───────────── Visibility of pages and site parts (Studio → Visibility) ───────────── */

const visibilitySchema = z.object({
  header: z.boolean().default(true),
  footer: z.boolean().default(true),
  announcement: z.boolean().default(true),
  /** Phone bottom tab bar. */
  mobileTabBar: z.boolean().default(true),
  pages: z
    .object({
      about: z.boolean().default(true),
      contact: z.boolean().default(true),
      search: z.boolean().default(true),
      categories: z.boolean().default(true),
      policies: z.boolean().default(true),
      reviews: z.boolean().default(true),
    })
    .default({}),
});
export type VisibilityConfig = z.infer<typeof visibilitySchema>;

export const siteConfigSchema = z.object({
  design: designSchema.default({}),
  cards: cardsSchema.default({}),
  header: headerSchema.default({}),
  logo: logoSchema.default({}),
  footer: footerSchema.default({}),
  pages: pagesSchema.default({}),
  content: contentSchema.default({}),
  contactForm: contactFormSchema.default({}),
  search: searchSchema.default({}),
  /** Studio → Sections: the home-page builder. */
  builder: builderSchema.default({}),
  /** Admin → Blog → settings: /blog page, footer / menu link. */
  blog: blogSchema.default({}),
  /** Studio → Text & labels: buttons, menu items, small headings (empty = default). */
  labels: labelsSchema,
  /** Studio → Shopping: favourites, recently viewed, offers, hot deals, most ordered. */
  shopping: shoppingSchema.default({}),
  /** Studio → Visibility: turn pages, header, footer and other parts on or off. */
  visibility: visibilitySchema.default({}),
  /**
   * Layout/colour/effect (design) and card customisations saved per theme, so
   * every theme keeps its own look. `design` / `cards` above are the defaults
   * for themes that have not been customised.
   */
  perTheme: z
    .record(z.string().regex(/^[a-z0-9]{2,24}$/), z.object({ design: designSchema.optional(), cards: cardsSchema.optional() }))
    .default({}),
});

export type SiteConfig = z.infer<typeof siteConfigSchema>;
export type SiteConfigInput = z.input<typeof siteConfigSchema>;
export const defaultSiteConfig: SiteConfig = siteConfigSchema.parse({});

/** Parse whatever is stored; unknown or invalid data falls back to defaults. */
export function parseSiteConfig(raw: unknown): SiteConfig {
  const r = siteConfigSchema.safeParse(raw ?? {});
  return r.success ? r.data : defaultSiteConfig;
}

/** The settings as they apply to one theme: its own design/cards customisations win. */
export function scopeToTheme(site: SiteConfig, themeId: string | undefined): SiteConfig {
  const own = themeId ? site.perTheme[themeId] : undefined;
  return { ...site, design: own?.design ?? site.design, cards: own?.cards ?? site.cards };
}

/** Sections that are stored per theme. */
export const PER_THEME_SECTIONS = ["design", "cards"] as const;
export const isPerTheme = (k: string): k is (typeof PER_THEME_SECTIONS)[number] => (PER_THEME_SECTIONS as readonly string[]).includes(k);

/** "Made slowly, / for the *everyday* / table." → lines for the hero headline. */
export const titleLines = (t: string) => t.split(/\s*\/\s*|\n/).filter(Boolean);
