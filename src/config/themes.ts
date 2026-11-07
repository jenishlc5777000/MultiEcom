/**
 * Storefront themes. The owner picks one in Admin → Settings. A theme is a
 * whole look, not just colours:
 *
 * - colours, fonts, heading style and corner shapes become CSS variables on
 *   <html> (see themeCss(), injected by the root layout);
 * - `layout.home` picks the kind of home page: a marketing landing page, a
 *   direct shop (straight into products), or a special concept (lookbook,
 *   spotlight, bento). The other `layout` keys tune the pieces inside it;
 * - `layout.cards` styles product cards everywhere (via <html data-cards>).
 *
 * Adding a theme = adding one entry below. Nothing else needs to change.
 */

/* ───────────── Building blocks ───────────── */

export type HomeMode = "landing" | "shop" | "lookbook" | "spotlight" | "bento";
export type HeroLayout = "split" | "centered" | "fullbleed" | "editorial" | "minimal" | "collage" | "framed" | "search";
export type CategoryLayout = "mosaic" | "cards" | "list" | "circles" | "pills" | "tiles";
export type CardStyle = "classic" | "framed" | "square" | "minimal" | "overlay" | "numbered" | "listing";
/** Landing-page order: story before the product grid, or products first. */
export type SectionOrder = "story-first" | "shop-first";
export type ThemeGroup = "landing" | "shop" | "special" | "template";
/** How *highlighted* words in headings look. */
export type Emphasis = "italic" | "accent" | "marker";
/** Extra editorial detail: "numbered" adds N°01 / N°02 labels to section headings. */
export type Chrome = "none" | "numbered";
/** Surface treatment for cards, buttons and panels (see globals.css → html[data-effect]). */
export type Effect = "none" | "brutal" | "glass" | "soft" | "clay" | "neon" | "offset";
/** Page background pattern (html[data-bg]). */
export type Backdrop = "plain" | "mesh" | "grid" | "dots" | "grain";
/** How product lists are laid out on category, search and shop pages. */
export type ListingLayout = "grid" | "list" | "compact" | "masonry" | "large";

export const effectLabels: Record<Effect, string> = {
  none: "Flat",
  brutal: "Neubrutalism",
  glass: "Glassmorphism",
  soft: "Soft shadows",
  clay: "Claymorphism",
  neon: "Neon glow",
  offset: "Offset frames",
};
export const backdropLabels: Record<Backdrop, string> = { plain: "Plain", mesh: "Gradient mesh", grid: "Grid lines", dots: "Dots", grain: "Paper grain" };
export const listingLabels: Record<ListingLayout, string> = { grid: "Grid", list: "List rows", compact: "Compact grid", masonry: "Masonry", large: "Large tiles" };

export const groupLabels: Record<ThemeGroup, { title: string; hint: string }> = {
  landing: { title: "Landing page", hint: "A full marketing home page: hero, categories, story and products." },
  shop: { title: "Direct shop", hint: "No landing page. Home opens straight into the store: categories and every product." },
  special: { title: "Special concepts", hint: "Different ideas for the home page: a magazine lookbook, a single-product spotlight, a bento grid." },
  template: { title: "Templates", hint: "Complete starter sites: a theme plus ready-made home-page sections and text you can apply in one click, then edit." },
};

export const homeLabels: Record<HomeMode, string> = {
  landing: "Landing page",
  shop: "Direct shop",
  lookbook: "Lookbook magazine",
  spotlight: "Product spotlight",
  bento: "Bento grid",
};
export const heroLabels: Record<HeroLayout, string> = {
  split: "split hero",
  centered: "centred hero",
  fullbleed: "full-screen photo",
  editorial: "editorial hero",
  minimal: "type-only hero",
  collage: "photo collage",
  framed: "framed photos",
  search: "search hero",
};
export const categoryLabels: Record<CategoryLayout, string> = {
  mosaic: "mosaic categories",
  cards: "card categories",
  list: "list categories",
  circles: "round categories",
  pills: "category pills",
  tiles: "photo tiles",
};

/** Fonts available to themes (each loaded in src/app/fonts.ts). */
export const FONTS = {
  instrument: { css: "var(--font-instrument)", label: "Instrument Serif" },
  playfair: { css: "var(--font-playfair)", label: "Playfair Display" },
  grotesk: { css: "var(--font-grotesk)", label: "Space Grotesk" },
  dmserif: { css: "var(--font-dmserif)", label: "DM Serif Display" },
  syne: { css: "var(--font-syne)", label: "Syne" },
  outfit: { css: "var(--font-outfit)", label: "Outfit" },
  cormorant: { css: "var(--font-cormorant)", label: "Cormorant Garamond" },
  fraunces: { css: "var(--font-fraunces)", label: "Fraunces" },
  geist: { css: "var(--font-geist)", label: "Geist" },
  mono: { css: "var(--font-geist-mono)", label: "Geist Mono" },
  zilla: { css: "var(--font-zilla)", label: "Zilla Slab" },
} as const;
export type FontKey = keyof typeof FONTS;
export const FONT_KEYS = Object.keys(FONTS) as [FontKey, ...FontKey[]];

type Colors = {
  canvas: string; surface: string; surfaceStrong: string; line: string; ink: string; muted: string;
  accent: string; accentSoft: string;
  ready?: string; readySoft?: string; mto?: string; sold?: string; danger?: string; paper?: string; onAccent?: string;
};

type ThemeInput = {
  id: string;
  name: string;
  group: ThemeGroup;
  description: string;
  dark?: boolean;
  colors: Colors;
  type: { display: FontKey; sans?: FontKey; weight?: number; upper?: boolean; scale?: number; tracking?: number; eyebrow?: number; em?: Emphasis };
  chrome?: Chrome;
  /** Corner radii in px: small, medium, large, buttons/chips. */
  shape: [sm: number, md: number, lg: number, pill: number];
  effect?: Effect;
  bg?: Backdrop;
  layout: { home: HomeMode; hero?: HeroLayout; categories?: CategoryLayout; cards?: CardStyle; sections?: SectionOrder; listing?: ListingLayout };
};

