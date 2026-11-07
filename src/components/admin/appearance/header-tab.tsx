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
            label="Category menu opens"
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
            columns={2}
            options={[
              { value: "collapsed", label: "Collapsed", hint: "Shown only when the customer expands a category" },
              { value: "expanded", label: "Always shown" },
            ]}
          />
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
                { value: "wordmark", label: "Wordmark", hint: "Clay & Glaze" },
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
              <ImageUploader folder="brand" max={1} label="Logo image" value={l.v.image ? [l.v.image] : []} onChange={(imgs) => l.set("image", imgs[0] ?? null)} />
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
        <SaveBar {...l} label="Save logo" />
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
