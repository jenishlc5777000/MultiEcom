import { NextResponse, type NextRequest } from "next/server";
import { getProductCardsByIds } from "@/services/merch.service";

/** Public product cards by id (favourites, recently viewed). Hidden products are skipped. */
export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get("ids") ?? "").split(",").filter((x) => /^[a-f0-9]{24}$/.test(x)).slice(0, 48);
  const products = ids.length ? await getProductCardsByIds(ids) : [];
  return NextResponse.json({ products }, { headers: { "cache-control": "public, max-age=60" } });
}