/* ───────────── The themes ───────────── */

const input: ThemeInput[] = [
  /* Landing page themes */
  {
    id: "stone", name: "Stone & Ink", group: "landing",
    description: "Warm off-white, elegant serif, soft corners. The original look.",
    colors: { canvas: "#F6F4F0", surface: "#ECE8E1", surfaceStrong: "#E2DCD2", line: "#DDD7CC", ink: "#1A1917", muted: "#64605A", accent: "#A24A25", accentSoft: "#E7A07F" },
    type: { display: "instrument" }, shape: [6, 12, 20, 999],
    layout: { home: "landing", hero: "split", categories: "mosaic", cards: "classic" },
  },
  {
    id: "sage", name: "Sage & Linen", group: "landing",
    description: "Calm greens, classic Playfair headings, big rounded cards.",
    colors: { canvas: "#F2F4EF", surface: "#E4EAE0", surfaceStrong: "#D6DED0", line: "#D2DACB", ink: "#18221B", muted: "#5A665D", accent: "#4E6B2F", accentSoft: "#B6D68C", ready: "#2F6B5A", readySoft: "#96D6C4" },
    type: { display: "playfair", scale: 0.88, tracking: -0.005 }, shape: [10, 20, 32, 999],
    layout: { home: "landing", hero: "centered", categories: "cards", cards: "framed" },
  },
  {
    id: "harbour", name: "Harbour Blue", group: "landing",
    description: "Crisp and modern: bold grotesk type, tight corners, full-screen photo.",
    colors: { canvas: "#F3F5F8", surface: "#E5EAF1", surfaceStrong: "#D7DFE9", line: "#D5DCE5", ink: "#121A26", muted: "#566173", accent: "#1F5FA8", accentSoft: "#9CC3F0" },
    type: { display: "grotesk", weight: 600, scale: 0.82, tracking: -0.025 }, shape: [4, 6, 8, 6],
    layout: { home: "landing", hero: "fullbleed", categories: "list", cards: "classic", sections: "shop-first" },
  },
  {
    id: "blush", name: "Blush Rose", group: "landing",
    description: "Soft pinks, flowing serif, extra-round shapes. Gift-shop feel.",
    colors: { canvas: "#FAF3F1", surface: "#F2E5E1", surfaceStrong: "#E8D6D0", line: "#E6D5CF", ink: "#2A1A1C", muted: "#6E5B5E", accent: "#A33A5B", accentSoft: "#F0A3BB" },
    type: { display: "playfair", scale: 0.9 }, shape: [14, 26, 40, 999],
    layout: { home: "landing", hero: "centered", categories: "mosaic", cards: "framed" },
  },
  {
    id: "midnight", name: "Midnight Kiln", group: "landing", dark: true,
    description: "Dark mode: charcoal, ember accent, modern grotesk, cinematic hero.",
    colors: { canvas: "#141311", surface: "#1F1D1A", surfaceStrong: "#2C2925", line: "#3A3630", ink: "#F1EDE6", muted: "#A59F96", accent: "#E08A5F", accentSoft: "#A24A25" },
    type: { display: "grotesk", weight: 500, scale: 0.85, tracking: -0.02 }, shape: [8, 14, 22, 999],
    layout: { home: "landing", hero: "fullbleed", categories: "cards", cards: "framed", sections: "shop-first" },
  },
  {
    id: "mono", name: "Gallery Mono", group: "landing",
    description: "Black-and-white gallery: monospace capitals, square edges, red accent.",
    colors: { canvas: "#F4F4F2", surface: "#E8E8E5", surfaceStrong: "#DADAD6", line: "#0A0A0A", ink: "#0A0A0A", muted: "#5C5C58", accent: "#C8321A", accentSoft: "#FF8C73" },
    type: { display: "mono", weight: 500, upper: true, scale: 0.62, tracking: -0.03, eyebrow: 0.22 }, shape: [0, 0, 0, 0],
    layout: { home: "landing", hero: "editorial", categories: "list", cards: "square", sections: "shop-first" },
  },
  {
    id: "terracotta", name: "Terracotta Sun", group: "landing",
    description: "Sun-baked clay tones, soft Fraunces serif and a three-photo collage.",
    colors: { canvas: "#FBF1E6", surface: "#F3E2CF", surfaceStrong: "#EAD2B8", line: "#E6CFB4", ink: "#2B1A10", muted: "#7A5E4B", accent: "#B4441C", accentSoft: "#F2A27E" },
    type: { display: "fraunces", scale: 0.9, tracking: -0.01 }, shape: [8, 16, 24, 999],
    layout: { home: "landing", hero: "collage", categories: "circles", cards: "classic" },
  },
  {
    id: "noir", name: "Noir Luxe", group: "landing", dark: true,
    description: "Black and ruby luxury: tall Cormorant serif, razor-sharp edges.",
    colors: { canvas: "#0E0E0E", surface: "#1A1A1A", surfaceStrong: "#262626", line: "#333333", ink: "#F5F1E8", muted: "#A39E93", accent: "#E0445A", accentSoft: "#6B1A26" },
    type: { display: "cormorant", weight: 500, scale: 1.08, eyebrow: 0.3 }, shape: [0, 0, 0, 0],
    layout: { home: "landing", hero: "fullbleed", categories: "list", cards: "minimal", sections: "shop-first" },
  },
  {
    id: "citrus", name: "Citrus Pop", group: "landing",
    description: "Lemon and lime: sunny yellow, leaf-green accent, bold Syne headlines, chunky rounded shapes.",
    colors: { canvas: "#FFFBEA", surface: "#FFF1B8", surfaceStrong: "#FFE680", line: "#F0DE8A", ink: "#1D1A05", muted: "#5F5829", accent: "#3F7D0A", accentSoft: "#BEF264" },
    type: { display: "syne", weight: 700, scale: 0.8, tracking: -0.03 }, shape: [14, 24, 32, 999],
    layout: { home: "landing", hero: "centered", categories: "pills", cards: "framed" },
  },
  {
    id: "nordic", name: "Nordic Frost", group: "landing",
    description: "Quiet Scandinavian minimal: cool greys, clean Outfit type, no hero photo.",
    colors: { canvas: "#F7F8F8", surface: "#ECEFF0", surfaceStrong: "#DFE4E6", line: "#DCE1E3", ink: "#1E2528", muted: "#5D6A73", accent: "#3D6E7E", accentSoft: "#A6D3E0" },
    type: { display: "outfit", weight: 500, scale: 0.86, tracking: -0.02 }, shape: [4, 8, 12, 999],
    layout: { home: "landing", hero: "minimal", categories: "cards", cards: "minimal" },
  },
  {
    id: "forest", name: "Deep Forest", group: "landing", dark: true,
    description: "Dark pine green with fresh mint, DM Serif headings and overlay product cards.",
    colors: { canvas: "#0F1A14", surface: "#17251D", surfaceStrong: "#213328", line: "#2C4235", ink: "#EAF2EC", muted: "#9DB3A5", accent: "#86EFAC", accentSoft: "#14532D", ready: "#86C99C", readySoft: "#2C5E3E" },
    type: { display: "dmserif", scale: 0.95 }, shape: [6, 12, 18, 999],
    layout: { home: "landing", hero: "split", categories: "mosaic", cards: "overlay", sections: "shop-first" },
  },
  {
    id: "lavender", name: "Lavender Haze", group: "landing",
    description: "Dreamy lilac, DM Serif display, pillowy corners and round category icons.",
    colors: { canvas: "#F7F4FB", surface: "#EDE6F6", surfaceStrong: "#E0D5EF", line: "#DED3EC", ink: "#231A33", muted: "#665C7A", accent: "#6B46C1", accentSoft: "#C9B3F5" },
    type: { display: "dmserif", scale: 0.92 }, shape: [16, 28, 40, 999],
    layout: { home: "landing", hero: "centered", categories: "circles", cards: "framed" },
  },
  {
    id: "concrete", name: "Brutal Concrete", group: "landing",
    description: "Brutalist: concrete grey, heavy black rules, huge Syne capitals, cobalt accent.",
    colors: { canvas: "#E9E9E4", surface: "#DCDCD5", surfaceStrong: "#CBCBC3", line: "#111111", ink: "#111111", muted: "#4F4F49", accent: "#2F49D1", accentSoft: "#9FB0FF" },
    type: { display: "syne", weight: 800, upper: true, scale: 0.7, tracking: -0.04, eyebrow: 0.2 }, shape: [0, 0, 0, 0],
    layout: { home: "landing", hero: "editorial", categories: "list", cards: "square" },
  },
  {
    id: "sunset", name: "Desert Sunset", group: "landing",
    description: "Dusk tones: peach and plum, refined Cormorant serif, cinematic full-screen photo.",
    colors: { canvas: "#FFF1E6", surface: "#F8E4D8", surfaceStrong: "#F1D2BF", line: "#EED3C2", ink: "#3A1F16", muted: "#7E5A49", accent: "#7C2D92", accentSoft: "#E9B8F0" },
    type: { display: "cormorant", weight: 600, scale: 1.05 }, shape: [2, 4, 6, 2],
    layout: { home: "landing", hero: "fullbleed", categories: "cards", cards: "classic" },
  },
  {
    id: "coastal", name: "Coastal Breeze", group: "landing",
    description: "Sea-glass blues, friendly Outfit type, photo collage and overlay cards.",
    colors: { canvas: "#F2F8F9", surface: "#E1EFF1", surfaceStrong: "#CDE4E8", line: "#CFE3E6", ink: "#0D2A33", muted: "#4A6770", accent: "#0E7490", accentSoft: "#8FD8EA" },
    type: { display: "outfit", weight: 600, scale: 0.84, tracking: -0.025 }, shape: [12, 20, 28, 999],
    layout: { home: "landing", hero: "collage", categories: "pills", cards: "overlay" },
  },
  {
    id: "retro", name: "Retro Diner", group: "landing",
    description: "Cream and cherry red, chunky outlines, DM Serif capitals. 1950s diner energy.",
    colors: { canvas: "#FFF6E9", surface: "#FBE3C4", surfaceStrong: "#F5CF9F", line: "#2B2118", ink: "#2B2118", muted: "#66523F", accent: "#C81E35", accentSoft: "#FF9AA6" },
    type: { display: "dmserif", upper: true, scale: 0.8, eyebrow: 0.2 }, shape: [10, 18, 26, 999],
    layout: { home: "landing", hero: "split", categories: "circles", cards: "framed" },
  },

  /* Direct shop themes: no landing page */
  {
    id: "market", name: "Daily Market", group: "shop",
    description: "Clean marketplace: white, green buy buttons, round category icons and a big product grid.",
    colors: { canvas: "#FAFAFA", surface: "#F1F1F1", surfaceStrong: "#E4E4E4", line: "#E2E2E2", ink: "#111827", muted: "#5B6472", accent: "#15803D", accentSoft: "#86EFAC" },
    type: { display: "geist", weight: 700, scale: 0.7, tracking: -0.03 }, shape: [8, 12, 16, 8],
    layout: { home: "shop", categories: "circles", cards: "framed" },
  },
  {
    id: "boutique", name: "Boutique Shelf", group: "shop",
    description: "Quiet boutique: linen tones, Cormorant serif, slim category pills, minimal cards.",
    colors: { canvas: "#FBF8F4", surface: "#F2ECE4", surfaceStrong: "#E7DED2", line: "#E4DACD", ink: "#241C15", muted: "#6E6255", accent: "#8B5E34", accentSoft: "#E2BE95" },
    type: { display: "cormorant", weight: 600, scale: 0.95 }, shape: [2, 2, 4, 2],
    layout: { home: "shop", categories: "pills", cards: "minimal" },
  },
  {
    id: "megastore", name: "Mega Store", group: "shop",
    description: "Big-retail energy: navy and hot pink, bold Outfit type, category tiles up top.",
    colors: { canvas: "#F4F6FB", surface: "#E7ECF7", surfaceStrong: "#D5DDF0", line: "#D6DEEF", ink: "#0B1533", muted: "#4D5B7C", accent: "#D61F45", accentSoft: "#FDA4AF" },
    type: { display: "outfit", weight: 700, scale: 0.75, tracking: -0.03 }, shape: [6, 10, 14, 6],
    layout: { home: "shop", categories: "cards", cards: "classic" },
  },
  {
    id: "nightshop", name: "Night Shop", group: "shop", dark: true,
    description: "Dark app-style store: slate, periwinkle accent, framed cards, category pills.",
    colors: { canvas: "#111318", surface: "#1A1D24", surfaceStrong: "#252A33", line: "#2F3540", ink: "#F1F3F7", muted: "#9AA3B2", accent: "#7C9CFF", accentSoft: "#2D3F8A", ready: "#6EE7A8", readySoft: "#1E5B3F" },
    type: { display: "grotesk", weight: 600, scale: 0.75, tracking: -0.02 }, shape: [10, 14, 18, 999],
    layout: { home: "shop", categories: "pills", cards: "framed" },
  },
  {
    id: "craftfair", name: "Craft Fair", group: "shop",
    description: "Handmade market stall: warm cream, mustard accent, Fraunces serif, round category stamps.",
    colors: { canvas: "#FFFDF7", surface: "#F6F0DF", surfaceStrong: "#ECE2C6", line: "#E8DDBF", ink: "#2A2414", muted: "#6A6044", accent: "#A16207", accentSoft: "#FDE68A" },
    type: { display: "fraunces", scale: 0.85 }, shape: [12, 18, 24, 999],
    layout: { home: "shop", categories: "circles", cards: "classic" },
  },

  /* Special concepts */
  {
    id: "magazine", name: "Lookbook Magazine", group: "special",
    description: "A printed-magazine home page in ink and deep teal: masthead, then one photo spread per category.",
    colors: { canvas: "#F5F2EC", surface: "#EAE4DA", surfaceStrong: "#DCD3C5", line: "#CFC5B5", ink: "#1B1712", muted: "#665D50", accent: "#115E59", accentSoft: "#5EEAD4" },
    type: { display: "playfair", scale: 1 }, shape: [0, 0, 0, 0],
    layout: { home: "lookbook", cards: "minimal" },
  },
  {
    id: "atelier", name: "Atelier Night", group: "special", dark: true,
    description: "Dark lookbook: espresso and dusty rose, Cormorant italics, cinematic category spreads.",
    colors: { canvas: "#1A1714", surface: "#24201C", surfaceStrong: "#2F2A25", line: "#3D3631", ink: "#EFE8DD", muted: "#AFA597", accent: "#E7A3B4", accentSoft: "#7A3446" },
    type: { display: "cormorant", weight: 500, scale: 1.05 }, shape: [4, 6, 8, 999],
    layout: { home: "lookbook", cards: "overlay" },
  },
  {
    id: "spotlight", name: "Spotlight", group: "special",
    description: "One hero product, huge and ready to buy, on cool mint with an emerald accent.",
    colors: { canvas: "#F2F7F4", surface: "#E3EEE8", surfaceStrong: "#D0E3D8", line: "#D3E3DA", ink: "#141414", muted: "#5F5B55", accent: "#047857", accentSoft: "#6EE7B7" },
    type: { display: "syne", weight: 700, scale: 0.8, tracking: -0.03 }, shape: [20, 28, 36, 999],
    layout: { home: "spotlight", cards: "framed" },
  },
  {
    id: "solo", name: "Solo Gallery", group: "special",
    description: "A single piece on a gallery wall: monospace labels, square frames, purple accent.",
    colors: { canvas: "#EDEDED", surface: "#E1E1E1", surfaceStrong: "#D2D2D2", line: "#111111", ink: "#111111", muted: "#555555", accent: "#9333EA", accentSoft: "#D8B4FE" },
    type: { display: "mono", weight: 500, upper: true, scale: 0.6, tracking: -0.03, eyebrow: 0.22 }, shape: [0, 0, 0, 0],
    layout: { home: "spotlight", cards: "square" },
  },
  {
    id: "bento", name: "Bento Studio", group: "special",
    description: "A bento-box home page: one grid of tiles for the story, categories, stats and a featured piece.",
    colors: { canvas: "#F4F1EC", surface: "#E9E3DA", surfaceStrong: "#DCD3C6", line: "#DDD4C7", ink: "#1C1A17", muted: "#68625A", accent: "#5B5BD6", accentSoft: "#B9B9FF" },
    type: { display: "outfit", weight: 600, scale: 0.8, tracking: -0.03 }, shape: [14, 22, 30, 999],
    layout: { home: "bento", cards: "framed" },
  },

  /* ── Direct shop: 10 more store designs ── */
  {
    id: "brutalmarket", name: "Brutal Market", group: "shop",
    description: "Neubrutalist store: acid lime and black, purple buttons, thick outlines, hard offset shadows.",
    colors: { canvas: "#ECFCCB", surface: "#D9F99D", surfaceStrong: "#BEF264", line: "#111111", ink: "#111111", muted: "#3F4A2A", accent: "#7E22CE", accentSoft: "#D8B4FE" },
    type: { display: "grotesk", weight: 700, scale: 0.78, tracking: -0.03 }, shape: [6, 8, 10, 8], effect: "brutal",
    layout: { home: "shop", categories: "pills", cards: "framed", listing: "grid" },
  },
  {
    id: "glassstore", name: "Glass Store", group: "shop",
    description: "Glassmorphism: frosted panels floating on a soft sunset-orange gradient mesh.",
    colors: { canvas: "#EEF1FB", surface: "#E1E6F7", surfaceStrong: "#CFD7F0", line: "#D2D9EE", ink: "#141A33", muted: "#525C7E", accent: "#C2410C", accentSoft: "#FDBA74" },
    type: { display: "outfit", weight: 600, scale: 0.78, tracking: -0.025 }, shape: [14, 22, 28, 999], effect: "glass", bg: "mesh",
    layout: { home: "shop", categories: "circles", cards: "framed", listing: "grid" },
  },
  {
    id: "softcloud", name: "Soft Cloud", group: "shop",
    description: "Calm app-like store: cool greys, soft floating shadows, dense compact grid.",
    colors: { canvas: "#F2F4F7", surface: "#E9ECF1", surfaceStrong: "#DDE2EA", line: "#E1E5EB", ink: "#1F2633", muted: "#5B6576", accent: "#1F6FD6", accentSoft: "#A9CBF5" },
    type: { display: "geist", weight: 600, scale: 0.72, tracking: -0.03 }, shape: [12, 18, 24, 999], effect: "soft",
    layout: { home: "shop", categories: "cards", cards: "framed", listing: "compact" },
  },
  {
    id: "claytoys", name: "Clay Toys", group: "shop",
    description: "Claymorphism: puffy mint shapes, chunky Fraunces type, large product tiles.",
    colors: { canvas: "#EEFBF5", surface: "#D9F4E7", surfaceStrong: "#BFEBD6", line: "#CDEEDD", ink: "#123B2E", muted: "#4C6F63", accent: "#0F8A5F", accentSoft: "#8FE3C0" },
    type: { display: "fraunces", weight: 600, scale: 0.82 }, shape: [18, 28, 36, 999], effect: "clay",
    layout: { home: "shop", categories: "circles", cards: "framed", listing: "large" },
  },
  {
    id: "neonnight", name: "Neon Night", group: "shop", dark: true,
    description: "Dark gamer-style store: lime neon glow, grid backdrop, Syne capitals.",
    colors: { canvas: "#0B0B12", surface: "#14141F", surfaceStrong: "#1E1E2C", line: "#2A2A3B", ink: "#F2F2FF", muted: "#A0A0C0", accent: "#C6FF3D", accentSoft: "#4C6B00" },
    type: { display: "syne", weight: 700, upper: true, scale: 0.68, tracking: -0.02, eyebrow: 0.2 }, shape: [10, 14, 18, 10], effect: "neon", bg: "grid",
    layout: { home: "shop", categories: "pills", cards: "framed", listing: "grid" },
  },
  {
    id: "swissindex", name: "Swiss Index", group: "shop",
    description: "International-style catalogue: black rules, electric-blue accent, list view like a price index.",
    colors: { canvas: "#F7F7F5", surface: "#EDEDEA", surfaceStrong: "#DEDED9", line: "#111111", ink: "#111111", muted: "#545454", accent: "#0047FF", accentSoft: "#9DB4FF" },
    type: { display: "geist", weight: 700, scale: 0.74, tracking: -0.045 }, shape: [0, 0, 0, 0],
    layout: { home: "shop", categories: "list", cards: "square", listing: "list" },
  },
  {
    id: "pastelpop", name: "Pastel Pop", group: "shop",
    description: "Candy pinks on a dotted backdrop, DM Serif headings, Pinterest-style masonry.",
    colors: { canvas: "#FFF7FB", surface: "#FDE7F1", surfaceStrong: "#F9D3E5", line: "#F4D6E4", ink: "#2E1A2A", muted: "#735A6C", accent: "#B5179E", accentSoft: "#F7A8E8" },
    type: { display: "dmserif", scale: 0.85 }, shape: [16, 24, 32, 999], effect: "soft", bg: "dots",
    layout: { home: "shop", categories: "circles", cards: "framed", listing: "masonry" },
  },
  {
    id: "onyx", name: "Onyx Boutique", group: "shop", dark: true,
    description: "Dark luxury store: onyx and silver, Cormorant serif, big editorial tiles.",
    colors: { canvas: "#121110", surface: "#1C1A18", surfaceStrong: "#272422", line: "#34302C", ink: "#EDE6DA", muted: "#A89F92", accent: "#D4D4D8", accentSoft: "#52525B" },
    type: { display: "cormorant", weight: 500, scale: 1, eyebrow: 0.3 }, shape: [0, 0, 2, 0], bg: "grain",
    layout: { home: "shop", categories: "list", cards: "minimal", listing: "large" },
  },
  {
    id: "y2k", name: "Y2K Chrome", group: "shop",
    description: "Early-2000s revival: periwinkle chrome mesh, fuchsia, glass panels, bold Syne capitals.",
    colors: { canvas: "#F0F3FF", surface: "#E2E8FF", surfaceStrong: "#CDD6FF", line: "#B8C4F5", ink: "#10123A", muted: "#4B518C", accent: "#A21CAF", accentSoft: "#F0ABFC" },
    type: { display: "syne", weight: 800, upper: true, scale: 0.64, tracking: -0.04, eyebrow: 0.2 }, shape: [20, 30, 40, 999], effect: "glass", bg: "mesh",
    layout: { home: "shop", categories: "pills", cards: "overlay", listing: "grid" },
  },
  {
    id: "farmers", name: "Farmers Market", group: "shop",
    description: "Wholesome market stall: oat and leaf green, paper grain, easy-to-scan list rows.",
    colors: { canvas: "#F7F3E8", surface: "#ECE5D0", surfaceStrong: "#DED3B4", line: "#D9CDAA", ink: "#22301C", muted: "#5B6150", accent: "#2E7D32", accentSoft: "#A5D6A7" },
    type: { display: "fraunces", scale: 0.85 }, shape: [8, 12, 16, 999], bg: "grain",
    layout: { home: "shop", categories: "circles", cards: "classic", listing: "list" },
  },

  /* ── Landing page: 10 more designs ── */
  {
    id: "neubrutal", name: "Neubrutal", group: "landing",
    description: "Loud neubrutalism: yellow panels, black outlines, offset shadows, electric blue.",
    colors: { canvas: "#F4F0E6", surface: "#FFE45C", surfaceStrong: "#FFD60A", line: "#000000", ink: "#000000", muted: "#3D3D3D", accent: "#3A5BFF", accentSoft: "#A8B7FF" },
    type: { display: "grotesk", weight: 700, scale: 0.8, tracking: -0.03 }, shape: [8, 10, 12, 10], effect: "brutal",
    layout: { home: "landing", hero: "centered", categories: "cards", cards: "framed" },
  },
  {
    id: "frosted", name: "Frosted Glass", group: "landing",
    description: "Glassmorphism landing: violet gradient mesh, frosted cards, airy Outfit type.",
    colors: { canvas: "#E9EEF9", surface: "#DCE4F5", surfaceStrong: "#C9D4EE", line: "#CCD6EC", ink: "#101730", muted: "#4D597A", accent: "#7C3AED", accentSoft: "#C4B5FD" },
    type: { display: "outfit", weight: 600, scale: 0.82, tracking: -0.025 }, shape: [18, 26, 32, 999], effect: "glass", bg: "mesh",
    layout: { home: "landing", hero: "centered", categories: "circles", cards: "overlay" },
  },
  {
    id: "aurora", name: "Aurora Dark", group: "landing", dark: true,
    description: "Night sky aurora: deep navy mesh, teal glow, modern grotesk. Very SaaS-hero.",
    colors: { canvas: "#0A0F1F", surface: "#121A2F", surfaceStrong: "#1B2540", line: "#26324F", ink: "#EAF0FF", muted: "#9AA8C7", accent: "#5EEAD4", accentSoft: "#115E59" },
    type: { display: "grotesk", weight: 600, scale: 0.82, tracking: -0.025 }, shape: [14, 20, 26, 999], effect: "neon", bg: "mesh",
    layout: { home: "landing", hero: "centered", categories: "cards", cards: "framed", sections: "shop-first" },
  },
  {
    id: "softui", name: "Soft UI", group: "landing",
    description: "Soft UI: pale grey surfaces, gentle shadows instead of borders, teal accent.",
    colors: { canvas: "#ECEFF4", surface: "#E3E7EE", surfaceStrong: "#D7DCE5", line: "#DCE1E8", ink: "#1E2430", muted: "#596375", accent: "#0F766E", accentSoft: "#99F6E4" },
    type: { display: "outfit", weight: 500, scale: 0.84, tracking: -0.02 }, shape: [16, 24, 30, 999], effect: "soft",
    layout: { home: "landing", hero: "split", categories: "circles", cards: "framed" },
  },
  {
    id: "claymorph", name: "Claymorphism", group: "landing",
    description: "Puffy 3D-clay look: lilac with raspberry, pillowy shapes, inner highlights, photo collage hero.",
    colors: { canvas: "#F3EDFF", surface: "#E8DEFF", surfaceStrong: "#D9CAFF", line: "#DDD0FA", ink: "#2A1E4A", muted: "#695C8A", accent: "#BE185D", accentSoft: "#F9A8D4" },
    type: { display: "fraunces", weight: 600, scale: 0.85 }, shape: [22, 32, 40, 999], effect: "clay",
    layout: { home: "landing", hero: "collage", categories: "circles", cards: "framed", listing: "large" },
  },
  {
    id: "swissgrid", name: "Swiss Grid", group: "landing",
    description: "Swiss poster design: grid backdrop, heavy Geist, black rules, signal red.",
    colors: { canvas: "#F5F5F0", surface: "#EAEAE3", surfaceStrong: "#DADAD1", line: "#111111", ink: "#111111", muted: "#4F4F49", accent: "#D90612", accentSoft: "#FF9A9F" },
    type: { display: "geist", weight: 800, scale: 0.78, tracking: -0.05 }, shape: [0, 0, 0, 0], bg: "grid",
    layout: { home: "landing", hero: "editorial", categories: "list", cards: "square", listing: "list" },
  },
  {
    id: "maison", name: "Maison", group: "landing",
    description: "Fashion-house editorial: ivory and navy, tall Cormorant capitals, cinematic photo, no corners.",
    colors: { canvas: "#F8F5EF", surface: "#EFE9DE", surfaceStrong: "#E2D9C8", line: "#D9CFBC", ink: "#1C1915", muted: "#686052", accent: "#1E3A5F", accentSoft: "#A9BCD6" },
    type: { display: "cormorant", weight: 500, scale: 1.1, eyebrow: 0.3 }, shape: [0, 0, 0, 0], bg: "grain",
    layout: { home: "landing", hero: "fullbleed", categories: "mosaic", cards: "minimal", listing: "large" },
  },
  {
    id: "cyber", name: "Cyber Neon", group: "landing", dark: true,
    description: "Cyberpunk: near-black grid, hot-pink neon glow, monospace capitals.",
    colors: { canvas: "#07070C", surface: "#101019", surfaceStrong: "#1A1A27", line: "#2A2A40", ink: "#F4F4FF", muted: "#A3A3C2", accent: "#FF3DCB", accentSoft: "#6B0F55" },
    type: { display: "mono", weight: 600, upper: true, scale: 0.6, tracking: -0.03, eyebrow: 0.24 }, shape: [4, 6, 8, 4], effect: "neon", bg: "grid",
    layout: { home: "landing", hero: "editorial", categories: "list", cards: "square", sections: "shop-first" },
  },
  {
    id: "candy", name: "Candy Pastel", group: "landing",
    description: "Sweet and playful: cream and grape violet, dotted backdrop, masonry product walls.",
    colors: { canvas: "#FFF9F0", surface: "#FFEFD6", surfaceStrong: "#FFE0B3", line: "#F5DDB8", ink: "#2D2116", muted: "#776350", accent: "#6D28D9", accentSoft: "#DDD6FE" },
    type: { display: "dmserif", scale: 0.9 }, shape: [18, 28, 36, 999], effect: "soft", bg: "dots",
    layout: { home: "landing", hero: "centered", categories: "pills", cards: "framed", listing: "masonry" },
  },
  {
    id: "kinetic", name: "Kinetic Type", group: "landing",
    description: "Type-first and bold: huge Syne capitals, no hero photo, hot-pink accent, big lists.",
    colors: { canvas: "#FAFAFA", surface: "#F0F0F0", surfaceStrong: "#E2E2E2", line: "#DDDDDD", ink: "#0A0A0A", muted: "#575757", accent: "#DB2777", accentSoft: "#F9A8D4" },
    type: { display: "syne", weight: 800, upper: true, scale: 0.72, tracking: -0.05, eyebrow: 0.2 }, shape: [12, 20, 28, 999],
    layout: { home: "landing", hero: "minimal", categories: "list", cards: "classic" },
  },

  /* ── Templates: theme + starter home page (src/config/templates.ts) ── */
  {
    id: "nightdrop", name: "Night Drop", group: "template", dark: true,
    description: "Seasonal drop store: near-black violet, hot orange, slab headlines, numbered sections, countdown.",
    colors: { canvas: "#0F0B14", surface: "#1A1322", surfaceStrong: "#2A1B3A", line: "#2E2438", ink: "#F5F0FA", muted: "#A89DB5", accent: "#FF6A1A", accentSoft: "#7A2E06", ready: "#B7F34A", readySoft: "#3B5410" },
    type: { display: "zilla", weight: 700, scale: 0.95, tracking: -0.035, em: "accent", eyebrow: 0.2 }, chrome: "numbered", shape: [2, 4, 4, 2], effect: "offset",
    layout: { home: "landing", hero: "framed", categories: "pills", cards: "numbered", sections: "shop-first" },
  },
  {
    id: "workbench", name: "Workbench", group: "template",
    description: "Small-batch maker: warm cream, ultramarine, marker-highlighted slab headlines, numbered sections.",
    colors: { canvas: "#F2EDE4", surface: "#E8E1D4", surfaceStrong: "#DCD2C1", line: "#D8CFBE", ink: "#1B1A17", muted: "#67625A", accent: "#2338B5", accentSoft: "#C9CCF0" },
    type: { display: "zilla", weight: 700, scale: 0.92, tracking: -0.03, em: "marker", eyebrow: 0.2 }, chrome: "numbered", shape: [2, 4, 4, 2], effect: "offset",
    layout: { home: "landing", hero: "framed", categories: "cards", cards: "numbered" },
  },
  {
    id: "marketplace", name: "Marketplace", group: "template",
    description: "Listings marketplace: deep purple, search-first hero, photo category tiles, listing cards with price on the photo.",
    colors: { canvas: "#FAF7F2", surface: "#F1ECE4", surfaceStrong: "#E4DCCF", line: "#E6DFD3", ink: "#1B1730", muted: "#5F5975", accent: "#5B21B6", accentSoft: "#C4B5FD" },
    type: { display: "zilla", weight: 700, scale: 0.9, tracking: -0.025, em: "accent" }, shape: [10, 14, 18, 999], effect: "soft",
    layout: { home: "landing", hero: "search", categories: "tiles", cards: "listing", sections: "shop-first" },
  },
  {
    id: "bloom", name: "Bloom", group: "template",
    description: "Florist-style boutique: blush pink, Fraunces serif, framed photos, numbered gift picks.",
    colors: { canvas: "#FFF6F7", surface: "#FCE8EC", surfaceStrong: "#F7D3DB", line: "#F3D9DF", ink: "#3A1F2B", muted: "#7A5866", accent: "#C0396B", accentSoft: "#F9B6CC" },
    type: { display: "fraunces", weight: 600, scale: 0.9, em: "italic" }, chrome: "numbered", shape: [14, 22, 30, 999], effect: "soft",
    layout: { home: "landing", hero: "framed", categories: "circles", cards: "numbered" },
  },
  {
    id: "bakehouse", name: "Bakehouse", group: "template",
    description: "Neighbourhood bakery feel: toasted cream and berry jam, marker headlines, photo collage.",
    colors: { canvas: "#FBF3E6", surface: "#F5E4CC", surfaceStrong: "#EED3AE", line: "#EAD6B8", ink: "#3B2414", muted: "#765A44", accent: "#9F1239", accentSoft: "#FDA4AF" },
    type: { display: "zilla", weight: 700, scale: 0.95, tracking: -0.02, em: "marker" }, chrome: "numbered", shape: [10, 16, 20, 999], effect: "offset",
    layout: { home: "landing", hero: "collage", categories: "cards", cards: "framed" },
  },
  {
    id: "oregold", name: "Ore & Gold", group: "template", dark: true,
    description: "Fine-jewellery house: black and champagne gold, Cormorant serif, sharp edges, numbered pieces.",
    colors: { canvas: "#101010", surface: "#1A1917", surfaceStrong: "#24221F", line: "#33302B", ink: "#F3EEE4", muted: "#A9A194", accent: "#D4AF6A", accentSoft: "#6B5525" },
    type: { display: "cormorant", weight: 500, scale: 1.05, em: "accent", eyebrow: 0.28 }, chrome: "numbered", shape: [0, 0, 0, 0], effect: "offset",
    layout: { home: "landing", hero: "framed", categories: "tiles", cards: "numbered", listing: "large" },
  },
  {
    id: "satisfied", name: "Satisfied", group: "template",
    description: "Soft Cloud with serif headlines: cool grey-blue, blue highlights, store-search header, category cards. Built from the client's approved layout.",
    colors: { canvas: "#F2F4F7", surface: "#E9ECF1", surfaceStrong: "#DDE2EA", line: "#E1E5EB", ink: "#1F2633", muted: "#5B6576", accent: "#1F6FD6", accentSoft: "#A9CBF5" },
    type: { display: "playfair", weight: 600, scale: 0.72, tracking: -0.03 }, shape: [12, 18, 24, 999], effect: "soft",
    layout: { home: "landing", hero: "split", categories: "cards", cards: "framed", listing: "compact" },
  },
  {
    id: "nibbea", name: "Nibbea", group: "template",
    description: "Client design: navy on white, Playfair serif, Category menu button, centred monogram logo, product page with labelled photos and glaze tiles.",
    colors: { canvas: "#FFFFFF", surface: "#F4F6FA", surfaceStrong: "#E6EAF2", line: "#E2E6EE", ink: "#1B2A4A", muted: "#5D6880", accent: "#1B2A4A", accentSoft: "#C9D3E6", paper: "#FFFFFF", onAccent: "#FFFFFF" },
    type: { display: "playfair", weight: 600, scale: 0.95, em: "italic", eyebrow: 0.22 }, shape: [4, 6, 8, 6], effect: "none",
    layout: { home: "shop", hero: "split", categories: "tiles", cards: "classic", sections: "shop-first", listing: "grid" },
  },
];

