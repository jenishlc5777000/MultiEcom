import { z } from "zod";
import { themeIds } from "@/config/themes";
import { siteConfigSchema, type SiteConfig } from "./site-config";

/**
 * Export / import files (Studio → Theme). Two kinds:
 *  - "theme": the look only: theme, colours/fonts/effects, product cards,
 *    header, logo, footer and page layouts.
 *  - "all": the whole site setup: the above plus home-page sections, text,
 *    search, contact form, shopping, visibility, every theme's own
 *    customisations and the store settings (shipping, returns, contact…).
 * Credentials, products, orders and customers are never included.
 */
export const THEME_FILE_FORMAT = "clay-glaze-theme";
export const EXPORT_SCOPES = ["theme", "all"] as const;
export type ExportScope = (typeof EXPORT_SCOPES)[number];

export const IMPORT_PARTS = [
  "theme", "design", "cards", "header", "logo", "footer", "pages",
  "search", "builder", "content", "contactForm", "shopping", "visibility", "perTheme", "store",
] as const;
export type ImportPart = (typeof IMPORT_PARTS)[number];

/** Parts that make up "the look" (the theme export). */
export const THEME_PARTS: ImportPart[] = ["theme", "design", "cards", "header", "logo", "footer", "pages"];
/** Site-config sections included in each export. */
export const SITE_SECTIONS: Record<ExportScope, (keyof SiteConfig)[]> = {
  theme: ["design", "cards", "header", "logo", "footer", "pages"],
  all: Object.keys(siteConfigSchema.shape) as (keyof SiteConfig)[],
};

export const importPartLabels: Record<ImportPart, string> = {
  theme: "Theme (colours, fonts, shapes, effects)",
  design: "Layout, hero, colour & font changes",
  cards: "Product card styles",
  header: "Header design",
  logo: "Logo",
  footer: "Footer design",
  pages: "Page layouts (category, product, lists)",
  search: "Search settings",
  builder: "Home-page sections",
  content: "Website text",
  contactForm: "Contact form & email templates",
  shopping: "Favourites, offers, hot deals, most ordered",
  visibility: "Pages & site parts on/off",
  perTheme: "Every theme's own customisations",
  store: "Store settings (shipping, returns, contact, announcement)",
};

/** Store settings that travel in a full export (money in paise, as stored). */
export const storeSettingsSchema = z.object({
  shippingFlatFee: z.coerce.number().int().min(0).max(100_000_000).default(0),
  freeShippingThreshold: z.coerce.number().int().min(0).max(1_000_000_000).default(0),
  returnWindowDays: z.coerce.number().int().min(0).max(90).default(7),
  unpaidOrderTtlMinutes: z.coerce.number().int().min(5).max(1440).default(30),
  announcement: z.string().trim().max(160).default(""),
  contactEmail: z.union([z.string().trim().email(), z.literal("")]).default(""),
  contactPhone: z.string().trim().max(20).default(""),
  instagram: z.union([z.string().trim().url(), z.literal("")]).default(""),
});
export type StoreSettings = z.infer<typeof storeSettingsSchema>;

/** File envelope. Each site section is validated separately on import. */
export const themeFileSchema = z.object({
  format: z.literal(THEME_FILE_FORMAT, { errorMap: () => ({ message: "This isn't a theme file exported from this store." }) }),
  version: z.union([z.literal(1), z.literal(2)], { errorMap: () => ({ message: "This file is from a newer version." }) }),
  /** Files from before export kinds existed were full exports. */
  scope: z.enum(EXPORT_SCOPES).default("all"),
  exportedAt: z.string().optional(),
  theme: z.enum(themeIds, { errorMap: () => ({ message: "The file uses a theme this store doesn't have." }) }),
  site: z.record(z.unknown()),
  store: storeSettingsSchema.optional(),
});
export type ThemeFile = z.infer<typeof themeFileSchema>;

/** Which parts a file can restore (only those it contains). */
export function partsInFile(file: { site: Record<string, unknown>; store?: unknown }): ImportPart[] {
  return IMPORT_PARTS.filter((p) => (p === "theme" ? true : p === "store" ? Boolean(file.store) : p in file.site));
}
