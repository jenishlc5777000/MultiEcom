import "server-only";
import { cache } from "react";
import { sharedCache } from "@/lib/data-cache";
import { isThemeId } from "@/config/themes";
import { connectDB } from "@/lib/db/connect";
import { defaultSiteConfig, isPerTheme, parseSiteConfig, scopeToTheme, siteConfigSchema, type SiteConfig } from "@/lib/site-config";
import { Setting } from "@/models";
import { isPreviewMode } from "./preview.service";

type Stored = { site?: unknown; siteDraft?: Record<string, unknown>; theme?: string } | null;

/** The settings document, from the shared cache (cleared on every admin save). */
const loadSettingsDoc = sharedCache(
  async (): Promise<Stored> => {
    await connectDB();
    const doc = await Setting.findOne({ key: "store" }).select("site siteDraft theme").lean<Stored>();
    // Plain JSON only (the cache serialises it).
    return doc ? { site: doc.site, siteDraft: doc.siteDraft, theme: doc.theme } : null;
  },
  "settings-doc",
  "settings",
);

/** One read of the settings document per request (saved values + any preview draft). */
const readSettings = cache(async (): Promise<Stored> => {
  try {
    return await Promise.race([
      loadSettingsDoc(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ]);
  } catch {
    return null;
  }
});

/** Draft sections that pass validation (only used in owner preview mode). */
async function previewDraft(): Promise<Record<string, unknown> | null> {
  const s = await readSettings();
  if (!s?.siteDraft || !(await isPreviewMode())) return null;
  return s.siteDraft;
}

/**
 * The owner's Studio settings for the active theme: that theme's own
 * design/cards customisations are applied. In owner preview mode, unsaved
 * draft sections from the dashboard are layered on top.
 */
export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  const s = await readSettings();
  if (!s) return defaultSiteConfig;
  const site = scopeToTheme(parseSiteConfig(s.site), await getThemeChoice());
  const draft = await previewDraft();
  if (!draft) return site;
  const merged = { ...site } as Record<string, unknown>;
  for (const key of Object.keys(siteConfigSchema.shape) as (keyof SiteConfig)[]) {
    if (!(key in draft)) continue;
    const r = siteConfigSchema.shape[key].safeParse(draft[key]);
    if (r.success) merged[key] = r.data;
  }
  return merged as SiteConfig;
});

/** The saved theme id, or the draft theme while the owner is previewing. */
export const getThemeChoice = cache(async (): Promise<string | undefined> => {
  const s = await readSettings();
  const draft = await previewDraft();
  const draftTheme = draft?.theme;
  return isThemeId(draftTheme) ? draftTheme : s?.theme;
});

/** Where a section is stored: design/cards belong to a theme, everything else is shared. */
async function sectionPath(section: keyof SiteConfig, themeId?: string) {
  if (!isPerTheme(section)) return `site.${section}`;
  const t = themeId ?? (await getThemeChoice());
  return isThemeId(t) ? `site.perTheme.${t}.${section}` : `site.${section}`;
}

/**
 * Replace one section after validating it, and clear its preview draft.
 * design/cards are saved for `themeId` (default: the theme being edited).
 */
export async function saveSiteConfigSection<K extends keyof SiteConfig>(section: K, value: unknown, themeId?: string) {
  const parsed = siteConfigSchema.shape[section].parse(value) as SiteConfig[K];
  await connectDB();
  await Setting.updateOne({ key: "store" }, { $set: { [await sectionPath(section, themeId)]: parsed }, $unset: { [`siteDraft.${section}`]: 1 } }, { upsert: true });
  return parsed;
}

/** Back to defaults for one section (for design/cards: this theme's own look). */
export async function resetSiteConfigSection(section: keyof SiteConfig) {
  await connectDB();
  await Setting.updateOne({ key: "store" }, { $unset: { [await sectionPath(section)]: 1, [`siteDraft.${section}`]: 1 } });
}

/* ───────────── Preview drafts ───────────── */

/** Store an unsaved section (or `theme`) for the owner's live preview. */
export async function saveSiteDraft(section: keyof SiteConfig | "theme", value: unknown) {
  if (section === "theme") {
    if (!isThemeId(value)) throw new Error("Unknown theme");
  } else {
    siteConfigSchema.shape[section].parse(value);
  }
  await connectDB();
  await Setting.updateOne({ key: "store" }, { $set: { [`siteDraft.${section}`]: value } }, { upsert: true });
}

export async function clearSiteDraft() {
  await connectDB();
  await Setting.updateOne({ key: "store" }, { $unset: { siteDraft: 1 } });
}
