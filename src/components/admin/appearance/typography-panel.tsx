"use client";

import { FONTS, FONT_KEYS, type Theme } from "@/config/themes";
import type { SiteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { Choice, Panel, RangeField, withTheme } from "./shared";

type Design = SiteConfig["design"];

/** Fonts, heading style and corner shapes on top of the theme. */
export function TypographyPanel({ design, theme, set }: { design: Design; theme: Theme; set: <K extends keyof Design>(k: K, v: Design[K]) => void }) {
  const ty = design.typography;
  const sh = design.shape;
  const setTy = (patch: Partial<typeof ty>) => set("typography", { ...ty, ...patch });
  const setSh = (patch: Partial<typeof sh>) => set("shape", { ...sh, ...patch });
  const displayCss = ty.display === "theme" ? theme.type.display : FONTS[ty.display].css;
  const upper = ty.capitals === "theme" ? theme.type.upper : ty.capitals === "on";

  const fontPicker = (label: string, value: typeof ty.display, onChange: (v: typeof ty.display) => void, themeFont: string) => (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {(["theme", ...FONT_KEYS] as const).map((k) => {
          const on = value === k;
          const css = k === "theme" ? themeFont : FONTS[k].css;
          return (
            <button key={k} type="button" role="radio" aria-checked={on} onClick={() => onChange(k)} className={cn("rounded-md border p-3 text-left transition-colors", on ? "border-ink ring-1 ring-ink" : "border-line hover:border-muted")}>
              <span className="block truncate text-2xl leading-tight" style={{ fontFamily: css }}>Aa Clay</span>
              <span className="mt-1 block truncate text-xs text-muted">{k === "theme" ? "Theme font" : FONTS[k].label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );

  return (
    <Panel id="typography" title="Typography & shapes" description={`Change any part of "${theme.name}": fonts, heading style, sizes and corners. Anything left on "Theme" keeps the theme's own.`}>
      {/* Live sample */}
      <div className="rounded-md border border-line bg-canvas p-5">
        <p
          className="leading-none"
          style={{
            fontFamily: displayCss,
            fontWeight: ty.weight >= 100 ? ty.weight : theme.type.weight,
            textTransform: upper ? "uppercase" : "none",
            fontSize: `${Math.round(40 * ((ty.scale || 100) / 100))}px`,
          }}
        >
          Made <em className="text-accent">slowly</em>
        </p>
        <p className="mt-3 text-muted" style={{ fontFamily: ty.body === "theme" ? theme.type.sans : FONTS[ty.body].css, fontSize: ty.bodySize || 16 }}>
          Mugs, bowls and planters, thrown and glazed by hand.
        </p>
        <div className="mt-4 flex gap-2">
          <span className="inline-flex h-9 items-center bg-ink px-4 text-sm text-canvas" style={{ borderRadius: sh.buttons === "theme" ? theme.shape.pill : sh.buttons === "pill" ? 999 : sh.buttons === "rounded" ? 10 : 0 }}>Shop now</span>
          <span className="inline-block h-9 w-16 bg-surface-strong" style={{ borderRadius: sh.large >= 0 ? sh.large : theme.shape.lg }} />
        </div>
      </div>

      {fontPicker("Heading font", ty.display, (x) => setTy({ display: x }), theme.type.display)}
      {fontPicker("Body font", ty.body, (x) => setTy({ body: x }), theme.type.sans)}

      <div className="grid gap-5 sm:grid-cols-2">
        <RangeField label="Heading weight" value={ty.weight} min={-1} max={900} step={100} onChange={(x) => setTy({ weight: x < 100 ? -1 : x })} format={(x) => (x < 100 ? `Theme (${theme.type.weight})` : String(x))} />
        <RangeField label="Heading size" value={ty.scale} min={0} max={160} step={5} onChange={(x) => setTy({ scale: x < 50 ? 0 : x })} format={(x) => (x < 50 ? "Theme" : `${x}%`)} />
        <RangeField label="Body text size" value={ty.bodySize} min={0} max={20} onChange={(x) => setTy({ bodySize: x < 13 ? 0 : x })} format={(x) => (x < 13 ? "Default (16px)" : `${x}px`)} />
      </div>
      <Choice
        label="Highlighted words (*like this*)"
        value={ty.emphasis}
        onChange={(x) => setTy({ emphasis: x })}
        columns={4}
        options={withTheme(theme.type.em === "marker" ? "Marker" : theme.type.em === "accent" ? "Accent colour" : "Italic", [
          { value: "italic", label: "Italic" },
          { value: "accent", label: "Accent colour" },
          { value: "marker", label: "Marker highlight" },
        ])}
      />
      <Choice
        label="Numbered section labels (N°01 — …)"
        value={design.chrome}
        onChange={(x) => set("chrome", x)}
        options={withTheme(theme.chrome === "numbered" ? "On" : "Off", [{ value: "numbered", label: "On" }, { value: "none", label: "Off" }])}
      />
      <Choice label="Headings in capitals" value={ty.capitals} onChange={(x) => setTy({ capitals: x })} options={withTheme(theme.type.upper ? "Capitals" : "Normal case", [{ value: "on", label: "CAPITALS" }, { value: "off", label: "Normal case" }])} />

      <div className="grid gap-5 sm:grid-cols-3">
        <RangeField label="Small corners" hint="Thumbnails, inputs" value={sh.small} min={-1} max={40} onChange={(x) => setSh({ small: x })} format={(x) => (x < 0 ? `Theme (${theme.shape.sm}px)` : `${x}px`)} />
        <RangeField label="Medium corners" hint="Cards, popovers" value={sh.medium} min={-1} max={48} onChange={(x) => setSh({ medium: x })} format={(x) => (x < 0 ? `Theme (${theme.shape.md}px)` : `${x}px`)} />
        <RangeField label="Large corners" hint="Tiles, hero photo" value={sh.large} min={-1} max={64} onChange={(x) => setSh({ large: x })} format={(x) => (x < 0 ? `Theme (${theme.shape.lg}px)` : `${x}px`)} />
      </div>
      <Choice
        label="Button shape"
        value={sh.buttons}
        onChange={(x) => setSh({ buttons: x })}
        columns={4}
        options={withTheme(theme.shape.pill >= 999 ? "Pill" : `${theme.shape.pill}px`, [
          { value: "pill", label: "Pill" },
          { value: "rounded", label: "Rounded" },
          { value: "square", label: "Square" },
        ])}
      />
    </Panel>
  );
}
