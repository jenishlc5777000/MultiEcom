import localFont from "next/font/local";

/**
 * Fonts are bundled from npm packages (not fetched from Google at build time),
 * so builds and dev compiles work offline and on flaky networks.
 *
 * Each font exposes its own CSS variable; the active theme maps one onto
 * --font-display / --font-sans (src/config/themes.ts). Only Geist (the body
 * font of most themes) is preloaded. The others are declared but the browser
 * downloads a file only when the active theme actually uses it.
 */

export const instrument = localFont({
  src: [
    { path: "../../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-instrument", display: "swap", preload: false, fallback: ["Georgia", "serif"],
});

export const playfair = localFont({
  src: [
    { path: "../../node_modules/@fontsource/playfair-display/files/playfair-display-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/playfair-display/files/playfair-display-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../../node_modules/@fontsource/playfair-display/files/playfair-display-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-playfair", display: "swap", preload: false, fallback: ["Georgia", "serif"],
});

export const grotesk = localFont({
  src: [
    { path: "../../node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-grotesk", display: "swap", preload: false, fallback: ["system-ui", "sans-serif"],
});

export const dmSerif = localFont({
  src: [
    { path: "../../node_modules/@fontsource/dm-serif-display/files/dm-serif-display-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/dm-serif-display/files/dm-serif-display-latin-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-dmserif", display: "swap", preload: false, fallback: ["Georgia", "serif"],
});

export const syne = localFont({
  src: [
    { path: "../../node_modules/@fontsource/syne/files/syne-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../node_modules/@fontsource/syne/files/syne-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../../node_modules/@fontsource/syne/files/syne-latin-800-normal.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-syne", display: "swap", preload: false, fallback: ["system-ui", "sans-serif"],
});

export const outfit = localFont({
  src: [
    { path: "../../node_modules/@fontsource/outfit/files/outfit-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/outfit/files/outfit-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../node_modules/@fontsource/outfit/files/outfit-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../node_modules/@fontsource/outfit/files/outfit-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-outfit", display: "swap", preload: false, fallback: ["system-ui", "sans-serif"],
});

export const cormorant = localFont({
  src: [
    { path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2", weight: "500", style: "italic" },
    { path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-cormorant", display: "swap", preload: false, fallback: ["Georgia", "serif"],
});

export const fraunces = localFont({
  src: [
    { path: "../../node_modules/@fontsource/fraunces/files/fraunces-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/fraunces/files/fraunces-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../../node_modules/@fontsource/fraunces/files/fraunces-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-fraunces", display: "swap", preload: false, fallback: ["Georgia", "serif"],
});

export const zilla = localFont({
  src: [
    { path: "../../node_modules/@fontsource/zilla-slab/files/zilla-slab-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../node_modules/@fontsource/zilla-slab/files/zilla-slab-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../node_modules/@fontsource/zilla-slab/files/zilla-slab-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../../node_modules/@fontsource/zilla-slab/files/zilla-slab-latin-700-italic.woff2", weight: "700", style: "italic" },
  ],
  variable: "--font-zilla", display: "swap", preload: false, fallback: ["Georgia", "serif"],
});

export const geist = localFont({
  src: "../../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2",
  weight: "100 900",
  variable: "--font-geist", display: "swap", fallback: ["system-ui", "sans-serif"],
});

export const geistMono = localFont({
  src: "../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2",
  weight: "100 900",
  variable: "--font-geist-mono", display: "swap", preload: false, fallback: ["ui-monospace", "monospace"],
});

/** All font variables, for the <html> className. */
export const fontVariables = [instrument, playfair, grotesk, dmSerif, syne, outfit, cormorant, fraunces, zilla, geist, geistMono]
  .map((f) => f.variable)
  .join(" ");
