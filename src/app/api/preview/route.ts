import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { safeCallbackUrl } from "@/lib/safe-redirect";
import { PREVIEW_COOKIE } from "@/services/preview.service";

/**
 * /api/preview?mode=on&to=/category  → owner-only: turn on draft preview, then go to `to`.
 * /api/preview?mode=off&to=/         → turn it off.
 * The dashboard's preview pane loads this in an iframe.
 */
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("mode");
  const to = safeCallbackUrl(req.nextUrl.searchParams.get("to"), "/");
  const res = NextResponse.redirect(new URL(to, req.nextUrl.origin));

  if (mode === "off") {
    res.cookies.delete(PREVIEW_COOKIE);
    return res;
  }

  const user = await getCurrentUser();
  if (user?.role !== "owner") return NextResponse.json({ error: "Owner access needed" }, { status: 403 });

  res.cookies.set(PREVIEW_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: req.nextUrl.protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 3,
  });
  return res;
}
