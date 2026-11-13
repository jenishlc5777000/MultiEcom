"use client";

import type { Theme } from "@/config/themes";
import type { SiteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { usePreviewOpen } from "./preview";
import { Choice, Panel, RangeField, SaveBar, SwitchRow, useSection, withTheme } from "./shared";

export function CardsTab({ initial, theme }: { initial: SiteConfig["cards"]; theme: Theme }) {
  const s = useSection("cards", initial);
  const c = s.v;
  const live = usePreviewOpen();
  const radius = c.radius >= 0 ? c.radius : theme.shape.lg;
  const aspect = c.aspect === "theme" ? "4 / 5" : c.aspect.replace("/", " / ");

  return (
    <div className={cn("grid gap-6", !live && "xl:grid-cols-[1fr_300px]")}>
      <div className="space-y-6">
        <Panel id="cards" title="Card style" description="How product cards look everywhere in the shop.">
          <Choice
            label="Style"
            value={c.style}
            onChange={(x) => s.set("style", x)}
            columns={3}
            options={withTheme(theme.layout.cards, [
              { value: "classic", label: "Classic", hint: "Photo, name and price below" },
              { value: "framed", label: "Framed", hint: "White card with a border" },
              { value: "square", label: "Square", hint: "Square photo, outlined" },
              { value: "minimal", label: "Minimal", hint: "Centred text, no corners" },
              { value: "overlay", label: "Overlay", hint: "Name and price on the photo" },
              { value: "numbered", label: "Numbered", hint: "01, 02… badges, accent prices" },
              { value: "listing", label: "Listing", hint: "Price on the photo, button strip" },
            ])}
          />
          <Choice
            label="Photo shape (height)"
            value={c.aspect}
            onChange={(x) => s.set("aspect", x)}
            columns={6}
            options={[
              { value: "theme", label: "Theme" },
              { value: "4/5", label: "Portrait 4:5" },
              { value: "3/4", label: "Portrait 3:4" },
              { value: "2/3", label: "Tall 2:3" },
              { value: "1/1", label: "Square" },
              { value: "4/3", label: "Landscape 4:3" },
              { value: "16/9", label: "Wide 16:9" },
            ]}
          />
          <RangeField label="Corner roundness" value={c.radius} min={-1} max={48} onChange={(x) => s.set("radius", x)} format={(x) => (x < 0 ? "Theme" : `${x}px`)} />
        </Panel>

        <Panel id="card-grid" title="Grid & size">
          <div className="grid gap-5 sm:grid-cols-2">
            <RangeField label="Cards per row (desktop)" value={c.columns} min={2} max={6} unit="" onChange={(x) => s.set("columns", x)} />
            <RangeField label="Cards per row (phone)" value={c.columnsMobile} min={1} max={2} unit="" onChange={(x) => s.set("columnsMobile", x)} />
            <RangeField label="Space between cards" value={c.gap} min={8} max={48} onChange={(x) => s.set("gap", x)} />
            <RangeField label="Maximum card width" value={c.maxWidth} min={0} max={480} step={10} onChange={(x) => s.set("maxWidth", x)} format={(x) => (x === 0 ? "Fill column" : `${x}px`)} />
          </div>
        </Panel>

        <Panel id="card-text" title="Text">
          <div className="grid gap-5 sm:grid-cols-2">
            <RangeField label="Product name size" value={c.titleSize} min={12} max={24} onChange={(x) => s.set("titleSize", x)} />
            <RangeField label="Price size" value={c.priceSize} min={12} max={24} onChange={(x) => s.set("priceSize", x)} />
          </div>
          <Choice label="Text alignment" value={c.textAlign} onChange={(x) => s.set("textAlign", x)} columns={2} options={[{ value: "left", label: "Left" }, { value: "center", label: "Centred" }]} />
        </Panel>

        <Panel id="card-content" title="What cards show">
          <div className="grid gap-2 sm:grid-cols-2">
            <SwitchRow label="Glaze colour dots" checked={c.showSwatches} onChange={(x) => s.set("showSwatches", x)} />
            <SwitchRow label="Star rating" checked={c.showRating} onChange={(x) => s.set("showRating", x)} />
            <SwitchRow label="Badges" hint="Ready to ship, made to order, one of a kind" checked={c.showBadges} onChange={(x) => s.set("showBadges", x)} />
            {c.showBadges && <SwitchRow label="Badges on phones too" hint="Off: hidden on small screens so they don't cover the photo" checked={c.badgesOnPhone} onChange={(x) => s.set("badgesOnPhone", x)} />}
            <SwitchRow label="Arrow button on hover" checked={c.showArrow} onChange={(x) => s.set("showArrow", x)} />
          </div>
          <Choice
            label="Hover effect"
            value={c.hover}
            onChange={(x) => s.set("hover", x)}
            columns={4}
            options={[
              { value: "zoom", label: "Zoom photo" },
              { value: "swap", label: "Show 2nd photo", hint: "When the product has one" },
              { value: "lift", label: "Lift card" },
              { value: "none", label: "None" },
            ]}
          />
        </Panel>
        <SaveBar {...s} />
      </div>

      {/* Live preview */}
      <aside className={cn("xl:sticky xl:top-6 xl:self-start", live && "hidden")}>
        <p className="mb-2 text-sm font-medium">Preview</p>
        <div className="rounded-lg border border-line bg-canvas p-4">
          <div className={cn(c.style === "framed" && "border border-line bg-paper p-2.5")} style={{ maxWidth: c.maxWidth || undefined, borderRadius: c.style === "framed" ? radius + 6 : undefined }}>
            <div className="relative overflow-hidden bg-gradient-to-br from-surface-strong to-accent/30" style={{ aspectRatio: c.style === "square" ? "1 / 1" : aspect, borderRadius: c.style === "minimal" ? 0 : radius }}>
              {c.showBadges && <span className="absolute left-2 top-2 rounded-pill bg-canvas/90 px-2 py-0.5 text-[11px]">Ready to ship</span>}
              {c.style === "overlay" && (
                <span className="absolute inset-x-2 bottom-2 rounded-md bg-paper/90 p-2 text-xs">
                  <span className="block font-medium" style={{ fontSize: c.titleSize }}>Speckled Mug</span>
                  <span style={{ fontSize: c.priceSize }}>₹1,299</span>
                </span>
              )}
            </div>
            {c.style !== "overlay" && (
              <div className={cn("mt-3 space-y-1", (c.textAlign === "center" || c.style === "minimal") && "text-center")}>
                <p className="font-medium" style={{ fontSize: c.titleSize }}>Speckled Mug</p>
                <p className="tabular-nums" style={{ fontSize: c.priceSize }}>₹1,299</p>
                <p className={cn("flex items-center gap-1.5 text-xs text-muted", (c.textAlign === "center" || c.style === "minimal") && "justify-center")}>
                  {c.showSwatches && <><span className="size-3 rounded-full bg-[#9DBFA9]" /><span className="size-3 rounded-full bg-[#B4441C]" /></>}
                  {c.showRating && <span>★ 4.8</span>}
                </p>
              </div>
            )}
          </div>
          <p className="mt-4 text-xs text-muted">{c.columns} per row on desktop, {c.columnsMobile} on phones.</p>
        </div>
      </aside>
    </div>
  );
}
