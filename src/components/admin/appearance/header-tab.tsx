"use client";

import Image from "next/image";
import { Monogram, Wordmark } from "@/components/layout/logo";
import type { SiteConfig } from "@/lib/site-config";
import { Field, TextInput } from "../form";
import { ImageUploader } from "../image-uploader";
import { Choice, Panel, RangeField, SaveBar, SwitchRow, useSection } from "./shared";

const line = "block h-1 rounded-sm bg-ink/50";
const HEADER_PREVIEW: Record<string, React.ReactNode> = {
  classic: <span className="flex h-6 items-center justify-between rounded-sm border border-line px-1.5"><span className={`${line} w-6`} /><span className="flex gap-1"><span className={`${line} w-3`} /><span className={`${line} w-3`} /></span><span className="block h-2.5 w-4 rounded-sm bg-ink/70" /></span>,
  centered: <span className="grid h-6 grid-cols-3 items-center rounded-sm border border-line px-1.5"><span className={`${line} w-5`} /><span className={`${line} mx-auto w-6 bg-ink`} /><span className="ml-auto block h-2.5 w-4 rounded-sm bg-ink/70" /></span>,
  minimal: <span className="flex h-6 items-center justify-between rounded-sm border border-line px-1.5"><span className={`${line} w-6`} /><span className="space-y-0.5"><span className={`${line} w-3`} /><span className={`${line} w-3`} /></span></span>,
  bold: <span className="flex h-6 items-center justify-between rounded-sm bg-ink px-1.5"><span className="block h-1 w-6 rounded-sm bg-canvas/80" /><span className="block h-2.5 w-4 rounded-sm bg-canvas" /></span>,
  floating: <span className="flex h-6 items-center justify-between rounded-full border border-line bg-paper px-2 shadow"><span className={`${line} w-6`} /><span className="block h-2.5 w-4 rounded-full bg-ink/70" /></span>,
  stacked: <span className="block rounded-sm border border-line"><span className="flex h-5 items-center justify-center"><span className={`${line} w-8 bg-ink`} /></span><span className="flex h-3 items-center justify-center gap-1 border-t border-line"><span className={`${line} w-3`} /><span className={`${line} w-3`} /><span className={`${line} w-3`} /></span></span>,
  search: <span className="block rounded-sm border border-line"><span className="flex h-5 items-center gap-1 px-1.5"><span className={`${line} w-5`} /><span className="block h-2.5 flex-1 rounded-full border border-ink/30" /><span className="block h-2.5 w-3 rounded-sm bg-ink/70" /></span><span className="flex h-3 items-center gap-1 border-t border-line px-1.5"><span className={`${line} w-2`} /><span className={`${line} w-2`} /><span className={`${line} w-2`} /></span></span>,
  topbar: <span className="block rounded-sm border border-line"><span className="block h-2 bg-ink/10" /><span className="flex h-5 items-center justify-between px-1.5"><span className={`${line} w-6`} /><span className="block h-2.5 w-4 rounded-sm bg-ink/70" /></span></span>,
  accent: <span className="flex h-6 items-center justify-between rounded-sm bg-accent px-1.5"><span className="block h-1 w-6 rounded-sm bg-white/80" /><span className="block h-2.5 w-4 rounded-sm bg-white" /></span>,
  compact: <span className="flex h-4 items-center justify-between rounded-sm border border-line px-1.5"><span className={`${line} w-4`} /><span className="flex gap-1"><span className={`${line} w-2`} /><span className={`${line} w-2`} /></span><span className="block h-2 w-3 rounded-sm bg-ink/70" /></span>,
  nibbea: <span className="grid h-6 grid-cols-3 items-center rounded-sm border border-line px-1.5"><span className="block h-2.5 w-6 rounded-sm bg-ink/80" /><span className="mx-auto block size-3.5 border-2 border-ink/70" /><span className="ml-auto flex gap-1"><span className="block size-1.5 rounded-full bg-ink/50" /><span className="block size-1.5 rounded-full bg-ink/50" /><span className="block size-1.5 rounded-full bg-ink/50" /></span></span>,
  boxed: <span className="flex h-6 items-center justify-between border-y-2 border-ink px-1.5"><span className={`${line} w-6`} /><span className="flex divide-x divide-ink/30"><span className={`${line} mx-1 w-2`} /><span className={`${line} mx-1 w-2`} /></span><span className="block h-2.5 w-4 border border-ink" /></span>,
};

