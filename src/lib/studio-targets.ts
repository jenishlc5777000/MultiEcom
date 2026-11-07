/**
 * Click-to-edit map for the Studio preview. Storefront elements carry
 * data-studio="<key>"; clicking one in the preview opens the matching
 * Studio tab and scrolls to the panel with that id.
 */
export type StudioTarget = { label: string; tab: string; panel: string };

export const STUDIO_TARGETS: Record<string, { name: string; targets: StudioTarget[] }> = {
  announcement: { name: "Announcement bar", targets: [{ label: "Style", tab: "header", panel: "header" }] },
  header: { name: "Header", targets: [{ label: "Header design", tab: "header", panel: "header" }, { label: "Search", tab: "search", panel: "search" }] },
  logo: { name: "Logo", targets: [{ label: "Logo", tab: "header", panel: "logo" }] },
  hero: {
    name: "Hero",
    targets: [
      { label: "Hero text", tab: "content", panel: "content-hero" },
      { label: "Hero design", tab: "layout", panel: "hero" },
      { label: "Colours & gradient", tab: "style", panel: "gradient" },
    ],
  },
  marquee: { name: "Scrolling ticker", targets: [{ label: "Show / hide", tab: "layout", panel: "sections" }, { label: "Speed", tab: "style", panel: "animations" }] },
  categories: {
    name: "Categories",
    targets: [
      { label: "Category design", tab: "layout", panel: "categories" },
      { label: "Section title", tab: "content", panel: "content-sections" },
    ],
  },
  "ready-to-ship": { name: "Ready to ship", targets: [{ label: "Section title", tab: "content", panel: "content-sections" }, { label: "Show / hide", tab: "layout", panel: "sections" }] },
  "new-arrivals": { name: "New arrivals", targets: [{ label: "Section title", tab: "content", panel: "content-sections" }, { label: "Show / hide", tab: "layout", panel: "sections" }] },
  story: { name: "Our story", targets: [{ label: "Story text", tab: "content", panel: "content-story" }, { label: "Show / hide", tab: "layout", panel: "sections" }] },
  process: { name: "The process", targets: [{ label: "Steps", tab: "content", panel: "content-process" }, { label: "Show / hide", tab: "layout", panel: "sections" }] },
  promise: { name: "Shipping & returns strip", targets: [{ label: "Show / hide", tab: "layout", panel: "sections" }] },
  closing: { name: "Closing call to action", targets: [{ label: "Text", tab: "content", panel: "content-closing" }, { label: "Show / hide", tab: "layout", panel: "sections" }] },
  "product-card": {
    name: "Product card",
    targets: [
      { label: "Card style", tab: "cards", panel: "cards" },
      { label: "Text sizes", tab: "cards", panel: "card-text" },
      { label: "What cards show", tab: "cards", panel: "card-content" },
    ],
  },
  "product-list": { name: "Product list", targets: [{ label: "List layout", tab: "pages", panel: "listing" }, { label: "Columns & spacing", tab: "cards", panel: "card-grid" }] },
  "category-page": { name: "Category page", targets: [{ label: "Page layout", tab: "pages", panel: "category-page" }] },
  "categories-page": { name: "All categories page", targets: [{ label: "Layout", tab: "pages", panel: "categories-page" }] },
  "product-page": { name: "Product page", targets: [{ label: "Page options", tab: "pages", panel: "product-page" }] },
  "search-page": { name: "Search", targets: [{ label: "Search results", tab: "search", panel: "search-results" }, { label: "Instant results", tab: "search", panel: "search-instant" }] },
  "contact-page": { name: "Contact page", targets: [{ label: "Page text", tab: "content", panel: "content-contact" }, { label: "Form & emails", tab: "contact", panel: "contact-form" }] },
  "shop-home": { name: "Shop home", targets: [{ label: "Product layout", tab: "pages", panel: "shop-page" }, { label: "Hero text", tab: "content", panel: "content-hero" }] },
  footer: { name: "Footer", targets: [{ label: "Footer design", tab: "footer", panel: "footer" }] },
  typography: { name: "Fonts", targets: [{ label: "Typography", tab: "style", panel: "typography" }] },
};

export const STUDIO_MESSAGE = "cg-studio-select";
/** Inline text edit made in the preview: { path, value }. */
export const STUDIO_TEXT_MESSAGE = "cg-studio-text";

/** Targets for a builder section (data-studio="section"). */
export const sectionTargets = (id: string): StudioTarget[] => [{ label: "Edit section", tab: "sections", panel: `section-${id}` }];
export const STUDIO_MODE_MESSAGE = "cg-studio-mode";
