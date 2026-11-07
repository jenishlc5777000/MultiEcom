import { z } from "zod";

/**
 * Home-page builder (Studio → Sections). The page is a list of sections; each
 * has a type, its own content, and shared style options. Text is rendered as
 * plain React text (no HTML), links are limited to paths / http(s), colours
 * are hex codes, so owner content can't inject markup or scripts.
 */

const text = (max: number, def = "") => z.string().max(max).default(def);
const link = (def = "") =>
  z.string().trim().max(300).refine((v) => v === "" || v.startsWith("/") || v.startsWith("#") || /^https?:\/\//.test(v), "Use a path like /category or a full https:// link").default(def);
const hex = z.union([z.string().regex(/^#[0-9a-fA-F]{6}$/), z.literal("")]).default("");
const image = z.object({ url: z.string().max(500), publicId: z.string().max(300), alt: z.string().max(200).default("") }).nullable().default(null);
const int = (min: number, max: number, def: number) => z.coerce.number().int().min(min).max(max).default(def);

export const FEATURE_ICONS = ["sparkles", "truck", "gift", "leaf", "heart", "shield", "star", "clock", "palette", "package", "hand", "flame", "award", "smile"] as const;
export const LISTING_CHOICES = ["grid", "list", "compact", "masonry", "large"] as const;

export const sectionStyleSchema = z.object({
  background: z.enum(["none", "surface", "ink", "accent", "gradient", "custom"]).default("none"),
  color: hex,
  /** Second colour for the gradient background. */
  color2: hex,
  padding: z.enum(["none", "sm", "md", "lg", "xl"]).default("md"),
  width: z.enum(["narrow", "normal", "wide", "full"]).default("normal"),
  align: z.enum(["left", "center"]).default("left"),
  animate: z.boolean().default(true),
  hideOnMobile: z.boolean().default(false),
  hideOnDesktop: z.boolean().default(false),
  /** Optional #anchor so buttons can link to this section. */
  anchor: z.string().trim().max(40).regex(/^[a-z0-9-]*$/, "Use lowercase letters, numbers and dashes").default(""),
});

const base = { id: z.string().regex(/^[a-z0-9]{6,16}$/), enabled: z.boolean().default(true), style: sectionStyleSchema.default({}) };
const item = <T extends z.ZodRawShape>(shape: T, max: number) => z.array(z.object(shape)).max(max).default([]);

/** Built-in blocks: they reuse the existing components and Studio → Content text. */
export const BUILTIN_TYPES = ["hero", "marquee", "categories", "readyToShip", "newArrivals", "story", "process", "promise", "closing", "shopFeed"] as const;

export const sectionSchema = z.discriminatedUnion("type", [
  z.object({ ...base, type: z.enum(BUILTIN_TYPES) }),
  z.object({ ...base, type: z.literal("heading"), eyebrow: text(80), title: text(200, "A new heading"), subtitle: text(400), size: z.enum(["md", "lg", "xl"]).default("lg") }),
  z.object({ ...base, type: z.literal("text"), title: text(200), body: text(4000, "Write something about your studio here."), columns: int(1, 2, 1) }),
  z.object({
    ...base,
    type: z.literal("imageText"),
    image,
    eyebrow: text(80),
    title: text(200, "Made by hand, in small batches"),
    body: text(2000, "Tell the story behind this piece, this collection or your studio."),
    ctaLabel: text(40, "Shop now"),
    ctaHref: link("/category"),
    imageSide: z.enum(["left", "right"]).default("left"),
    imageShape: z.enum(["rounded", "square", "circle", "arch"]).default("rounded"),
  }),
  z.object({
    ...base,
    type: z.literal("banner"),
    image,
    title: text(200, "The new collection is here"),
    subtitle: text(400),
    ctaLabel: text(40, "Explore"),
    ctaHref: link("/category"),
    height: z.enum(["sm", "md", "lg"]).default("md"),
    overlay: int(0, 85, 40),
  }),
  z.object({
    ...base,
    type: z.literal("features"),
    eyebrow: text(80),
    title: text(200, "Why people love our pieces"),
    columns: int(2, 4, 3),
    items: item({ icon: z.enum(FEATURE_ICONS).default("sparkles"), title: text(80), body: text(300) }, 8),
  }),
  z.object({ ...base, type: z.literal("stats"), title: text(200), items: item({ value: text(20), label: text(60) }, 6) }),
  z.object({ ...base, type: z.literal("testimonials"), eyebrow: text(80), title: text(200, "Kind words"), items: item({ quote: text(600), name: text(60), role: text(60) }, 9) }),
  z.object({ ...base, type: z.literal("faq"), title: text(200, "Questions"), items: item({ q: text(200), a: text(1500) }, 20) }),
  z.object({
    ...base,
    type: z.literal("cta"),
    title: text(200, "Ready to find your piece?"),
    body: text(400),
    ctaLabel: text(40, "Shop the collection"),
    ctaHref: link("/category"),
    secondaryLabel: text(40),
    secondaryHref: link(""),
  }),
  z.object({
    ...base,
    type: z.literal("gallery"),
    title: text(200),
    columns: int(2, 6, 4),
    shape: z.enum(["square", "portrait", "landscape"]).default("square"),
    images: z.array(z.object({ url: z.string().max(500), publicId: z.string().max(300), alt: z.string().max(200).default("") })).max(18).default([]),
  }),
  z.object({
    ...base,
    type: z.literal("products"),
    eyebrow: text(80),
    title: text(200, "Featured pieces"),
    source: z.enum(["newest", "ready", "rating", "category", "offers", "hotDeals", "bestsellers"]).default("newest"),
    category: z.string().trim().max(80).regex(/^[a-z0-9-]*$/).default(""),
    count: int(2, 24, 8),
    layout: z.enum(LISTING_CHOICES).default("grid"),
    linkLabel: text(40, "View all"),
  }),
  z.object({
    ...base,
    type: z.literal("countdown"),
    eyebrow: text(80, "Limited time"),
    title: text(200, "The sale ends *soon*"),
    body: text(400),
    /** ISO date-time the timer counts down to. */
    endsAt: z.string().max(40).refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Pick a valid date").default(""),
    endedText: text(120, "This offer has ended."),
    ctaLabel: text(40, "Shop the sale"),
    ctaHref: link("/category"),
  }),
  z.object({ ...base, type: z.literal("recentlyViewed"), title: text(80, "Recently viewed"), count: int(2, 12, 4) }),
  z.object({ ...base, type: z.literal("trustBar"), items: item({ icon: z.enum(FEATURE_ICONS).default("shield"), label: text(80) }, 6) }),
  z.object({ ...base, type: z.literal("spacer"), size: z.enum(["sm", "md", "lg"]).default("md"), line: z.boolean().default(false) }),
]);

export type Section = z.infer<typeof sectionSchema>;
export type SectionType = Section["type"];
export type SectionStyle = z.infer<typeof sectionStyleSchema>;

export const builderSchema = z.object({
  /** When on, the home page is built from these sections (any home page type). */
  enabled: z.boolean().default(false),
  sections: z.array(sectionSchema).max(40).default([]),
});
export type Builder = z.infer<typeof builderSchema>;

/** Gallery shown in "Add section". */
export const SECTION_INFO: Record<SectionType, { label: string; hint: string; group: "Content" | "Media" | "Shop" | "Built-in" | "Layout" }> = {
  heading: { label: "Heading", hint: "A title with an optional line above and below", group: "Content" },
  text: { label: "Text", hint: "Paragraphs of text, one or two columns", group: "Content" },
  imageText: { label: "Image + text", hint: "Photo beside a title, text and button", group: "Media" },
  banner: { label: "Banner", hint: "Full-width photo with text on top", group: "Media" },
  gallery: { label: "Gallery", hint: "A grid of photos", group: "Media" },
  features: { label: "Features", hint: "Icons with short titles and text", group: "Content" },
  stats: { label: "Stats", hint: "Big numbers with labels", group: "Content" },
  testimonials: { label: "Testimonials", hint: "Customer quotes", group: "Content" },
  faq: { label: "FAQ", hint: "Questions and answers that open on click", group: "Content" },
  cta: { label: "Call to action", hint: "Title, text and buttons", group: "Content" },
  products: { label: "Product collection", hint: "Newest, ready to ship, top rated or one category", group: "Shop" },
  shopFeed: { label: "All products", hint: "Every product with sorting and pages", group: "Shop" },
  countdown: { label: "Countdown", hint: "Sale or launch timer with a button", group: "Shop" },
  recentlyViewed: { label: "Recently viewed", hint: "Pieces this visitor looked at (saved in their browser)", group: "Shop" },
  trustBar: { label: "Trust bar", hint: "A thin row of icons with short promises", group: "Content" },
  spacer: { label: "Spacer / divider", hint: "Empty space or a line", group: "Layout" },
  hero: { label: "Hero", hint: "The theme's hero (text in Content)", group: "Built-in" },
  marquee: { label: "Scrolling ticker", hint: "Glaze and category names", group: "Built-in" },
  categories: { label: "Categories", hint: "Category tiles (design in Layout)", group: "Built-in" },
  readyToShip: { label: "Ready to ship", hint: "Carousel of in-stock pieces", group: "Built-in" },
  newArrivals: { label: "New arrivals", hint: "Grid of the newest pieces", group: "Built-in" },
  story: { label: "Our story", hint: "Photo and story text (text in Content)", group: "Built-in" },
  process: { label: "The process", hint: "Numbered steps (in Content)", group: "Built-in" },
  promise: { label: "Shipping & returns", hint: "Three promises from Settings", group: "Built-in" },
  closing: { label: "Closing call to action", hint: "Dark panel (text in Content)", group: "Built-in" },
};

export const newSectionId = () => Math.random().toString(36).slice(2, 10).padEnd(8, "0");

/** A new section of `type` with sensible starter content. */
export function makeSection(type: SectionType): Section {
  const id = newSectionId();
  const starter: Partial<Record<SectionType, Record<string, unknown>>> = {
    features: {
      items: [
        { icon: "hand", title: "Handmade", body: "Every piece is thrown and glazed by hand." },
        { icon: "leaf", title: "Food safe", body: "Lead-free glazes, fired to stoneware." },
        { icon: "truck", title: "Packed with care", body: "Shipped in recycled, protective packaging." },
      ],
    },
    stats: { items: [{ value: "1,200+", label: "pieces made" }, { value: "4.9★", label: "average rating" }, { value: "7 days", label: "easy returns" }] },
    testimonials: { items: [{ quote: "The mug is even more beautiful in person.", name: "Ananya", role: "Bengaluru" }, { quote: "Packed so carefully, arrived perfect.", name: "Rahul", role: "Pune" }] },
    faq: { items: [{ q: "Are your pieces dishwasher safe?", a: "Yes, but hand-washing keeps the glaze bright for longer." }, { q: "How long does shipping take?", a: "Ready-to-ship pieces leave the studio in 2 working days." }] },
    banner: { style: { width: "full", padding: "none" } },
    countdown: { endsAt: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 16), style: { background: "surface" } },
    trustBar: {
      style: { padding: "sm" },
      items: [
        { icon: "truck", label: "Free shipping over ₹1,999" },
        { icon: "shield", label: "Secure UPI & card checkout" },
        { icon: "hand", label: "Handmade in small batches" },
        { icon: "gift", label: "Gift wrapping on request" },
      ],
    },
    hero: { style: { padding: "none" } },
    marquee: { style: { padding: "none" } },
    categories: { style: { padding: "md" } },
  };
  return sectionSchema.parse({ id, type, ...(starter[type] ?? {}) });
}

/** Turn the current landing page (sections switches + order) into a builder list. */
export function sectionsFromLanding(on: Record<string, boolean>, order: "story-first" | "shop-first"): Section[] {
  const mid: SectionType[] = order === "shop-first" ? ["newArrivals", "readyToShip", "story", "process"] : ["readyToShip", "story", "process", "newArrivals"];
  const flags: Partial<Record<SectionType, boolean>> = {
    marquee: on.marquee, categories: on.categories, readyToShip: on.readyToShip, story: on.story, process: on.process, newArrivals: on.newArrivals, promise: on.promise, closing: on.closingCta,
  };
  return (["hero", "marquee", "categories", ...mid, "promise", "closing"] as SectionType[]).map((type) => ({ ...makeSection(type), enabled: flags[type] ?? true }));
}

/** Human label for a section in lists: its title if it has one. */
export function sectionLabel(s: Section) {
  const t = "title" in s && typeof s.title === "string" ? s.title.replace(/[*]/g, "").replace(/\s*\/\s*/g, " ").trim() : "";
  return t || SECTION_INFO[s.type].label;
}
