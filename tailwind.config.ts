import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

/** "Stone & Ink" design system. Values and roles are documented in DESIGN.md. */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    // Fluid container capped at 1360px. Gutters (20px → 40px from md) are set in
    // globals.css because container padding only follows container.screens.
    container: { center: true, padding: "1.25rem", screens: { "2xl": "1360px" } },
    extend: {
      colors: {
        canvas: token("canvas"),
        surface: { DEFAULT: token("surface"), strong: token("surface-strong") },
        line: token("line"),
        ink: token("ink"),
        muted: token("muted"),
        accent: { DEFAULT: token("accent"), soft: token("accent-soft") },
        ready: { DEFAULT: token("ready"), soft: token("ready-soft") },
        mto: token("mto"),
        sold: token("sold"),
        danger: token("danger"),
        paper: token("paper"),
        "on-accent": token("on-accent"),
        // shadcn/ui semantic aliases
        background: token("canvas"),
        foreground: token("ink"),
        primary: { DEFAULT: token("ink"), foreground: token("canvas") },
        secondary: { DEFAULT: token("surface"), foreground: token("ink") },
        destructive: { DEFAULT: token("danger"), foreground: token("on-accent") },
        border: token("line"),
        input: token("line"),
        ring: token("ink"),
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Sizes and tracking follow the theme's --display-scale / --tracking-shift (globals.css).
        display: ["calc(clamp(3rem, 8vw, 7rem) * var(--display-scale, 1))", { lineHeight: "0.95", letterSpacing: "calc(-0.02em + var(--tracking-shift, 0em))" }],
        h1: ["calc(clamp(2.5rem, 5vw, 4rem) * var(--display-scale, 1))", { lineHeight: "1", letterSpacing: "calc(-0.015em + var(--tracking-shift, 0em))" }],
        h2: ["calc(clamp(2rem, 3.6vw, 3rem) * var(--display-scale, 1))", { lineHeight: "1.05", letterSpacing: "calc(-0.01em + var(--tracking-shift, 0em))" }],
        h3: ["1.5rem", { lineHeight: "1.2" }],
        eyebrow: ["0.75rem", { lineHeight: "1.4", letterSpacing: "var(--eyebrow-tracking, 0.14em)", fontWeight: "600" }],
      },
      // Corner shapes follow the theme (globals.css); `pill` is for buttons and chips.
      borderRadius: { sm: "var(--r-sm)", md: "var(--r-md)", lg: "var(--r-lg)", pill: "var(--r-pill)" },
      boxShadow: { float: "0 12px 40px -12px rgb(26 25 23 / 0.18)" },
      spacing: { touch: "44px" },
      minHeight: { touch: "44px" },
      minWidth: { touch: "44px" },
      transitionTimingFunction: { out: "cubic-bezier(.2,.7,.2,1)" },
      keyframes: {
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        "rise-in": { from: { transform: "translateY(105%)" }, to: { transform: "translateY(0)" } },
        "fade-up": { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "none" } },
        "zoom-out": { from: { transform: "scale(1.08)" }, to: { transform: "scale(1)" } },
        "clip-up": { from: { clipPath: "inset(100% 0 0 0 round var(--r-lg))" }, to: { clipPath: "inset(0 0 0 0 round var(--r-lg))" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        "scroll-line": { "0%": { transform: "scaleY(0)", transformOrigin: "top" }, "50%": { transform: "scaleY(1)", transformOrigin: "top" }, "50.1%": { transformOrigin: "bottom" }, "100%": { transform: "scaleY(0)", transformOrigin: "bottom" } },
      },
      animation: {
        marquee: "marquee var(--marquee-duration, 40s) linear infinite",
        "rise-in": "rise-in 1s cubic-bezier(.2,.7,.2,1) both",
        "fade-up": "fade-up .8s cubic-bezier(.2,.7,.2,1) both",
        "zoom-out": "zoom-out 1.8s cubic-bezier(.2,.7,.2,1) both",
        "clip-up": "clip-up 1.2s cubic-bezier(.7,0,.2,1) both",
        float: "float 6s ease-in-out infinite",
        "spin-slow": "spin 20s linear infinite",
        "scroll-line": "scroll-line 2.2s cubic-bezier(.7,0,.2,1) infinite",
      },
    },
  },
  plugins: [animate],
};

export default config;
