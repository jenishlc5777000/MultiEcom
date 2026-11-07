import { makeSection, sectionSchema, type Section, type SectionType } from "@/lib/builder";
import type { SiteConfig } from "@/lib/site-config";

/**
 * Starter sites for the "Templates" themes: hero text, section titles and a
 * ready-made home page (Studio → Sections). Applying a template keeps your
 * products, categories and settings; only the theme, home-page sections and
 * these texts change, and all of it stays editable afterwards.
 */

type Content = SiteConfig["content"];
export type TemplateStarter = {
  summary: string;
  content: { hero: Partial<Content["hero"]>; sections?: Partial<Content["sections"]>; story?: Partial<Content["story"]>; closing?: Partial<Content["closing"]> };
  sections: () => Section[];
  /** Optional header / logo / product-page look that comes with the template. */
  look?: {
    header?: Partial<SiteConfig["header"]>;
    logo?: Partial<SiteConfig["logo"]>;
    product?: Partial<SiteConfig["pages"]["product"]>;
    /** Category pages, the all-categories page and the product-list layout. */
    category?: Partial<SiteConfig["pages"]["category"]>;
    categoriesIndex?: Partial<SiteConfig["pages"]["categoriesIndex"]>;
    listing?: SiteConfig["pages"]["listing"];
    search?: Partial<SiteConfig["search"]>;
  };
};

const demo = (file: string, alt: string) => ({ url: `/demo/${file}`, publicId: `demo/${file}`, alt });
/** A section of `type` with overrides, validated. */
const sec = (type: SectionType, over: Record<string, unknown> = {}): Section => {
  const base = makeSection(type) as Record<string, unknown>;
  return sectionSchema.parse({ ...base, ...over, style: { ...(base.style as object), ...((over.style as object) ?? {}) } });
};
const inDays = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 16);

const faq = (items: [string, string][]) => items.map(([q, a]) => ({ q, a }));
const commonFaq = faq([
  ["Is every piece really handmade?", "Yes. Each piece is thrown or built by hand, so small differences in glaze and shape are part of it."],
  ["How long does delivery take?", "Ready-to-ship pieces leave the studio within 2 working days and arrive in 3–6 days across India."],
  ["Are your ceramics food and dishwasher safe?", "Our glazes are lead-free and food safe. Hand-washing keeps them bright for longer."],
  ["Can I return a piece?", "You can request a return within 7 days of delivery from your orders page."],
]);

