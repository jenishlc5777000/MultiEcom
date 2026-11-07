import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { connectDB } from "@/lib/db/connect";
import { parseSiteConfig, scopeToTheme } from "@/lib/site-config";
import { SITE_SECTIONS, storeSettingsSchema, THEME_FILE_FORMAT, type ExportScope } from "@/lib/theme-file";
import { Setting } from "@/models";

/**
 * Owner-only download (never credentials):
 *   ?scope=theme → the look: theme, colours/fonts, cards, header, logo, footer, page layouts
 *   ?scope=all   → everything in Studio + every theme's customisations + store settings
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (user?.role !== "owner") return NextResponse.json({ error: "Owner access needed" }, { status: 403 });
  const scope: ExportScope = req.nextUrl.searchParams.get("scope") === "theme" ? "theme" : "all";

  await connectDB();
  const s = await Setting.findOne({ key: "store" }).lean<Record<string, unknown> & { theme?: string; site?: unknown }>();
  const theme = s?.theme ?? "stone";
  // design/cards as they apply to this theme (its own customisations).
  const site = scopeToTheme(parseSiteConfig(s?.site), theme);
  const picked = Object.fromEntries(SITE_SECTIONS[scope].map((k) => [k, site[k]]));
  const store = scope === "all" ? storeSettingsSchema.safeParse(s ?? {}).data : undefined;

  const body = { format: THEME_FILE_FORMAT, version: 2, scope, exportedAt: new Date().toISOString(), theme, site: picked, ...(store ? { store } : {}) };
  const date = new Date().toISOString().slice(0, 10);
  const name = scope === "theme" ? `theme-${theme}-${date}.json` : `store-full-export-${date}.json`;
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${name}"`,
      "cache-control": "no-store",
    },
  });
}
