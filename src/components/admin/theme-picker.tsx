"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { categoryLabels, effectLabels, groupLabels, heroLabels, homeLabels, themes, type Theme, type ThemeGroup } from "@/config/themes";
import { cn } from "@/lib/utils";

const GROUPS: ThemeGroup[] = ["template", "landing", "shop", "special"];

/** Theme chooser for Admin → Settings: grouped tabs and a mini preview of each theme. */
export function ThemePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const current = themes.find((t) => t.id === value) ?? themes[0]!;
  const [tab, setTab] = useState<ThemeGroup | "all">(current.group);
  const shown = tab === "all" ? themes : themes.filter((t) => t.group === tab);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Theme kind">
        {(["all", ...GROUPS] as const).map((g) => {
          const count = g === "all" ? themes.length : themes.filter((t) => t.group === g).length;
          return (
            <button
              key={g}
              type="button"
              role="tab"
              aria-selected={tab === g}
              onClick={() => setTab(g)}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-pill border px-4 text-sm transition-colors",
                tab === g ? "border-ink bg-ink text-canvas" : "border-line hover:border-ink",
              )}
            >
              {g === "all" ? "All themes" : groupLabels[g].title}
              <span className={cn("rounded-pill px-1.5 text-xs tabular-nums", tab === g ? "bg-canvas/20" : "bg-surface")}>{count}</span>
            </button>
          );
        })}
      </div>
      {tab !== "all" && <p className="text-sm text-muted">{groupLabels[tab].hint}</p>}

      <div role="radiogroup" aria-label="Theme" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((t) => {
          const selected = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(t.id)}
              className={cn(
                "group relative overflow-hidden rounded-md border text-left transition-colors",
                selected ? "border-ink ring-2 ring-ink" : "border-line hover:border-muted",
              )}
            >
              <ThemePreview theme={t} />
              <div className="border-t border-line bg-paper p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{t.name}</span>
                  {selected ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium"><Check className="size-3.5" aria-hidden /> Selected</span>
                  ) : (
                    <span className="text-[11px] text-muted">{homeLabels[t.layout.home]}</span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted">{t.description}</p>
                <p className="mt-2 text-[11px] text-muted">{summary(t)}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function summary(t: Theme) {
  const parts: string[] = [t.fontLabel, t.dark ? "dark" : "light", ...(t.effect !== "none" ? [effectLabels[t.effect]] : [])];
  if (t.layout.home === "landing") parts.push(heroLabels[t.layout.hero], categoryLabels[t.layout.categories]);
  else if (t.layout.home === "shop") parts.push(categoryLabels[t.layout.categories], "full product grid");
  else parts.push(homeLabels[t.layout.home]);
  parts.push(`${t.layout.cards} cards`);
  return parts.join(" · ");
}

/** A tiny home page drawn in the theme's own colours, font, corners and layout. */
function ThemePreview({ theme: t }: { theme: Theme }) {
  const { canvas, surface, surfaceStrong, ink, accent, line } = t.colors;
  const r = `${Math.min(t.shape.lg, 14)}px`;
  const pill = `${Math.min(t.shape.pill, 999)}px`;
  const font = { fontFamily: t.type.display, fontWeight: t.type.weight, textTransform: t.type.upper ? ("uppercase" as const) : ("none" as const) };
  const title = (size = 16, color = ink) => (
    <span style={{ ...font, color, fontSize: t.type.upper ? size * 0.75 : size, lineHeight: 1.05 }}>
      Made <em style={{ color: accent }}>slowly</em>
    </span>
  );
  const button = (bg = ink, fg = canvas) => (
    <span className="inline-flex h-5 items-center px-2 text-[9px] font-semibold" style={{ background: bg, color: fg, borderRadius: pill }}>Shop</span>
  );
  const photo = (className: string, tint = accent) => (
    <span className={cn("block", className)} style={{ background: `linear-gradient(135deg, ${surfaceStrong}, ${tint}66)`, borderRadius: r }} />
  );
  const products = (n: number, cls = "h-8") => (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className={cn("block", cls)} style={{ background: surface, border: `1px solid ${line}`, borderRadius: Math.min(t.shape.md, 8) }} />
      ))}
    </div>
  );

  let body: React.ReactNode;
  switch (t.layout.home) {
    case "shop":
      body = (
        <div className="flex h-full flex-col gap-1.5">
          <div className="flex items-center justify-between px-2 py-1.5" style={{ background: ink, borderRadius: r }}>
            {title(11, canvas)}
            {button(canvas, ink)}
          </div>
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="block size-3.5" style={{ background: surfaceStrong, borderRadius: t.layout.categories === "circles" ? 999 : pill }} />
            ))}
          </div>
          {products(4, "h-6")}
          {products(4, "h-6")}
        </div>
      );
      break;
    case "lookbook":
      body = (
        <div className="flex h-full flex-col gap-1.5">
          <div className="flex justify-between border-y py-0.5 text-[7px]" style={{ borderColor: line, color: ink }}><span>LOOKBOOK</span><span>ISSUE 01</span></div>
          <div className="text-center">{title(14)}</div>
          <div className="grid flex-1 grid-cols-[3fr_2fr] gap-1.5">
            {photo("h-full")}
            <div className="flex flex-col justify-center gap-1">
              <span style={{ ...font, color: accent, fontSize: 16, fontStyle: "italic", lineHeight: 1 }}>01</span>
              {products(2, "h-5")}
            </div>
          </div>
        </div>
      );
      break;
    case "spotlight":
      body = (
        <div className="grid h-full grid-cols-[3fr_2fr] items-center gap-2">
          {photo("h-full")}
          <div className="space-y-1.5">
            <span className="block text-[7px]" style={{ color: accent }}>PIECE OF THE WEEK</span>
            {title(13)}
            <span className="block text-[11px]" style={{ ...font, color: ink }}>₹1,299</span>
            {button()}
          </div>
        </div>
      );
      break;
    case "bento":
      body = (
        <div className="grid h-full grid-cols-4 grid-rows-2 gap-1">
          <div className="col-span-2 row-span-2 flex flex-col justify-end gap-1 p-1.5" style={{ background: ink, borderRadius: r }}>
            {title(11, canvas)}
            {button(canvas, ink)}
          </div>
          <span className="block" style={{ background: accent, borderRadius: r }} />
          {photo("")}
          {photo("", surface)}
          <span className="block" style={{ background: surface, borderRadius: r }} />
        </div>
      );
      break;
    default:
      body = <LandingPreview t={t} title={title} button={button} photo={photo} products={products} />;
  }

  return (
    <div className="h-32 overflow-hidden p-3" style={{ background: canvas }}>
      {body}
    </div>
  );
}