export const TEMPLATES: Record<string, TemplateStarter> = {
  nightdrop: {
    summary: "Hero with framed photos, trust bar, numbered product grid, a bundle band, countdown, gallery, FAQ and a closing call to action.",
    content: {
      hero: {
        eyebrow: "Limited drop — winter kiln",
        title: "Fired at night. / *Made to stand out.*",
        subtitle: "A small batch of dark-glazed mugs, bowls and vases. When this kiln load is gone, it's gone.",
        ctaLabel: "Shop the drop", ctaHref: "/category/ceramics", secondaryLabel: "See the set", secondaryHref: "#the-set", useBanner: false,
      },
      closing: { title: "Your table called. / *It wants something dark.*", body: "Limited pieces from one kiln load. Once they're gone, they're gone.", ctaLabel: "Find your piece" },
    },
    sections: () => [
      sec("hero", { style: { padding: "none" } }),
      sec("trustBar", { items: [{ icon: "flame", label: "One kiln load only" }, { icon: "shield", label: "Packed to arrive whole" }, { icon: "truck", label: "Ships in 2 days" }, { icon: "award", label: "Secure checkout" }] }),
      sec("products", { eyebrow: "Limited edition. Dark glazes.", title: "Pick your *piece.*", source: "newest", count: 4, layout: "grid", linkLabel: "Shop all ceramics" }),
      sec("imageText", {
        eyebrow: "Three pieces, one price", title: "The Night Set. / *More table, less spend.*",
        body: "A mug, a bowl and a bud vase in the same smoky glaze. Bought together, they cost less than on their own.",
        ctaLabel: "Get the set", ctaHref: "/category/ceramics", image: demo("hero.svg", "Dark speckled mug"), imageShape: "square",
        style: { background: "custom", color: "#2A1B3A", anchor: "the-set", padding: "lg" },
      }),
      sec("countdown", { eyebrow: "The drop closes", title: "Gone *when it's gone.*", body: "After this date the kiln is reloaded with something new.", endsAt: inDays(10), ctaLabel: "Shop before it ends" }),
      sec("gallery", { title: "Spotted on *real tables.*", columns: 4, shape: "portrait", images: [demo("mug-oat.svg", "Mug"), demo("bowl-monsoon.svg", "Bowl"), demo("vase-oat.svg", "Vase"), demo("cat-mugs.svg", "Mug")] }),
      sec("faq", { title: "Questions, *answered.*", items: commonFaq }),
      sec("closing"),
    ],
  },

  workbench: {
    summary: "Framed-photo hero with stats, numbered product grid, a full-width blue story band, numbers, FAQ and a say-hello section.",
    content: {
      hero: {
        eyebrow: "Small-batch handmade ceramics",
        title: "Made by hand. / *Used every day.*",
        subtitle: "Mugs, bowls and vases thrown slowly at one wheel, glazed in small batches of twelve.",
        ctaLabel: "Shop the collection", ctaHref: "/category", secondaryLabel: "Our story", secondaryHref: "#story", useBanner: false,
      },
    },
    sections: () => [
      sec("hero", { style: { padding: "none" } }),
      sec("products", { eyebrow: "Fresh from the workbench", title: "This season's pieces", source: "newest", count: 4, layout: "grid", linkLabel: "View all" }),
      sec("imageText", {
        eyebrow: "Crafted slowly, on purpose", title: "Every curve, glaze and handle — by hand.",
        body: "It started with one wheel and a stubborn idea: things you use every day should carry the mark of the hands that made them.",
        ctaLabel: "", image: demo("cat-ceramics.svg", "Ceramics on a table"), imageShape: "square",
        style: { background: "accent", anchor: "story", padding: "lg" },
      }),
      sec("stats", { title: "", items: [{ value: "12", label: "pieces per batch" }, { value: "06", label: "hours per vase" }, { value: "03", label: "natural glazes" }], style: { background: "accent", padding: "sm" } }),
      sec("faq", { title: "Questions, *answered.*", items: commonFaq }),
      sec("cta", { title: "Say hello. / *We make it by hand.*", body: "Custom pieces, wholesale and gifts: write to us and we'll reply within two working days.", ctaLabel: "Get in touch", ctaHref: "/contact", secondaryLabel: "", style: { padding: "lg" } }),
    ],
  },

  marketplace: {
    summary: "Search-first hero, photo tiles for every subcategory, a listings grid with price on the photo, reasons to shop and a call to action.",
    content: {
      hero: {
        eyebrow: "Handmade, from one studio",
        title: "Your next favourite / *piece is waiting*",
        subtitle: "Browse ceramics and craft supplies with honest prices. Search by name, glaze or category.",
        ctaLabel: "Browse everything", ctaHref: "/category", secondaryLabel: "", useBanner: false,
      },
      sections: { categoriesEyebrow: "Collections", categoriesTitle: "Browse by *type*" },
    },
    sections: () => [
      sec("hero", { style: { padding: "none" } }),
      sec("categories", { style: { padding: "md" } }),
      sec("products", { eyebrow: "On the shelf", title: "Just *listed*", source: "newest", count: 9, layout: "grid", linkLabel: "See all" }),
      sec("features", {
        eyebrow: "Why shop here", title: "Buying handmade, made *simple*", columns: 3,
        items: [
          { icon: "shield", title: "Honest listings", body: "Real photos and real dimensions for every piece." },
          { icon: "truck", title: "Fast, careful delivery", body: "Packed in recycled, protective packaging." },
          { icon: "smile", title: "Easy returns", body: "Not right? Return it within 7 days." },
        ],
        style: { background: "surface" },
      }),
      sec("cta", { title: "Can't find it? / *Ask for a custom piece.*", body: "Tell us the size and glaze you want and we'll quote within 48 hours.", ctaLabel: "Request a piece", ctaHref: "/contact", style: { align: "center" } }),
    ],
  },

  bloom: {
    summary: "Soft framed hero, numbered gift picks, quotes, a gift-wrapping story, FAQ and a closing call to action.",
    content: {
      hero: {
        eyebrow: "Handmade gifts",
        title: "Gifts that / *feel handmade.*",
        subtitle: "Little vases, mugs and kits, wrapped by hand with a note in your words.",
        ctaLabel: "Shop gifts", ctaHref: "/category", secondaryLabel: "How gifting works", secondaryHref: "#gifting", useBanner: false,
      },
      closing: { title: "Send something / *they'll keep.*", body: "Free gift note with every order.", ctaLabel: "Find a gift" },
    },
    sections: () => [
      sec("hero", { style: { padding: "none" } }),
      sec("products", { eyebrow: "Our favourites", title: "Gift *picks*", source: "rating", count: 4, layout: "grid", linkLabel: "All gifts" }),
      sec("testimonials", { eyebrow: "From our customers", title: "Kind *words*" }),
      sec("imageText", {
        eyebrow: "Wrapped with care", title: "Every order, / *gift-ready.*",
        body: "Tissue, twine and a handwritten note: tell us what to write at checkout and we'll do the rest.",
        ctaLabel: "Shop gifts", ctaHref: "/category", image: demo("vase-oat.svg", "Bud vase"), imageShape: "arch", imageSide: "right",
        style: { background: "surface", anchor: "gifting", padding: "lg" },
      }),
      sec("faq", { title: "Gifting *questions*", items: commonFaq }),
      sec("closing"),
    ],
  },

  bakehouse: {
    summary: "Photo-collage hero, trust bar, category cards, fresh pieces, a story with numbers and a call to action.",
    content: {
      hero: {
        eyebrow: "Small-batch, kiln-fresh",
        title: "Fresh out of / *the kiln.*",
        subtitle: "Every week a new batch: breakfast bowls, chai mugs and plates for slow mornings.",
        ctaLabel: "Shop this week's batch", ctaHref: "/category", secondaryLabel: "Our story", secondaryHref: "#story", useBanner: false,
      },
    },
    sections: () => [
      sec("hero", { style: { padding: "none" } }),
      sec("trustBar"),
      sec("categories"),
      sec("products", { eyebrow: "This week's batch", title: "Warm from *the kiln*", source: "newest", count: 8, layout: "grid", linkLabel: "See everything" }),
      sec("imageText", {
        eyebrow: "Our story", title: "Made for *slow mornings.*",
        body: "We make the things we reach for every morning: the bowl for porridge, the mug for chai, the plate for toast.",
        ctaLabel: "Read more", ctaHref: "/about", image: demo("cat-bowls.svg", "Breakfast bowl"),
        style: { anchor: "story", padding: "lg" },
      }),
      sec("stats", { items: [{ value: "52", label: "batches a year" }, { value: "4.9★", label: "average rating" }, { value: "2 days", label: "to dispatch" }], style: { background: "surface", padding: "md" } }),
      sec("cta", { title: "Hungry for *more?*", body: "New batches every Friday. Follow along so you don't miss one.", ctaLabel: "Shop now", ctaHref: "/category", style: { align: "center", padding: "lg" } }),
    ],
  },

  oregold: {
    summary: "Framed hero, large numbered collection tiles, a full-width banner, quotes, FAQ and a closing call to action.",
    content: {
      hero: {
        eyebrow: "The collection",
        title: "Quietly / *precious.*",
        subtitle: "Gold-lustre ceramics, finished by hand and fired three times. Made to be kept.",
        ctaLabel: "View the collection", ctaHref: "/category", secondaryLabel: "", useBanner: false,
      },
      closing: { title: "Made to be / *kept.*", body: "Each piece arrives in a keepsake box with its firing record.", ctaLabel: "Explore" },
    },
    sections: () => [
      sec("hero", { style: { padding: "none" } }),
      sec("products", { eyebrow: "Signature pieces", title: "The *collection*", source: "rating", count: 4, layout: "large", linkLabel: "View all" }),
      sec("banner", { title: "Fired three times. / *Finished by hand.*", subtitle: "Gold lustre is applied after the glaze firing, then fired again to fuse it.", ctaLabel: "Discover", ctaHref: "/about", image: demo("hero.svg", "Speckled mug on dark table"), height: "lg", overlay: 55 }),
      sec("testimonials", { eyebrow: "Collectors", title: "In their *words*" }),
      sec("faq", { title: "Care & *questions*", items: commonFaq }),
      sec("closing"),
    ],
  },
};