/* ───────────── Resolved themes ───────────── */

const LIGHT_DEFAULTS = { ready: "#3F6B4F", readySoft: "#9BD3AE", mto: "#8A5A12", danger: "#B3261E", paper: "#FFFFFF", onAccent: "#FFFFFF" };
const DARK_DEFAULTS = { ready: "#7FC59A", readySoft: "#2F5D40", mto: "#E0A64A", danger: "#F07167" };

function resolve(t: ThemeInput) {
  const base = t.dark ? { ...DARK_DEFAULTS, paper: t.colors.surface, onAccent: t.colors.canvas } : LIGHT_DEFAULTS;
  const colors = { ...base, sold: t.colors.muted, ...t.colors } as Required<Colors>;
  const display = FONTS[t.type.display];
  const [sm, md, lg, pill] = t.shape;
  return {
    id: t.id,
    name: t.name,
    group: t.group,
    description: t.description,
    dark: Boolean(t.dark),
    themeColor: colors.canvas,
    fontLabel: display.label,
    colors,
    type: {
      display: display.css,
      sans: FONTS[t.type.sans ?? "geist"].css,
      weight: t.type.weight ?? 400,
      upper: Boolean(t.type.upper),
      scale: t.type.scale ?? 1,
      tracking: t.type.tracking ?? 0,
      eyebrow: t.type.eyebrow ?? 0.14,
      em: t.type.em ?? "italic",
    },
    chrome: t.chrome ?? "none",
    shape: { sm, md, lg, pill },
    effect: t.effect ?? "none",
    bg: t.bg ?? "plain",
    layout: {
      home: t.layout.home,
      hero: t.layout.hero ?? "split",
      categories: t.layout.categories ?? "mosaic",
      cards: t.layout.cards ?? "classic",
      sections: t.layout.sections ?? "story-first",
      listing: t.layout.listing ?? "grid",
    },
  };
}

