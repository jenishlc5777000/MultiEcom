"use client";

import { listingLabels, type Theme } from "@/config/themes";
import type { SiteConfig } from "@/lib/site-config";
import { Field, TextInput } from "../form";
import { Choice, Panel, RangeField, SaveBar, SwitchRow, useSection, withTheme, type ChoiceOption } from "./shared";

/** Wireframes for the product-list layouts. */
const cell = "block rounded-[2px] bg-ink/20";
const LISTING_PREVIEW: Record<string, React.ReactNode> = {
  grid: <span className="grid h-9 grid-cols-4 gap-1">{[0, 1, 2, 3].map((i) => <span key={i} className={cell} />)}</span>,
  list: <span className="grid h-9 gap-1">{[0, 1, 2].map((i) => <span key={i} className="flex gap-1"><span className={`${cell} w-3`} /><span className="block flex-1 rounded-[2px] bg-ink/10" /></span>)}</span>,
  compact: <span className="grid h-9 grid-cols-6 gap-0.5">{Array.from({ length: 12 }, (_, i) => <span key={i} className={cell} />)}</span>,
  masonry: <span className="grid h-9 grid-cols-3 gap-1"><span className="space-y-1"><span className={`${cell} h-5`} /><span className={`${cell} h-3`} /></span><span className="space-y-1"><span className={`${cell} h-3`} /><span className={`${cell} h-5`} /></span><span className={`${cell} h-full`} /></span>,
  large: <span className="grid h-9 grid-cols-2 gap-1"><span className={cell} /><span className={cell} /></span>,
};
const listingOptions = (theme: Theme): ChoiceOption<"theme" | "grid" | "list" | "compact" | "masonry" | "large">[] =>
  withTheme(listingLabels[theme.layout.listing], (["grid", "list", "compact", "masonry", "large"] as const).map((l) => ({ value: l, label: listingLabels[l], preview: LISTING_PREVIEW[l] })));

const CAT_PREVIEW: Record<string, React.ReactNode> = {
  top: <span className="block h-9 space-y-1"><span className="flex gap-0.5">{[0, 1, 2].map((i) => <span key={i} className="block h-1.5 w-4 rounded-full bg-ink/40" />)}</span><span className="grid grid-cols-4 gap-0.5">{[0, 1, 2, 3].map((i) => <span key={i} className={`${cell} h-6`} />)}</span></span>,
  sidebar: <span className="grid h-9 grid-cols-[1fr_3fr] gap-1"><span className="space-y-0.5 rounded-[2px] border border-ink/20 p-0.5">{[0, 1, 2].map((i) => <span key={i} className="block h-1 rounded-full bg-ink/30" />)}</span><span className="grid grid-cols-3 gap-0.5">{[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className={cell} />)}</span></span>,
  tabs: <span className="block h-9 space-y-1"><span className="flex gap-1 border-b border-ink/20 pb-0.5"><span className="block h-1 w-4 bg-ink" /><span className="block h-1 w-4 bg-ink/30" /><span className="block h-1 w-4 bg-ink/30" /></span><span className="grid grid-cols-4 gap-0.5">{[0, 1, 2, 3].map((i) => <span key={i} className={`${cell} h-5`} />)}</span></span>,
  tiles: <span className="block h-9 space-y-1"><span className="grid grid-cols-5 gap-0.5">{[0, 1, 2, 3, 4].map((i) => <span key={i} className="block aspect-square rounded-[2px] bg-ink/35" />)}</span><span className="grid grid-cols-4 gap-0.5">{[0, 1, 2, 3].map((i) => <span key={i} className={`${cell} h-3`} />)}</span></span>,
};