TEMPLATES.nibbea = {
  summary: "Nibbea: Category menu button, centred NIBBEA monogram, clean product grid, and the showcase product page (labelled photos, glaze tiles, size buttons, quantity).",
  look: {
    header: { variant: "nibbea", menuTrigger: "click", menuSubcategories: "collapsed" },
    logo: { type: "text", style: "monogram", mark: "N", textBefore: "NIBBEA", textAccent: "", textAfter: "" },
    product: { layout: "showcase" },
  },
  content: {
    hero: {
      eyebrow: "Handmade ceramics",
      title: "Made by hand. / *Made to keep.*",
      subtitle: "Mugs, planters and plates thrown in small batches and glazed in our studio.",
      ctaLabel: "Shop now", ctaHref: "/category", secondaryLabel: "", useBanner: false, showStats: false,
    },
    closing: { title: "Find your *favourite.*", body: "New glazes every month.", ctaLabel: "Shop all" },
  },
  sections: () => [
    sec("hero", { style: { padding: "none" } }),
    sec("categories"),
    sec("products", { eyebrow: "New in", title: "Fresh from *the kiln*", source: "newest", count: 8, layout: "grid", linkLabel: "Shop all" }),
    sec("trustBar"),
    sec("testimonials", { eyebrow: "Reviews", title: "Loved by *customers*" }),
    sec("closing"),
  ],
};