export const themes = input.map(resolve);
export type Theme = (typeof themes)[number];
export type ThemeId = string;
export const themeIds = themes.map((t) => t.id) as [string, ...string[]];
export const DEFAULT_THEME = "stone";

export function isThemeId(v: unknown): v is ThemeId {
  return typeof v === "string" && themeIds.includes(v);
}

export function getTheme(id: unknown): Theme {
  return themes.find((t) => t.id === id) ?? themes[0]!;
}

/** "#A24A25" → "162 74 37" (the format the Tailwind colour tokens expect). */
const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

/**
 * The CSS custom properties for a theme, scoped to html[data-theme] so they
 * win over the :root defaults in globals.css. Only built from the static theme
 * list above, never from user input.
 */
export function themeCss(t: Theme) {
  const c = t.colors;
  const vars: Record<string, string> = {
    canvas: rgb(c.canvas), surface: rgb(c.surface), "surface-strong": rgb(c.surfaceStrong), line: rgb(c.line),
    ink: rgb(c.ink), muted: rgb(c.muted), accent: rgb(c.accent), "accent-soft": rgb(c.accentSoft),
    ready: rgb(c.ready), "ready-soft": rgb(c.readySoft), mto: rgb(c.mto), sold: rgb(c.sold), danger: rgb(c.danger),
    paper: rgb(c.paper), "on-accent": rgb(c.onAccent),
    "font-display": t.type.display, "font-sans": t.type.sans,
    "display-weight": String(t.type.weight), "display-case": t.type.upper ? "uppercase" : "none",
    "display-scale": String(t.type.scale), "tracking-shift": `${t.type.tracking}em`, "eyebrow-tracking": `${t.type.eyebrow}em`,
    "r-sm": `${t.shape.sm}px`, "r-md": `${t.shape.md}px`, "r-lg": `${t.shape.lg}px`, "r-pill": `${t.shape.pill}px`,
  };
  const body = Object.entries(vars).map(([k, v]) => `--${k}:${v};`).join("");
  return `html[data-theme="${t.id}"]{${body}color-scheme:${t.dark ? "dark" : "light"};}`;
}
