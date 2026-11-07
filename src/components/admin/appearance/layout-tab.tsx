"use client";

import { categoryLabels, heroLabels, homeLabels, type Theme } from "@/config/themes";
import type { SiteConfig } from "@/lib/site-config";
import { Choice, Panel, SaveBar, SwitchRow, useSection, withTheme } from "./shared";

/** Small wireframes so each hero option is recognisable. */
const bar = "block rounded-sm bg-ink/70";
const box = "block rounded-sm bg-ink/15";
const HERO_PREVIEW: Record<string, React.ReactNode> = {
  split: <span className="grid h-12 grid-cols-2 gap-1"><span className="space-y-1 pt-2"><span className={`${bar} h-1.5 w-4/5`} /><span className={`${bar} h-1.5 w-3/5`} /></span><span className={box} /></span>,
  centered: <span className="flex h-12 flex-col items-center gap-1"><span className={`${bar} h-1.5 w-3/5`} /><span className={`${box} w-full flex-1`} /></span>,
  fullbleed: <span className="flex h-12 items-end rounded-sm bg-ink/60 p-1.5"><span className="block h-1.5 w-1/2 rounded-sm bg-white" /></span>,
  editorial: <span className="grid h-12 grid-cols-2 border border-ink/40"><span className={box} /><span className="space-y-1 p-1"><span className={`${bar} h-1 w-4/5`} /><span className={`${bar} h-1 w-3/5`} /></span></span>,
  minimal: <span className="flex h-12 flex-col justify-center gap-1"><span className={`${bar} h-2.5 w-4/5`} /><span className={`${bar} h-2.5 w-2/5`} /></span>,
  framed: <span className="grid h-12 grid-cols-2 gap-1"><span className="space-y-1 pt-2"><span className={`${bar} h-1.5 w-4/5`} /><span className="block h-1.5 w-3/5 rounded-sm bg-accent" /></span><span className="relative"><span className="absolute right-0 top-0 h-3/4 w-3/4 translate-x-0.5 translate-y-0.5 bg-accent/30" /><span className={`${box} absolute right-0 top-0 h-3/4 w-3/4`} /><span className="absolute -right-1 -top-1 size-3 rounded-full bg-accent" /></span></span>,
  search: <span className="flex h-12 flex-col items-center justify-center gap-1 rounded-sm bg-ink/60 p-1"><span className="block h-1.5 w-1/2 rounded-sm bg-white" /><span className="block h-2.5 w-3/4 rounded-full bg-white/90" /></span>,
  collage: <span className="grid h-12 grid-cols-2 gap-1"><span className="space-y-1 pt-2"><span className={`${bar} h-1.5 w-4/5`} /></span><span className="relative"><span className={`${box} absolute left-0 top-0 h-3/4 w-3/5`} /><span className={`${box} absolute bottom-0 right-0 h-1/2 w-1/2 bg-ink/25`} /></span></span>,
};

export function LayoutTab({ initial, theme }: { initial: SiteConfig["design"]; theme: Theme }) {
  const s = useSection("design", initial);
  const { v } = s;
  const sec = v.sections;
  const setSec = (k: keyof typeof sec, val: boolean) => s.set("sections", { ...sec, [k]: val });

  return (
    <div className="space-y-6">
      <Panel id="home-type" title="Home page type" description={`Your theme "${theme.name}" uses: ${homeLabels[theme.layout.home]}. Pick another to change only the home page structure and keep the theme's look.`}>
        <Choice
          label="Kind of home page"
          value={v.homeMode}
          onChange={(x) => s.set("homeMode", x)}
          columns={3}
          options={withTheme(homeLabels[theme.layout.home], [
            { value: "landing", label: homeLabels.landing, hint: "Hero, categories, story, products" },
            { value: "shop", label: homeLabels.shop, hint: "Straight into products, no landing page" },
            { value: "lookbook", label: homeLabels.lookbook, hint: "Magazine spreads per category" },
            { value: "spotlight", label: homeLabels.spotlight, hint: "One product, big and ready to buy" },
            { value: "bento", label: homeLabels.bento, hint: "A grid of tiles" },
          ])}
        />
      </Panel>

      <Panel id="hero" title="Hero section" description="The first thing visitors see on a landing page. The hero text is under Content.">
        <Choice
          label="Hero design"
          value={v.hero}
          onChange={(x) => s.set("hero", x)}
          columns={4}
          options={withTheme(heroLabels[theme.layout.hero], (["split", "centered", "fullbleed", "editorial", "minimal", "collage", "framed", "search"] as const).map((h) => ({ value: h, label: heroLabels[h][0]!.toUpperCase() + heroLabels[h].slice(1), preview: HERO_PREVIEW[h] })))}
        />
      </Panel>

      <Panel id="categories" title="Category section" description="How categories are shown on the home page and the direct-shop page.">
        <Choice
          label="Category design"
          value={v.categories}
          onChange={(x) => s.set("categories", x)}
          columns={3}
          options={withTheme(categoryLabels[theme.layout.categories], [
            { value: "mosaic", label: "Mosaic", hint: "One big tile, smaller ones around it" },
            { value: "cards", label: "Cards", hint: "Equal cards with names below" },
            { value: "list", label: "Big list", hint: "Numbered rows, photo on hover" },
            { value: "circles", label: "Circles", hint: "Round photo icons in a row" },
            { value: "pills", label: "Pills", hint: "Compact chips with subcategories" },
            { value: "tiles", label: "Photo tiles", hint: "Short photo tiles for each subcategory" },
          ])}
        />
      </Panel>

      <Panel id="sections" title="Landing-page sections" description="Turn sections on or off and choose their order.">
        <Choice
          label="Order"
          value={v.sectionOrder}
          onChange={(x) => s.set("sectionOrder", x)}
          options={withTheme(theme.layout.sections === "shop-first" ? "Products first" : "Story first", [
            { value: "story-first", label: "Story first", hint: "Ready to ship → story → process → new" },
            { value: "shop-first", label: "Products first", hint: "New → ready to ship → story → process" },
          ])}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <SwitchRow label="Scrolling ticker" hint="Glaze and category names under the hero" checked={sec.marquee} onChange={(x) => setSec("marquee", x)} />
          <SwitchRow label="Categories" checked={sec.categories} onChange={(x) => setSec("categories", x)} />
          <SwitchRow label="Ready to ship carousel" checked={sec.readyToShip} onChange={(x) => setSec("readyToShip", x)} />
          <SwitchRow label="Our story" checked={sec.story} onChange={(x) => setSec("story", x)} />
          <SwitchRow label="The process" checked={sec.process} onChange={(x) => setSec("process", x)} />
          <SwitchRow label="New arrivals grid" checked={sec.newArrivals} onChange={(x) => setSec("newArrivals", x)} />
          <SwitchRow label="Shipping & returns strip" checked={sec.promise} onChange={(x) => setSec("promise", x)} />
          <SwitchRow label="Closing call to action" checked={sec.closingCta} onChange={(x) => setSec("closingCta", x)} />
        </div>
      </Panel>

      <SaveBar {...s} />
    </div>
  );
}
