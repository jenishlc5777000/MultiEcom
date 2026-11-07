import { z } from "zod";

/** Query-string filters shared by category, search and shop pages (all optional, never trusted). */
const num = z.coerce.number().min(0).max(10_000_000).optional().catch(undefined);
export const browseParams = z.object({
  page: z.coerce.number().int().min(1).max(1000).catch(1).default(1),
  availability: z.enum(["READY_STOCK", "MADE_TO_ORDER"]).optional().catch(undefined),
  min: num,
  max: num,
  sort: z.enum(["relevance", "new", "price-asc", "price-desc", "rating"]).optional().catch(undefined),
  cat: z.string().trim().max(80).regex(/^[a-z0-9-]*$/).optional().catch(undefined),
  q: z.string().trim().max(80).optional().catch(undefined),
});
export type BrowseParams = z.infer<typeof browseParams>;

/** Back to strings for the filter form's default values. */
export const filterValues = (p: BrowseParams) => ({
  availability: p.availability ?? "",
  min: p.min !== undefined ? String(p.min) : "",
  max: p.max !== undefined ? String(p.max) : "",
  sort: p.sort ?? "",
  cat: p.cat ?? "",
});

/** Rebuild a page link keeping the current filters. */
export function withParams(path: string, p: BrowseParams, patch: Partial<Record<keyof BrowseParams, string | number | undefined>> = {}) {
  const sp = new URLSearchParams();
  const merged = { ...p, ...patch } as Record<string, unknown>;
  for (const [k, v] of Object.entries(merged)) {
    if (v === undefined || v === "" || (k === "page" && Number(v) === 1)) continue;
    sp.set(k, String(v));
  }
  const q = sp.toString();
  return q ? `${path}?${q}` : path;
}
