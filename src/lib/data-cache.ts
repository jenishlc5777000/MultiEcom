import "server-only";
import { unstable_cache } from "next/cache";

/**
 * Shared data cache (Vercel Data Cache in production) for reads every page
 * needs: store settings, theme, Studio design, categories, home-page lists.
 * Admin saves clear it straight away (see ownerAction → revalidateTag); the
 * TTL is a safety net for changes made outside the dashboard (e.g. orders
 * changing stock, scripts).
 */
export const CACHE_TAGS = { settings: "store-settings", catalog: "store-catalog" } as const;
const TTL_SECONDS = 120;

export function sharedCache<A extends unknown[], R>(fn: (...args: A) => Promise<R>, key: string, tag: keyof typeof CACHE_TAGS) {
  return unstable_cache(fn, [key], { tags: [CACHE_TAGS[tag]], revalidate: TTL_SECONDS });
}
