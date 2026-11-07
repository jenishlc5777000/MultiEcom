import "server-only";
import { isThemeId } from "@/config/themes";
import { connectDB } from "@/lib/db/connect";
import { isPerTheme, parseSiteConfig, siteConfigSchema, type SiteConfig } from "@/lib/site-config";
import { Setting } from "@/models";

/**
 * Studio drafts: inline text edits from the preview and "Publish all".
 * Kept separate from site-config.service (no request/auth imports), so it
 * only touches the database.
 */
type Stored = { site?: unknown; siteDraft?: Record<string, unknown> } | null;

/* ───────────── Inline text edits & publishing ───────────── */

const FIELD = /^[a-zA-Z]{1,40}$/;

/**
 * Apply one text edit made directly in the Studio preview to the draft.
 * Paths: "builder:<sectionId>.<field>", "builder:<sectionId>.items.<i>.<field>",
 * "content:<group>.<field>". Only existing text fields can change; the whole
 * section is re-validated before it is stored. Returns the updated section.
 */
export async function applyTextEdit(path: string, value: string) {
  const m = /^(builder|content):(.+)$/.exec(path);
  if (!m) throw new Error("Unknown field");
  const section = m[1] as "builder" | "content";
  const parts = m[2]!.split(".");
  await connectDB();
  const doc = await Setting.findOne({ key: "store" }).select("site siteDraft").lean<Stored>();
  const saved = parseSiteConfig(doc?.site)[section];
  const draftRaw = doc?.siteDraft?.[section];
  const draft = draftRaw ? siteConfigSchema.shape[section].safeParse(draftRaw) : null;
  const current = structuredClone(draft?.success ? draft.data : saved) as Record<string, unknown>;

  let target: Record<string, unknown> | undefined;
  let field: string;
  if (section === "builder") {
    const [id, ...rest] = parts;
    const list = (current.sections as Record<string, unknown>[]) ?? [];
    target = list.find((x) => x.id === id);
    if (rest.length === 3 && rest[0] === "items" && /^\d{1,2}$/.test(rest[1]!)) {
      target = (target?.items as Record<string, unknown>[] | undefined)?.[Number(rest[1])];
      field = rest[2]!;
    } else if (rest.length === 1) field = rest[0]!;
    else throw new Error("Unknown field");
  } else {
    if (parts.length !== 2) throw new Error("Unknown field");
    target = current[parts[0]!] as Record<string, unknown> | undefined;
    field = parts[1]!;
  }
  // Only existing text fields; a section's id and type are never editable this way.
  if (!target || !FIELD.test(field) || field === "id" || field === "type" || typeof target[field] !== "string") throw new Error("That text can't be edited here.");
  target[field] = value;

  const parsed = siteConfigSchema.shape[section].parse(current);
  await Setting.updateOne({ key: "store" }, { $set: { [`siteDraft.${section}`]: parsed } }, { upsert: true });
  return { section, value: parsed };
}

/** Publish every draft change (all sections + theme) at once. */
export async function publishSiteDraft() {
  await connectDB();
  const doc = await Setting.findOne({ key: "store" }).select("siteDraft theme").lean<Stored & { theme?: string }>();
  const draft = doc?.siteDraft ?? {};
  // design/cards drafts belong to the theme being previewed (or the live one).
  const themeFor = isThemeId(draft.theme) ? draft.theme : doc?.theme;
  const $set: Record<string, unknown> = {};
  let count = 0;
  for (const [key, raw] of Object.entries(draft)) {
    if (key === "theme") {
      if (isThemeId(raw)) { $set.theme = raw; count++; }
      continue;
    }
    if (!(key in siteConfigSchema.shape)) continue;
    const r = siteConfigSchema.shape[key as keyof SiteConfig].safeParse(raw);
    if (!r.success) continue;
    const path = isPerTheme(key) && isThemeId(themeFor) ? `site.perTheme.${themeFor}.${key}` : `site.${key}`;
    $set[path] = r.data;
    count++;
  }
  await Setting.updateOne({ key: "store" }, { ...(count ? { $set } : {}), $unset: { siteDraft: 1 } });
  return count;
}

/** Whether there are unpublished draft changes. */
export async function hasSiteDraft() {
  await connectDB();
  const doc = await Setting.findOne({ key: "store" }).select("siteDraft").lean<Stored>();
  return Boolean(doc?.siteDraft && Object.keys(doc.siteDraft).length);
}
