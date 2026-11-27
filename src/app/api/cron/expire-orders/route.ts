import { NextResponse } from "next/server";
import { purgeArchivedProducts } from "@/services/admin/product-cleanup.service";
import { expireUnpaidOrders } from "@/services/order.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Schedule every 10 min (e.g. Vercel Cron) with `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const released = await expireUnpaidOrders();
  // Products archived 30+ days ago are deleted (photos, carts, favourites, reviews too).
  const deletedProducts = await purgeArchivedProducts().catch((e) => {
    console.error("[cron] purge archived products", e);
    return -1;
  });
  return NextResponse.json({ released, deletedProducts });
}
