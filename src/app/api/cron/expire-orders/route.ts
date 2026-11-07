import { NextResponse } from "next/server";
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
  return NextResponse.json({ released });
}
