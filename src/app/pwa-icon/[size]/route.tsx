import { ImageResponse } from "next/og";
import { getActiveTheme } from "@/services/store.service";
import { getSiteConfig } from "@/services/site-config.service";

/**
 * Favicon and app icons, from Admin → Studio → Header → Logo → "Browser tab icon":
 *   generated = initials on a tile in the theme colours;
 *   logo / upload = that picture on a square (PNG, JPG or SVG; other formats fall back to the tile).
 */
const ICONS = {
  "32": { size: 32, maskable: false },
  "180": { size: 180, maskable: false },
  "192": { size: 192, maskable: false },
  "512": { size: 512, maskable: false },
  "maskable-512": { size: 512, maskable: true }, // full-bleed, content inside the safe zone
} as const;
type IconKey = keyof typeof ICONS;

export const dynamic = "force-dynamic";

const DRAWABLE = ["image/png", "image/jpeg", "image/svg+xml"];

/** The picture as a data URI (so the icon renderer can draw it), or null if it can't be used. */
async function pictureData(url: string, origin: string) {
  try {
    const res = await fetch(new URL(url, origin), { cache: "force-cache", next: { revalidate: 3600 } });
    const type = (res.headers.get("content-type") ?? "").split(";")[0]!.trim();
    if (!res.ok || !DRAWABLE.includes(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 3_000_000) return null;
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ size: string }> }) {
  const key = (await params).size;
  if (!(key in ICONS)) return new Response("Not found", { status: 404 });
  const { size, maskable } = ICONS[key as IconKey];
  const [site, theme] = await Promise.all([getSiteConfig(), getActiveTheme()]);
  const logo = site.logo;

  const picture = logo.faviconSource === "upload" ? logo.favicon : logo.faviconSource === "logo" ? logo.image : null;
  const data = picture ? await pictureData(picture.url, new URL(req.url).origin) : null;
  const bg = logo.faviconBg === "transparent" ? "transparent" : logo.faviconBg === "white" ? "#FFFFFF" : theme.colors.ink;
  const fg = logo.faviconBg === "theme" ? theme.colors.canvas : theme.colors.ink;
  const letters = (logo.mark || [logo.textBefore, logo.textAfter].filter(Boolean).map((w) => w[0]).join("&") || "S").slice(0, 3);
  // Small favicons: no rounding so the picture uses every pixel.
  const radius = maskable || size <= 32 || bg === "transparent" ? 0 : size * 0.2;
  const pad = maskable ? size * 0.18 : size <= 32 ? 0 : size * (logo.faviconPadding / 100);

  const res = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: bg, borderRadius: radius, padding: pad }}>
        {data ? (
          // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
          <img src={data} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <span style={{ color: bg === "transparent" ? theme.colors.ink : fg, fontSize: size * (letters.length > 2 ? 0.34 : 0.46), fontFamily: "Georgia, serif", fontWeight: 700 }}>{letters}</span>
        )}
      </div>
    ),
    { width: size, height: size },
  );
  res.headers.set("cache-control", "public, max-age=300, s-maxage=300, stale-while-revalidate=86400");
  return res;
}