TEMPLATES.satisfied = {
  summary:
    "The client's approved look: store-search header with the All categories menu (opens on click, subcategories collapsed, no category links bar), split hero without the numbers, category cards, story, process, new arrivals, shipping strip and a closing call to action. Category pages use photo tiles; the all-categories page is a directory.",
  look: {
    header: { variant: "search", menuTrigger: "click", menuSubcategories: "collapsed", showCategoryBar: false, showSearch: true, showAccount: true, sticky: true, hideOnScroll: true },
    logo: { type: "text", style: "wordmark", textBefore: "Clay", textAccent: "&", textAfter: "Glaze", mark: "" },
    category: { layout: "tiles", showFilters: false, showSort: true, showChips: true, showHero: true, showBreadcrumb: true },
    categoriesIndex: { layout: "tree", showSubcategories: true, showCounts: false },
    listing: "grid",
    search: { mode: "page" },
  },
  content: {
    hero: {
      eyebrow: "Handmade ceramics & craft kits",
      title: "Made slowly, / for the *everyday* / table.",
      subtitle: "Mugs, bowls, planters and kits for your own hands, thrown, glazed and fired piece by piece.",
      ctaLabel: "Shop the collection", ctaHref: "/category", secondaryLabel: "Our story", secondaryHref: "/about",
      showStats: false,
    },
  },
  sections: () => [
    sec("hero", { style: { padding: "none" } }),
    sec("categories", { style: { padding: "md" } }),
    sec("story"),
    sec("process"),
    sec("newArrivals"),
    sec("promise"),
    sec("closing"),
  ],
};

/** Merge a template's texts into the current content (other text is kept). */
export function templateContent(current: Content, t: TemplateStarter): Content {
  return {
    ...current,
    hero: { ...current.hero, ...t.content.hero },
    sections: { ...current.sections, ...(t.content.sections ?? {}) },
    story: { ...current.story, ...(t.content.story ?? {}) },
    closing: { ...current.closing, ...(t.content.closing ?? {}) },
  };
}
