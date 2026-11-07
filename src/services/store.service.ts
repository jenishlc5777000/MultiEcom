import "server-only";
import { cache } from "react";
import { sharedCache } from "@/lib/data-cache";
import { getTheme } from "@/config/themes";
import { connectDB } from "@/lib/db/connect";
import { getSiteConfig, getThemeChoice } from "./site-config.service";
import { Glaze, Product, Setting } from "@/models";

/** Store-wide settings shown in the UI (announcement bar, policies, footer). */
export const getStoreInfo = cache(sharedCache(async () => {
  await connectDB();
  const s = await Setting.findOne({ key: "store" }).lean();
  return {
    announcement: s?.announcement ?? "",
    shippingFlatFee: s?.shippingFlatFee ?? 0,
    freeShippingThreshold: s?.freeShippingThreshold ?? 0,
    returnWindowDays: s?.returnWindowDays ?? 7,
    unpaidOrderTtlMinutes: s?.unpaidOrderTtlMinutes ?? 30,
    contactEmail: s?.contactEmail ?? "",
    contactPhone: s?.contactPhone ?? "",
    instagram: s?.instagram ?? "",
  };
}, "store-info", "settings"));

/** The theme saved in Settings (or the owner's unsaved pick while previewing). */
const getSavedTheme = cache(async () => getTheme(await getThemeChoice()));

/**
 * The active theme with the owner's Appearance overrides applied (home page
 * type, hero, category style, card style, section order). Anything left on
 * "theme" keeps the theme's own choice.
 */
export const getActiveTheme = cache(async () => {
  const [theme, site] = await Promise.all([getSavedTheme(), getSiteConfig()]);
  const pick = <T extends string>(v: T | "theme", fallback: T): T => (v === "theme" ? fallback : v);
  const d = site.design;
  return {
    ...theme,
    layout: {
      home: pick(d.homeMode, theme.layout.home),
      hero: pick(d.hero, theme.layout.hero),
      categories: pick(d.categories, theme.layout.categories),
      cards: pick(site.cards.style, theme.layout.cards),
      sections: pick(d.sectionOrder, theme.layout.sections),
      listing: pick(site.pages.listing, theme.layout.listing),
    },
    effect: pick(d.effect, theme.effect),
    chrome: pick(d.chrome, theme.chrome),
    type: { ...theme.type, em: pick(d.typography.emphasis, theme.type.em) },
    bg: pick(d.background, theme.bg),
  };
});

/** Real counts and names for the landing page (never hard-coded marketing numbers). */
export const getStoreHighlights = cache(sharedCache(async () => {
  await connectDB();
  const [readyCount, activeCount, glazes] = await Promise.all([
    Product.countDocuments({ status: "ACTIVE", availability: "READY_STOCK" }),
    Product.countDocuments({ status: "ACTIVE" }),
    Glaze.find({ isActive: true }).select("name").sort({ name: 1 }).lean(),
  ]);
  return { readyCount, activeCount, glazeNames: glazes.map((g) => g.name) };
}, "store-highlights", "catalog"));