type Parts = {
  t: Theme;
  title: (size?: number, color?: string) => React.ReactNode;
  button: (bg?: string, fg?: string) => React.ReactNode;
  photo: (className: string, tint?: string) => React.ReactNode;
  products: (n: number, cls?: string) => React.ReactNode;
};

function LandingPreview({ t, title, button, photo }: Parts) {
  const { ink } = t.colors;
  const r = `${Math.min(t.shape.lg, 14)}px`;
  switch (t.layout.hero) {
    case "centered":
      return (
        <div className="flex h-full flex-col items-center gap-1.5 text-center">
          {title(17)}
          {button()}
          {photo("w-full flex-1")}
        </div>
      );
    case "fullbleed":
      return (
        <div className="flex h-full items-end p-2" style={{ background: `linear-gradient(160deg, ${t.colors.accent}aa, #000000dd)`, borderRadius: r }}>
          <div className="space-y-1.5">
            {title(18, "#ffffff")}
            <div>{button("#ffffff", "#000000")}</div>
          </div>
        </div>
      );
    case "editorial":
      return (
        <div className="grid h-full grid-cols-2" style={{ border: `1px solid ${ink}` }}>
          {photo("h-full")}
          <div className="flex flex-col justify-between p-1.5" style={{ borderLeft: `1px solid ${ink}` }}>
            <span className="text-[7px]" style={{ color: ink }}>INDEX / 01</span>
            {title(13)}
            {button()}
          </div>
        </div>
      );
    case "minimal":
      return (
        <div className="flex h-full flex-col justify-between">
          <span className="text-[7px]" style={{ color: t.colors.muted }}>HANDMADE CERAMICS</span>
          <span style={{ fontFamily: t.type.display, fontWeight: t.type.weight, color: ink, fontSize: 26, lineHeight: 0.95 }}>Made slowly.</span>
          <div className="flex items-center justify-between border-t pt-1.5" style={{ borderColor: t.colors.line }}>
            {button()}
            <span className="text-[9px]" style={{ color: t.colors.muted }}>6 · 4 · 4</span>
          </div>
        </div>
      );
    case "collage":
      return (
        <div className="grid h-full grid-cols-2 items-center gap-2">
          <div className="space-y-2">
            {title(15)}
            {button()}
          </div>
          <div className="relative h-full">
            {photo("absolute left-0 top-0 h-[75%] w-[58%]")}
            {photo("absolute right-0 top-[8%] h-[45%] w-[38%]", t.colors.surface)}
            {photo("absolute bottom-0 right-[6%] h-[40%] w-[50%]")}
          </div>
        </div>
      );
    default:
      return (
        <div className="grid h-full grid-cols-2 items-center gap-2">
          <div className="space-y-2">
            {title(17)}
            {button()}
          </div>
          {photo("h-full")}
        </div>
      );
  }
}