/** One-click combinations for the category browsing flow (Studio → Header). */
const MENU_PRESETS: { name: string; hint: string; set: Partial<SiteConfig["header"]> }[] = [
  { name: "Client flow", hint: "Click to open · subcategories collapsed · mega menu", set: { menuStyle: "mega", menuTrigger: "click", menuSubcategories: "collapsed", menuImages: true } },
  { name: "Simple dropdown", hint: "Click · compact list · expand to see subcategories", set: { menuStyle: "dropdown", menuTrigger: "click", menuSubcategories: "collapsed", menuImages: false } },
  { name: "Department store", hint: "Hover · every category in columns with pictures", set: { menuStyle: "columns", menuTrigger: "hover", menuSubcategories: "expanded", menuImages: true } },
  { name: "Side drawer", hint: "Click · slides in from the left · collapsed", set: { menuStyle: "drawer", menuTrigger: "click", menuSubcategories: "collapsed" } },
  { name: "Top level only", hint: "Click · categories only, subcategories on their pages", set: { menuStyle: "dropdown", menuTrigger: "click", menuSubcategories: "hidden", menuImages: false } },
  { name: "Visual mega menu", hint: "Hover · subcategories shown · big pictures", set: { menuStyle: "mega", menuTrigger: "hover", menuSubcategories: "expanded", menuImages: true } },
];

