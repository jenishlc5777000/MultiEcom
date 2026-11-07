"use client";

import { listingLabels, type Theme } from "@/config/themes";
import type { SiteConfig } from "@/lib/site-config";
import { Field, Select, TextArea, TextInput } from "../form";
import { Choice, Panel, RangeField, SaveBar, SwitchRow, useSection, withTheme } from "./shared";

const box = "block rounded-[2px] bg-ink/20";
const MODE_PREVIEW: Record<string, React.ReactNode> = {
  page: <span className="block h-10 space-y-1 rounded-sm border border-line p-1"><span className="block h-1.5 w-3/4 border-b border-ink/40" /><span className="grid grid-cols-4 gap-0.5">{[0, 1, 2, 3].map((i) => <span key={i} className={`${box} h-4`} />)}</span></span>,
  overlay: <span className="flex h-10 flex-col justify-center gap-1 rounded-sm bg-ink/80 p-1.5"><span className="block h-2 w-full border-b border-white/70" /><span className="grid grid-cols-2 gap-0.5"><span className="block h-2 rounded-[2px] bg-white/40" /><span className="block h-2 rounded-[2px] bg-white/40" /></span></span>,
  dropdown: <span className="block h-10 rounded-sm border border-line"><span className="block h-2.5 border-b border-line" /><span className="mx-auto mt-1 block w-3/4 space-y-0.5 rounded-sm border border-ink/30 p-0.5"><span className="block h-1.5 rounded-full border border-ink/40" /><span className="block h-1 rounded-sm bg-ink/20" /></span></span>,
};

/** Header search behaviour, instant suggestions and the search results page. */
export function SearchTab({ initial, theme }: { initial: SiteConfig["search"]; theme: Theme }) {
  const s = useSection("search", initial);
  const v = s.v;
  return (
    <div className="space-y-6">
      <Panel id="search" title="Header search" description="What happens when a visitor clicks the search icon (or presses / on the keyboard). Phones always use the search page.">
        <Choice
          label="Search style"
          value={v.mode}
          onChange={(x) => s.set("mode", x)}
          options={[
            { value: "overlay", label: "Full-screen overlay", hint: "Big search with instant results", preview: MODE_PREVIEW.overlay },
            { value: "dropdown", label: "Dropdown", hint: "Search box slides down under the header", preview: MODE_PREVIEW.dropdown },
            { value: "page", label: "Search page", hint: "The icon goes to /search", preview: MODE_PREVIEW.page },
          ]}
        />
        <p className="text-xs text-muted">The &quot;Store search&quot; header design always shows a search box in the header itself.</p>
        <Field label="Placeholder text" htmlFor="sp"><TextInput id="sp" maxLength={80} value={v.placeholder} onChange={(e) => s.set("placeholder", e.target.value)} /></Field>
      </Panel>

      <Panel id="search-instant" title="Instant results" description="Products (and categories) shown while typing, before pressing Enter.">
        <SwitchRow label="Show results while typing" checked={v.instant} onChange={(x) => s.set("instant", x)} />
        {v.instant && (
          <div className="grid gap-4 sm:grid-cols-2">
            <RangeField label="Products to show" value={v.suggestionCount} min={3} max={10} unit="" onChange={(x) => s.set("suggestionCount", x)} />
            <SwitchRow label="Include matching categories" checked={v.showCategoryMatches} onChange={(x) => s.set("showCategoryMatches", x)} />
          </div>
        )}
        <Field label="Popular searches" htmlFor="pop" hint="One per line, up to 10. Shown before typing and on the empty search page.">
          <TextArea id="pop" rows={4} value={v.popular.join("\n")} onChange={(e) => s.set("popular", e.target.value.split("\n"))} />
        </Field>
      </Panel>

      <Panel id="search-results" title="Search results page">
        <Choice
          label="Results layout"
          value={v.listing}
          onChange={(x) => s.set("listing", x)}
          columns={6}
          options={withTheme(listingLabels[theme.layout.listing], (["grid", "list", "compact", "masonry", "large"] as const).map((l) => ({ value: l, label: listingLabels[l] })))}
        />
        <SwitchRow label="Filter sidebar" checked={v.showFilters} onChange={(x) => s.set("showFilters", x)} />
        {v.showFilters && (
          <div className="grid gap-2 sm:grid-cols-3">
            <SwitchRow label="Category filter" checked={v.filterCategory} onChange={(x) => s.set("filterCategory", x)} />
            <SwitchRow label="Availability filter" checked={v.filterAvailability} onChange={(x) => s.set("filterAvailability", x)} />
            <SwitchRow label="Price filter" checked={v.filterPrice} onChange={(x) => s.set("filterPrice", x)} />
          </div>
        )}
        <Field label="Default sort" htmlFor="ds">
          <Select id="ds" value={v.defaultSort} onChange={(e) => s.set("defaultSort", e.target.value as typeof v.defaultSort)}>
            <option value="relevance">Best match</option>
            <option value="new">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="rating">Top rated</option>
          </Select>
        </Field>
      </Panel>

      <SaveBar {...s} label="Save search settings" />
    </div>
  );
}
