import { ImageResponse } from "next/og";

/**
 * Generated placeholder app icons (ink tile, canvas monogram). Replace with
 * PNGs exported from the real logo in /public/icons and update manifest.ts.
 */
const ICONS = {
  "180": { size: 180, maskable: false },
  "192": { size: 192, maskable: false },
  "512": { size: 512, maskable: false },
  "maskable-512": { size: 512, maskable: true }, // full-bleed, content inside the safe zone
} as const;
type IconKey = keyof typeof ICONS;

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(ICONS).map((size) => ({ size }));
}

export async function GET(_: Request, { params }: { params: Promise<{ size: string }> }) {
  const key = (await params).size;
  if (!(key in ICONS)) return new Response("Not found", { status: 404 });
  const { size, maskable } = ICONS[key as IconKey];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1A1917",
          borderRadius: maskable ? 0 : size * 0.2,
          color: "#F6F4F0",
          fontSize: size * (maskable ? 0.3 : 0.4),
          fontFamily: "Georgia, serif",
          fontWeight: 700,
        }}
      >
        C&amp;G
      </div>
    ),
    { width: size, height: size },
  );
}