export function HeaderTab({ header, logo }: { header: SiteConfig["header"]; logo: SiteConfig["logo"] }) {
  const h = useSection("header", header);
  const l = useSection("logo", logo);

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <Panel id="header" title="Header design">
          <Choice
            label="Layout"
            value={h.v.variant}
            onChange={(x) => h.set("variant", x)}
            columns={5}
            options={[
              { value: "classic", label: "Classic", hint: "Logo · menu · icons", preview: HEADER_PREVIEW.classic },
              { value: "centered", label: "Centred logo", hint: "Menu · logo · icons", preview: HEADER_PREVIEW.centered },
              { value: "minimal", label: "Minimal", hint: "Logo + menu button", preview: HEADER_PREVIEW.minimal },
              { value: "bold", label: "Bold bar", hint: "Solid dark bar", preview: HEADER_PREVIEW.bold },
              { value: "floating", label: "Floating", hint: "Rounded bar with shadow", preview: HEADER_PREVIEW.floating },
              { value: "stacked", label: "Stacked", hint: "Big centred logo, menu below", preview: HEADER_PREVIEW.stacked },
              { value: "search", label: "Store search", hint: "Search box + category bar", preview: HEADER_PREVIEW.search },
              { value: "topbar", label: "With top bar", hint: "Contact & help links above", preview: HEADER_PREVIEW.topbar },
              { value: "accent", label: "Accent bar", hint: "Bar in your accent colour", preview: HEADER_PREVIEW.accent },
              { value: "compact", label: "Compact", hint: "Slim, short bar", preview: HEADER_PREVIEW.compact },
              { value: "boxed", label: "Boxed", hint: "Heavy rules, uppercase menu", preview: HEADER_PREVIEW.boxed },
              { value: "nibbea", label: "Category button", hint: "Category menu left, logo centre, labelled icons (Nibbea)", preview: HEADER_PREVIEW.nibbea },
            ]}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <SwitchRow label="Stick to the top while scrolling" checked={h.v.sticky} onChange={(x) => h.set("sticky", x)} />
            <SwitchRow label="Hide when scrolling down" hint="Comes back when scrolling up" checked={h.v.hideOnScroll} onChange={(x) => h.set("hideOnScroll", x)} />
            <SwitchRow label="Search icon" checked={h.v.showSearch} onChange={(x) => h.set("showSearch", x)} />
            <SwitchRow label="Account icon" checked={h.v.showAccount} onChange={(x) => h.set("showAccount", x)} />
            <SwitchRow label="Category links under the Store search header" hint={'The "All categories" button always stays'} checked={h.v.showCategoryBar} onChange={(x) => h.set("showCategoryBar", x)} />
          </div>
          <Choice
            label="Announcement bar (text is in Settings)"
            value={h.v.announcement}
            onChange={(x) => h.set("announcement", x)}
            options={[
              { value: "bar", label: "Static bar" },
              { value: "marquee", label: "Scrolling" },
              { value: "hidden", label: "Hidden" },
            ]}
          />
        </Panel>

        <Panel id="category-menu" title="Category menu flow" description="How customers browse categories from the header (desktop and phone). Patterns such as Mugs → Tapered / Round / Classic never appear in the menu; customers pick them on the category page.">
          <div className="space-y-2">
            <p className="text-sm font-medium">Ready-made flows</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {MENU_PRESETS.map((p) => {
                const on = (Object.keys(p.set) as (keyof typeof p.set)[]).every((k) => h.v[k] === p.set[k]);
                return (
                  <button
                    key={p.name}
                    type="button"
                    aria-pressed={on}
                    onClick={() => h.update((v) => ({ ...v, ...p.set }))}
                    className={`rounded-md border p-3 text-left text-sm transition-colors ${on ? "border-ink ring-1 ring-ink" : "border-line hover:border-muted"}`}
                  >
                    <span className="block font-medium">{p.name}</span>
                    <span className="block text-xs text-muted">{p.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <Choice
            label="Menu design"
            value={h.v.menuStyle}
            onChange={(x) => h.set("menuStyle", x)}
            columns={4}
            options={[
              { value: "mega", label: "Mega menu", hint: "Full-width panel, list + pictures" },
              { value: "dropdown", label: "Dropdown", hint: "Small panel under the button" },
              { value: "columns", label: "Columns", hint: "Every category with its subcategories" },
              { value: "drawer", label: "Side drawer", hint: "Slides in from the left" },
            ]}
          />
          <Choice
            label="Menu opens"
            value={h.v.menuTrigger}
            onChange={(x) => h.set("menuTrigger", x)}
            columns={2}
            options={[
              { value: "click", label: "On click only", hint: "Hovering does nothing; customers click to open" },
              { value: "hover", label: "On hover or click" },
            ]}
          />
          <Choice
            label="Subcategories in the menu"
            value={h.v.menuSubcategories}
            onChange={(x) => h.set("menuSubcategories", x)}
            columns={3}
            options={[
              { value: "collapsed", label: "Collapsed", hint: "Shown when the customer expands a category" },
              { value: "expanded", label: "Always shown" },
              { value: "hidden", label: "Not in the menu", hint: "Top categories only; subcategories on the category page" },
            ]}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Menu button text" htmlFor="mlabel"><TextInput id="mlabel" maxLength={30} value={h.v.menuLabel} onChange={(e) => h.set("menuLabel", e.target.value)} /></Field>
            <div className="grid gap-2">
              <SwitchRow label="Category pictures in the menu" hint="Mega menu and columns" checked={h.v.menuImages} onChange={(x) => h.set("menuImages", x)} />
              <SwitchRow label={`“${h.v.menuLabel || "All categories"} →” link`} checked={h.v.menuAllLink} onChange={(x) => h.set("menuAllLink", x)} />
            </div>
          </div>
          <p className="text-xs text-muted">The pattern page design (tiles, cards, buttons, list, carousel) is in Studio → Pages → Category pages.</p>
        </Panel>
        <SaveBar {...h} label="Save header" />
      </div>

      <div className="space-y-6">
        <Panel id="logo" title="Logo" description="Shown in the header, footer and dashboard.">
          <Choice
            label="Logo type"
            value={l.v.type}
            onChange={(x) => l.set("type", x)}
            columns={2}
            options={[
              { value: "text", label: "Text wordmark", hint: "Uses the theme's heading font" },
              { value: "image", label: "Image", hint: "Upload a PNG, SVG or JPG" },
            ]}
          />
          {l.v.type === "text" && (
            <Choice
              label="Text logo style"
              value={l.v.style}
              onChange={(x) => l.set("style", x)}
              columns={2}
              options={[
                { value: "wordmark", label: "Wordmark", hint: "Nibbea" },
                { value: "monogram", label: "Monogram", hint: "Initials in a square, name below (Nibbea)" },
              ]}
            />
          )}
          {l.v.type === "text" && l.v.style === "monogram" && (
            <Field label="Monogram letters" htmlFor="lm" hint="1–3 letters; empty = first letter of the name">
              <TextInput id="lm" maxLength={3} value={l.v.mark} onChange={(e) => l.set("mark", e.target.value)} />
            </Field>
          )}
          {l.v.type === "text" ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="First part" htmlFor="lb"><TextInput id="lb" maxLength={30} value={l.v.textBefore} onChange={(e) => l.set("textBefore", e.target.value)} /></Field>
              <Field label="Accent (italic)" htmlFor="la" hint="Optional"><TextInput id="la" maxLength={10} value={l.v.textAccent} onChange={(e) => l.set("textAccent", e.target.value)} /></Field>
              <Field label="Last part" htmlFor="lc" hint="Optional"><TextInput id="lc" maxLength={30} value={l.v.textAfter} onChange={(e) => l.set("textAfter", e.target.value)} /></Field>
            </div>
          ) : (
            <>
              <ImageUploader folder="brand" path={["logo"]} max={1} label="Logo image" value={l.v.image ? [l.v.image] : []} onChange={(imgs) => l.set("image", imgs[0] ?? null)} />
              <RangeField label="Logo height" value={l.v.height} min={20} max={96} onChange={(x) => l.set("height", x)} />
            </>
          )}
          <div className="flex min-h-20 items-center rounded-md border border-line bg-canvas px-5">
            {l.v.type === "image" && l.v.image ? (
              <Image src={l.v.image.url} alt="" width={l.v.height * 5} height={l.v.height} className="w-auto object-contain" style={{ height: l.v.height }} />
            ) : (
              l.v.style === "monogram" ? <Monogram brand={l.v} /> : <Wordmark brand={l.v} className="text-3xl" />
            )}
          </div>
        </Panel>
        <Panel id="favicon" title="Browser tab icon (favicon)" description="The small icon in the browser tab and bookmarks, also used when the store is added to a phone's home screen.">
          <Choice
            label="Icon"
            value={l.v.faviconSource}
            onChange={(x) => l.set("faviconSource", x)}
            options={[
              { value: "generated", label: "Initials", hint: "Letters of the logo on a tile in the theme colours" },
              { value: "logo", label: "Same as the logo", hint: l.v.image ? "Uses the uploaded logo picture" : "Upload a logo picture above first" },
              { value: "upload", label: "Upload an icon", hint: "A separate square picture" },
            ]}
          />
          {l.v.faviconSource === "upload" && (
            <ImageUploader folder="brand" path={["favicon"]} max={1} label="Icon picture" value={l.v.favicon ? [l.v.favicon] : []} onChange={(imgs) => l.set("favicon", imgs[0] ?? null)} />
          )}
          {l.v.faviconSource === "logo" && !l.v.image && <p className="text-sm text-mto">There is no logo picture yet. Switch the logo to “Image” above and upload one, or the initials are used.</p>}
          <p className="text-xs text-muted">Use a square PNG or JPG (at least 512 × 512 px). SVG works too. Other formats fall back to the initials.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Choice label="Background" value={l.v.faviconBg} onChange={(x) => l.set("faviconBg", x)} columns={3} options={[{ value: "theme", label: "Theme colour" }, { value: "white", label: "White" }, { value: "transparent", label: "None" }]} />
            <RangeField label="Space around the picture" value={l.v.faviconPadding} min={0} max={30} unit="%" onChange={(x) => l.set("faviconPadding", x)} />
          </div>
          <FaviconPreview logo={l.v} />
        </Panel>
        <SaveBar {...l} label="Save logo" />
      </div>
    </div>
  );
}

/** Live preview of the tab icon from the unsaved settings (the real icon updates after saving). */
function FaviconPreview({ logo }: { logo: SiteConfig["logo"] }) {
  const pic = logo.faviconSource === "upload" ? logo.favicon : logo.faviconSource === "logo" ? logo.image : null;
  const letters = (logo.mark || [logo.textBefore, logo.textAfter].filter(Boolean).map((w) => w[0]).join("&") || "S").slice(0, 3);
  const bg = logo.faviconBg === "transparent" ? "bg-transparent" : logo.faviconBg === "white" ? "bg-white" : "bg-ink";
  const tile = (px: number, round: boolean) => (
    <span className={`relative flex shrink-0 items-center justify-center overflow-hidden ${bg} ${round ? "rounded-[22%]" : ""}`} style={{ width: px, height: px, padding: px <= 32 ? 0 : (px * logo.faviconPadding) / 100 }}>
      {pic ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={pic.url} alt="" className="size-full object-contain" />
      ) : (
        <span className={`font-serif font-bold ${logo.faviconBg === "theme" ? "text-canvas" : "text-ink"}`} style={{ fontSize: px * (letters.length > 2 ? 0.34 : 0.46) }}>{letters}</span>
      )}
    </span>
  );
  return (
    <div className="flex flex-wrap items-end gap-6 rounded-md border border-line bg-canvas p-4">
      <div className="space-y-1.5">
        <p className="text-xs text-muted">Browser tab</p>
        <span className="flex w-52 items-center gap-2 rounded-t-md border border-b-0 border-line bg-paper px-3 py-2 text-xs">{tile(16, false)}<span className="truncate">{[logo.textBefore, logo.textAccent, logo.textAfter].filter(Boolean).join(" ")}</span></span>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs text-muted">Phone home screen</p>
        {tile(60, true)}
      </div>
    </div>
  );
}

const fl = "block h-0.5 rounded-sm";
const FOOTER_PREVIEW: Record<string, React.ReactNode> = {
  bigbrand: <span className="flex h-10 flex-col justify-between rounded-sm bg-ink p-1"><span className="flex gap-1"><span className={`${fl} w-3 bg-canvas/60`} /><span className={`${fl} w-3 bg-canvas/60`} /><span className={`${fl} w-3 bg-canvas/60`} /></span><span className="block h-3 w-4/5 rounded-sm bg-canvas/15" /></span>,
  columns: <span className="grid h-10 grid-cols-4 gap-1 rounded-sm bg-ink p-1"><span className={`${fl} bg-canvas`} />{[1, 2, 3].map((i) => <span key={i} className="space-y-0.5"><span className={`${fl} bg-canvas/50`} /><span className={`${fl} bg-canvas/50`} /></span>)}</span>,
  centered: <span className="flex h-10 flex-col items-center justify-center gap-1 rounded-sm bg-ink"><span className={`${fl} w-6 bg-canvas`} /><span className="flex gap-1"><span className={`${fl} w-3 bg-canvas/50`} /><span className={`${fl} w-3 bg-canvas/50`} /><span className={`${fl} w-3 bg-canvas/50`} /></span></span>,
  minimal: <span className="flex h-10 items-center justify-center gap-1 rounded-sm bg-ink">{[1, 2, 3, 4].map((i) => <span key={i} className={`${fl} w-2.5 bg-canvas/60`} />)}</span>,
  light: <span className="grid h-10 grid-cols-4 gap-1 rounded-sm border border-line bg-surface p-1"><span className={`${fl} bg-ink`} />{[1, 2, 3].map((i) => <span key={i} className="space-y-0.5"><span className={`${fl} bg-ink/40`} /><span className={`${fl} bg-ink/40`} /></span>)}</span>,
  split: <span className="grid h-10 grid-cols-2 gap-1 rounded-sm border border-line bg-surface p-1"><span className="space-y-0.5"><span className="block h-1.5 w-4/5 rounded-sm bg-ink/70" /><span className="block h-1.5 w-3/5 rounded-sm bg-ink/70" /></span><span className="grid grid-cols-2 gap-0.5 self-end"><span className={`${fl} bg-ink/40`} /><span className={`${fl} bg-ink/40`} /></span></span>,
  mega: <span className="block h-10 rounded-sm bg-ink p-1"><span className="mb-1 flex gap-1 border-b border-canvas/20 pb-0.5"><span className={`${fl} w-4 bg-accent-soft`} /><span className={`${fl} w-4 bg-accent-soft`} /></span><span className="grid grid-cols-5 gap-0.5">{[1, 2, 3, 4, 5].map((i) => <span key={i} className="space-y-0.5"><span className={`${fl} bg-canvas/50`} /><span className={`${fl} bg-canvas/50`} /></span>)}</span></span>,
  cards: <span className="grid h-10 grid-cols-3 gap-1 rounded-sm border border-line bg-surface p-1">{[1, 2, 3].map((i) => <span key={i} className="rounded-sm border border-line bg-paper" />)}</span>,
  accent: <span className="grid h-10 grid-cols-4 gap-1 rounded-sm bg-accent p-1"><span className={`${fl} bg-white`} />{[1, 2, 3].map((i) => <span key={i} className="space-y-0.5"><span className={`${fl} bg-white/60`} /><span className={`${fl} bg-white/60`} /></span>)}</span>,
  cta: <span className="block h-10 rounded-sm bg-ink p-1"><span className="mb-1 flex h-4 items-center justify-between rounded-sm bg-canvas/15 px-1"><span className={`${fl} w-6 bg-canvas`} /><span className="block h-2 w-3 rounded-full bg-canvas" /></span><span className="flex gap-1"><span className={`${fl} w-3 bg-canvas/50`} /><span className={`${fl} w-3 bg-canvas/50`} /></span></span>,
  stacked: <span className="flex h-10 flex-col items-center justify-center gap-1 rounded-sm bg-ink"><span className="block h-3 w-4/5 rounded-sm bg-canvas/80" /><span className="flex gap-1"><span className={`${fl} w-3 bg-canvas/50`} /><span className={`${fl} w-3 bg-canvas/50`} /></span></span>,
};

export function FooterTab({ initial }: { initial: SiteConfig["footer"] }) {
  const f = useSection("footer", initial);
  return (
    <div className="space-y-6">
      <Panel id="footer" title="Footer design">
        <Choice
          label="Layout"
          value={f.v.variant}
          onChange={(x) => f.set("variant", x)}
          columns={5}
          options={[
            { value: "bigbrand", label: "Big brand", hint: "Columns + giant wordmark", preview: FOOTER_PREVIEW.bigbrand },
            { value: "columns", label: "Columns", hint: "Logo and link columns", preview: FOOTER_PREVIEW.columns },
            { value: "centered", label: "Centred", hint: "Everything centred", preview: FOOTER_PREVIEW.centered },
            { value: "minimal", label: "Minimal", hint: "One row of links", preview: FOOTER_PREVIEW.minimal },
            { value: "light", label: "Light", hint: "Light background", preview: FOOTER_PREVIEW.light },
            { value: "split", label: "Split", hint: "Big statement + links", preview: FOOTER_PREVIEW.split },
            { value: "mega", label: "Mega", hint: "Every category & subcategory, trust strip", preview: FOOTER_PREVIEW.mega },
            { value: "cards", label: "Cards", hint: "Link groups in cards", preview: FOOTER_PREVIEW.cards },
            { value: "accent", label: "Accent", hint: "In your accent colour", preview: FOOTER_PREVIEW.accent },
            { value: "cta", label: "Call to action", hint: "\"Have a question?\" band", preview: FOOTER_PREVIEW.cta },
            { value: "stacked", label: "Stacked", hint: "Giant centred wordmark", preview: FOOTER_PREVIEW.stacked },
          ]}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tagline" htmlFor="ft" hint="A sentence about the store"><TextInput id="ft" maxLength={200} value={f.v.tagline} onChange={(e) => f.set("tagline", e.target.value)} /></Field>
          <Field label="Bottom line" htmlFor="fc" hint="Next to the © year"><TextInput id="fc" maxLength={120} value={f.v.copyright} onChange={(e) => f.set("copyright", e.target.value)} /></Field>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <SwitchRow label="Category links" checked={f.v.showCategories} onChange={(x) => f.set("showCategories", x)} />
          <SwitchRow label="Policy links" checked={f.v.showPolicies} onChange={(x) => f.set("showPolicies", x)} />
          <SwitchRow label="Contact details" checked={f.v.showContact} onChange={(x) => f.set("showContact", x)} />
        </div>
      </Panel>
      <SaveBar {...f} label="Save footer" />
    </div>
  );
}