export function PagesTab({ initial, theme }: { initial: SiteConfig["pages"]; theme: Theme }) {
  const s = useSection("pages", initial);
  const { category: cat, product: prod, categoriesIndex: idx, shopAll } = s.v;
  const setCat = (patch: Partial<typeof cat>) => s.set("category", { ...cat, ...patch });
  const setProd = (patch: Partial<typeof prod>) => s.set("product", { ...prod, ...patch });
  const setIdx = (patch: Partial<typeof idx>) => s.set("categoriesIndex", { ...idx, ...patch });
  const setShop = (patch: Partial<typeof shopAll>) => s.set("shopAll", { ...shopAll, ...patch });

  return (
    <div className="space-y-6">
      <Panel id="listing" title="Product lists" description="The default layout for lists of products. Each page below can override it.">
        <Choice label="Layout everywhere" value={s.v.listing} onChange={(x) => s.set("listing", x)} columns={6} options={listingOptions(theme)} />
      </Panel>

      <Panel id="category-page" title="Category pages" description="Each category and subcategory page.">
        <Choice
          label="Page layout"
          value={cat.layout}
          onChange={(x) => setCat({ layout: x })}
          columns={4}
          options={[
            { value: "top", label: "Chips on top", hint: "Subcategory buttons above the products", preview: CAT_PREVIEW.top },
            { value: "sidebar", label: "Sidebar", hint: "Category tree + filters on the left", preview: CAT_PREVIEW.sidebar },
            { value: "tabs", label: "Tabs", hint: "Underlined subcategory tabs", preview: CAT_PREVIEW.tabs },
            { value: "tiles", label: "Photo tiles", hint: "Subcategory photos above the products", preview: CAT_PREVIEW.tiles },
          ]}
        />
        <Choice label="Product layout on category pages" value={cat.listing} onChange={(x) => setCat({ listing: x })} columns={6} options={listingOptions(theme)} />
        <div className="grid gap-2 sm:grid-cols-3">
          <SwitchRow label="Filters" hint="Availability and price" checked={cat.showFilters} onChange={(x) => setCat({ showFilters: x })} />
          <SwitchRow label="Sort menu" checked={cat.showSort} onChange={(x) => setCat({ showSort: x })} />
          <SwitchRow label="Subcategory navigation" checked={cat.showChips} onChange={(x) => setCat({ showChips: x })} />
          <SwitchRow label="Big page title" hint="Off = a compact heading" checked={cat.showHero} onChange={(x) => setCat({ showHero: x })} />
          <SwitchRow label="Breadcrumb" checked={cat.showBreadcrumb} onChange={(x) => setCat({ showBreadcrumb: x })} />
        </div>
        <div className="space-y-4 rounded-md border border-line p-4">
          <p className="text-sm font-medium">“Choose a pattern first” categories</p>
          <p className="text-xs text-muted">For categories set to list products only inside their patterns (e.g. Mugs → Tapered, Round, Classic). Turn that on per category in Admin → Categories; Art &amp; Craft and others keep listing products directly.</p>
          <Choice
            label="How the patterns are shown"
            value={cat.patternLayout}
            onChange={(x) => setCat({ patternLayout: x })}
            columns={5}
            options={[
              { value: "tiles", label: "Tiles", hint: "Picture + name" },
              { value: "cards", label: "Picture cards", hint: "Name over the picture" },
              { value: "pills", label: "Buttons", hint: "Compact, small thumbnail" },
              { value: "list", label: "List", hint: "One row each, with text" },
              { value: "carousel", label: "Carousel", hint: "Swipe sideways" },
            ]}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {(cat.patternLayout === "tiles" || cat.patternLayout === "cards") && <RangeField label="Columns (desktop)" value={cat.patternColumns} min={2} max={5} unit="" onChange={(x) => setCat({ patternColumns: x })} />}
            {cat.patternLayout !== "pills" && (
              <Choice label="Picture shape" value={cat.patternShape} onChange={(x) => setCat({ patternShape: x })} columns={4} options={[{ value: "square", label: "Square" }, { value: "portrait", label: "Tall" }, { value: "landscape", label: "Wide" }, { value: "circle", label: "Circle" }]} />
            )}
          </div>
          <Field label="Text above the patterns" htmlFor="pp" hint="Empty = no text"><TextInput id="pp" maxLength={160} value={cat.patternPrompt} onChange={(e) => setCat({ patternPrompt: e.target.value })} /></Field>
          <SwitchRow label="Show each pattern's description" hint="From the category's description in Admin → Categories" checked={cat.patternShowDescription} onChange={(x) => setCat({ patternShowDescription: x })} />
        </div>
        {cat.showHero && (
          <Choice label="Title alignment" value={cat.heroAlign} onChange={(x) => setCat({ heroAlign: x })} columns={2} options={[{ value: "left", label: "Left" }, { value: "center", label: "Centred" }]} />
        )}
      </Panel>

      <Panel id="categories-page" title="All categories page" description="The /category page that lists every category.">
        <Choice
          label="Layout"
          value={idx.layout}
          onChange={(x) => setIdx({ layout: x })}
          columns={4}
          options={withTheme(theme.layout.categories, [
            { value: "mosaic", label: "Mosaic" },
            { value: "cards", label: "Cards" },
            { value: "list", label: "Big list" },
            { value: "circles", label: "Circles" },
            { value: "pills", label: "Pills" },
            { value: "tiles", label: "Photo tiles" },
            { value: "tree", label: "Directory tree", hint: "Every category with its subcategories" },
          ])}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <SwitchRow label="Show subcategories" checked={idx.showSubcategories} onChange={(x) => setIdx({ showSubcategories: x })} />
          <SwitchRow label="Show product counts" checked={idx.showCounts} onChange={(x) => setIdx({ showCounts: x })} />
        </div>
      </Panel>

      <Panel id="shop-page" title="Direct-shop home page" description="Used when the home page type is Direct shop.">
        <Choice label="Product layout" value={shopAll.listing} onChange={(x) => setShop({ listing: x })} columns={6} options={listingOptions(theme)} />
      </Panel>

      <Panel id="product-page" title="Product pages">
        <Choice
          label="Product page design"
          value={prod.layout}
          onChange={(x) => setProd({ layout: x })}
          columns={2}
          options={[
            { value: "classic", label: "Classic", hint: "Gallery with thumbnails below, title first" },
            { value: "showcase", label: "Showcase (Nibbea)", hint: "Labelled thumbnails, glaze photos, quantity, Add to Cart + Buy Now" },
          ]}
        />
        <Choice
          label="Photo position"
          value={prod.imageSide}
          onChange={(x) => setProd({ imageSide: x })}
          columns={2}
          options={[
            { value: "left", label: "Photos left", hint: "Details on the right" },
            { value: "right", label: "Photos right", hint: "Details on the left" },
          ]}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <SwitchRow label="Breadcrumb" checked={prod.showBreadcrumb} onChange={(x) => setProd({ showBreadcrumb: x })} />
          <SwitchRow label="Reviews section" checked={prod.showReviews} onChange={(x) => setProd({ showReviews: x })} />
        </div>
        <Field label="Note under the details" htmlFor="hn" hint="Leave empty to hide">
          <TextInput id="hn" maxLength={240} value={prod.handmadeNote} onChange={(e) => setProd({ handmadeNote: e.target.value })} />
        </Field>
      </Panel>

      <SaveBar {...s} />
    </div>
  );
}
