"use client";

import { backdropLabels, effectLabels, type Theme } from "@/config/themes";
import type { SiteConfig } from "@/lib/site-config";
import { TypographyPanel } from "./typography-panel";
import { Choice, ColorField, Panel, RangeField, SaveBar, SwitchRow, useSection, withTheme } from "./shared";

export function StyleTab({ initial, theme }: { initial: SiteConfig["design"]; theme: Theme }) {
  const s = useSection("design", initial);
  const { colors, gradient: g, animation: a } = s.v;
  const setColors = (patch: Partial<typeof colors>) => s.set("colors", { ...colors, ...patch });
  const setGrad = (patch: Partial<typeof g>) => s.set("gradient", { ...g, ...patch });
  const setAnim = (patch: Partial<typeof a>) => s.set("animation", { ...a, ...patch });
  const t = theme.colors;
  const gradientCss = `linear-gradient(${g.angle}deg, ${g.from}, ${g.to})`;

  return (
    <div className="space-y-6">
      <Panel id="surface" title="Surface style" description="How cards, buttons and panels are drawn, and the page background. These change the whole feel of the store.">
        <Choice
          label="Effect"
          value={s.v.effect}
          onChange={(x) => s.set("effect", x)}
          columns={4}
          options={withTheme(effectLabels[theme.effect], [
            { value: "none", label: "Flat", hint: "Clean, no extra depth" },
            { value: "brutal", label: "Neubrutalism", hint: "Thick outlines, hard offset shadows" },
            { value: "glass", label: "Glassmorphism", hint: "Frosted, see-through panels" },
            { value: "soft", label: "Soft shadows", hint: "No borders, floating cards" },
            { value: "clay", label: "Claymorphism", hint: "Puffy with inner highlights" },
            { value: "neon", label: "Neon glow", hint: "Glowing accents, best on dark themes" },
            { value: "offset", label: "Offset frames", hint: "Solid tinted blocks behind photos" },
          ])}
        />
        <Choice
          label="Page background"
          value={s.v.background}
          onChange={(x) => s.set("background", x)}
          columns={6}
          options={withTheme(backdropLabels[theme.bg], [
            { value: "plain", label: "Plain" },
            { value: "mesh", label: "Gradient mesh", preview: <span className="block h-8 rounded-sm" style={{ background: `radial-gradient(circle at 20% 0%, ${theme.colors.accent}55, transparent 60%), radial-gradient(circle at 100% 30%, ${theme.colors.accentSoft}88, transparent 60%), ${theme.colors.canvas}` }} /> },
            { value: "grid", label: "Grid lines", preview: <span className="block h-8 rounded-sm" style={{ backgroundImage: `linear-gradient(${theme.colors.line} 1px, transparent 1px), linear-gradient(90deg, ${theme.colors.line} 1px, transparent 1px)`, backgroundSize: "10px 10px" }} /> },
            { value: "dots", label: "Dots", preview: <span className="block h-8 rounded-sm" style={{ backgroundImage: `radial-gradient(${theme.colors.ink}33 1px, transparent 1.2px)`, backgroundSize: "8px 8px" }} /> },
            { value: "grain", label: "Paper grain" },
          ])}
        />
      </Panel>

      <TypographyPanel design={s.v} theme={theme} set={s.set} />

      <Panel id="colours" title="Colours" description={`Override the colours of "${theme.name}". Leave a field empty to keep the theme's colour.`}>
        <SwitchRow label="Use my own colours" checked={colors.enabled} onChange={(x) => setColors({ enabled: x })} />
        {colors.enabled && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ColorField label="Page background" allowEmpty value={colors.canvas} placeholder={t.canvas} onChange={(x) => setColors({ canvas: x })} />
              <ColorField label="Panels & tiles" allowEmpty value={colors.surface} placeholder={t.surface} onChange={(x) => setColors({ surface: x })} />
              <ColorField label="Text & buttons" allowEmpty value={colors.ink} placeholder={t.ink} onChange={(x) => setColors({ ink: x })} />
              <ColorField label="Secondary text" allowEmpty value={colors.muted} placeholder={t.muted} onChange={(x) => setColors({ muted: x })} />
              <ColorField label="Accent" allowEmpty value={colors.accent} placeholder={t.accent} onChange={(x) => setColors({ accent: x })} />
            </div>
            <div className="flex overflow-hidden rounded-md border border-line text-xs" aria-hidden>
              {[colors.canvas || t.canvas, colors.surface || t.surface, colors.muted || t.muted, colors.accent || t.accent, colors.ink || t.ink].map((c, i) => (
                <span key={i} className="h-10 flex-1" style={{ background: c }} />
              ))}
            </div>
            <p className="text-xs text-muted">Keep enough contrast between the background and text colours so everything stays readable.</p>
          </>
        )}
      </Panel>

      <Panel id="gradient" title="Gradient" description="A two-colour brand gradient you can apply to buttons, the hero, headings and more.">
        <SwitchRow label="Use a brand gradient" checked={g.enabled} onChange={(x) => setGrad({ enabled: x })} />
        {g.enabled && (
          <>
            <div className="h-16 rounded-md border border-line" style={{ background: gradientCss }} aria-hidden />
            <div className="grid gap-4 sm:grid-cols-3">
              <ColorField label="From" value={g.from} onChange={(x) => setGrad({ from: x })} />
              <ColorField label="To" value={g.to} onChange={(x) => setGrad({ to: x })} />
              <RangeField label="Direction" value={g.angle} min={0} max={360} step={5} unit="°" onChange={(x) => setGrad({ angle: x })} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <SwitchRow label="Main buttons" checked={g.buttons} onChange={(x) => setGrad({ buttons: x })} />
              <SwitchRow label="Hero background wash" checked={g.hero} onChange={(x) => setGrad({ hero: x })} />
              <SwitchRow label="Highlighted words in headings" hint="Words in *asterisks*" checked={g.headings} onChange={(x) => setGrad({ headings: x })} />
              <SwitchRow label="Announcement bar" checked={g.announcement} onChange={(x) => setGrad({ announcement: x })} />
              <SwitchRow label="Dark panels" hint="Closing call to action, promo strip, bento intro" checked={g.panels} onChange={(x) => setGrad({ panels: x })} />
              <SwitchRow label="Footer" checked={g.footer} onChange={(x) => setGrad({ footer: x })} />
            </div>
          </>
        )}
      </Panel>

      <Panel id="animations" title="Animations" description="Visitors who ask their device for reduced motion always get the calm version.">
        <Choice
          label="Amount of motion"
          value={a.level}
          onChange={(x) => setAnim({ level: x })}
          options={[
            { value: "full", label: "Full", hint: "Reveals, floating cards, spinning badge, ticker" },
            { value: "subtle", label: "Subtle", hint: "Gentle fades only, nothing loops" },
            { value: "none", label: "None", hint: "Everything appears instantly" },
          ]}
        />
        <Choice
          label="How sections appear while scrolling"
          value={a.reveal}
          onChange={(x) => setAnim({ reveal: x })}
          columns={4}
          options={[
            { value: "fade-up", label: "Fade up" },
            { value: "fade", label: "Fade in" },
            { value: "zoom", label: "Zoom in" },
            { value: "slide", label: "Slide in" },
          ]}
        />
        <Choice
          label="Ticker speed"
          value={a.marqueeSpeed}
          onChange={(x) => setAnim({ marqueeSpeed: x })}
          options={[
            { value: "slow", label: "Slow" },
            { value: "normal", label: "Normal" },
            { value: "fast", label: "Fast" },
          ]}
        />
        <SwitchRow label="Zoom photos on hover" checked={a.hoverZoom} onChange={(x) => setAnim({ hoverZoom: x })} />
      </Panel>

      <SaveBar {...s} />
    </div>
  );
}
