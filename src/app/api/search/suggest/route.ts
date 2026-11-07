import { NextResponse, type NextRequest } from "next/server";
import { suggestProducts } from "@/services/catalog.service";
import { getSiteConfig } from "@/services/site-config.service";

/** Instant-search suggestions for the header search (public, read-only). */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  const { search } = await getSiteConfig();
  if (!search.instant || q.length < 2) return NextResponse.json({ products: [], categories: [] });
  const result = await suggestProducts(q, search.suggestionCount);
  return NextResponse.json(
    { products: result.products, categories: search.showCategoryMatches ? result.categories : [] },
    { headers: { "cache-control": "public, max-age=30" } },
  );
}
