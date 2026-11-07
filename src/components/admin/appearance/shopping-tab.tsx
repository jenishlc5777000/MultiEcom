"use client";

import Image from "next/image";
import { ArrowDown, ArrowUp, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { SiteConfig } from "@/lib/site-config";
import { formatINR } from "@/lib/utils";
import type { PickerProduct } from "@/services/merch.service";
import { Field, TextInput } from "../form";
import { Choice, Panel, RangeField, SaveBar, SwitchRow, useSection } from "./shared";

/** Studio → Shopping: favourites, recently viewed, offers, hot deals, most ordered. */
export function ShoppingTab({ initial, products }: { initial: SiteConfig["shopping"]; products: PickerProduct[] }) {
  const s = useSection("shopping", initial);
  const v = s.v;
  const sub = <K extends keyof typeof v>(k: K) => (patch: Partial<(typeof v)[K]>) => s.set(k, { ...v[k], ...patch });
  const fav = sub("favourites");
  const rec = sub("recentlyViewed");
  const off = sub("offers");
  const hot = sub("hotDeals");
  const best = sub("bestsellers");
  const page = sub("offersPage");
  const text = (id: string, label: string, value: string, onChange: (x: string) => void, max = 80) => (
    <Field label={label} htmlFor={id}><TextInput id={id} maxLength={max} value={value} onChange={(e) => onChange(e.target.value)} /></Field>
  );

  return (
    <div className="space-y-6">
      <Panel id="shop-favourites" title="Favourites" description="A heart on products; saved pieces are listed on /favourites. Saved in each visitor's browser, no sign-in needed.">
        <SwitchRow label="Favourites are on" checked={v.favourites.enabled} onChange={(x) => fav({ enabled: x })} />
        {v.favourites.enabled && (
          <div className="grid gap-2 sm:grid-cols-2">
            <SwitchRow label="Heart on product cards" checked={v.favourites.showOnCards} onChange={(x) => fav({ showOnCards: x })} />
            <SwitchRow label="Heart with count in the header" checked={v.favourites.showInHeader} onChange={(x) => fav({ showInHeader: x })} />
            {text("fav-title", "Favourites page title", v.favourites.title, (x) => fav({ title: x }))}
          </div>
        )}
      </Panel>

      <Panel id="shop-recent" title="Recently viewed" description="Products each visitor looked at, newest first (saved in their browser).">
        <SwitchRow label="Recently viewed is on" checked={v.recentlyViewed.enabled} onChange={(x) => rec({ enabled: x })} />
        {v.recentlyViewed.enabled && (
          <div className="grid gap-4 sm:grid-cols-2">
            <SwitchRow label="Show on product pages" checked={v.recentlyViewed.onProductPage} onChange={(x) => rec({ onProductPage: x })} />
            <SwitchRow label="Show on the home page" hint="Or add a Recently viewed section in Sections" checked={v.recentlyViewed.onHome} onChange={(x) => rec({ onHome: x })} />
            {text("rec-title", "Heading", v.recentlyViewed.title, (x) => rec({ title: x }))}
            <RangeField label="How many" value={v.recentlyViewed.count} min={2} max={12} unit="" onChange={(x) => rec({ count: x })} />
          </div>
        )}
      </Panel>

      <Panel id="shop-offers-page" title="Offers & deals page" description="/offers collects the three lists below. Each list can also be placed on the home page from Sections → Product collection.">
        <div className="grid gap-4 sm:grid-cols-2">
          <SwitchRow label="Offers page is on" checked={v.offersPage.enabled} onChange={(x) => page({ enabled: x })} />
          <SwitchRow label="Link in the header menu" checked={v.offersPage.showInNav} onChange={(x) => page({ showInNav: x })} />
          {text("op-title", "Page title / menu label", v.offersPage.title, (x) => page({ title: x }))}
        </div>
      </Panel>

      <Panel id="shop-offers" title="Offers" description="Products on offer. Pick them here; products with a “compare at” price can join automatically.">
        <SwitchRow label="Offers are on" checked={v.offers.enabled} onChange={(x) => off({ enabled: x })} />
        {v.offers.enabled && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {text("of-t", "Heading", v.offers.title, (x) => off({ title: x }))}
              {text("of-s", "Text below", v.offers.subtitle, (x) => off({ subtitle: x }), 200)}
            </div>
            <SwitchRow label="Also include every discounted product" hint="Any product with a compare-at price above its price" checked={v.offers.includeDiscounted} onChange={(x) => off({ includeDiscounted: x })} />
            <ProductPicker label="Offer products" products={products} value={v.offers.productIds} onChange={(ids) => off({ productIds: ids })} />
          </>
        )}
      </Panel>

      <Panel id="shop-hot" title="Hot deals" description="A short list of limited-time deals, with an optional countdown.">
        <SwitchRow label="Hot deals are on" checked={v.hotDeals.enabled} onChange={(x) => hot({ enabled: x })} />
        {v.hotDeals.enabled && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {text("hd-t", "Heading", v.hotDeals.title, (x) => hot({ title: x }))}
              {text("hd-s", "Text below", v.hotDeals.subtitle, (x) => hot({ subtitle: x }), 200)}
              <Field label="Deals end (optional)" htmlFor="hd-end" hint="Shows a countdown; empty = no end date">
                <TextInput id="hd-end" type="datetime-local" value={v.hotDeals.endsAt.slice(0, 16)} onChange={(e) => hot({ endsAt: e.target.value })} />
              </Field>
            </div>
            <ProductPicker label="Hot deal products" products={products} value={v.hotDeals.productIds} onChange={(ids) => hot({ productIds: ids })} />
          </>
        )}
      </Panel>

      <Panel id="shop-best" title="Most ordered" description="Best sellers, worked out from paid orders, or chosen by you.">
        <SwitchRow label="Most ordered is on" checked={v.bestsellers.enabled} onChange={(x) => best({ enabled: x })} />
        {v.bestsellers.enabled && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {text("bs-t", "Heading", v.bestsellers.title, (x) => best({ title: x }))}
              {text("bs-s", "Text below", v.bestsellers.subtitle, (x) => best({ subtitle: x }), 200)}
            </div>
            <Choice
              label="Which products"
              value={v.bestsellers.mode}
              onChange={(x) => best({ mode: x })}
              columns={2}
              options={[
                { value: "auto", label: "Automatic", hint: "Most units sold in paid orders (top-rated fill in until there are sales)" },
                { value: "manual", label: "Choose myself", hint: "The products picked below" },
              ]}
            />
            <RangeField label="How many" value={v.bestsellers.count} min={2} max={24} unit="" onChange={(x) => best({ count: x })} />
            {v.bestsellers.mode === "manual" && <ProductPicker label="Most ordered products" products={products} value={v.bestsellers.productIds} onChange={(ids) => best({ productIds: ids })} />}
          </>
        )}
      </Panel>

      <SaveBar {...s} label="Save shopping settings" />
    </div>
  );
}

/** Search-and-tick product chooser that keeps the chosen order. */
function ProductPicker({ label, products, value, onChange }: { label: string; products: PickerProduct[]; value: string[]; onChange: (ids: string[]) => void }) {
  const [q, setQ] = useState("");
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const chosen = value.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
  const results = products.filter((p) => !value.includes(p.id) && p.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8);
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };
  const thumb = (p: PickerProduct) => (
    <span className="relative size-10 shrink-0 overflow-hidden rounded-sm bg-surface">{p.image && <Image src={p.image} alt="" fill sizes="40px" className="object-cover" />}</span>
  );

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{label} <span className="text-muted">({chosen.length})</span></p>
      {chosen.length > 0 && (
        <ol className="space-y-1.5">
          {chosen.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3 rounded-md border border-line bg-paper px-2 py-1.5">
              {thumb(p)}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{p.name}</span>
                <span className="text-xs text-muted">{formatINR(p.price)}{p.status !== "ACTIVE" ? " · not active (hidden in store)" : ""}</span>
              </span>
              <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface disabled:opacity-30"><ArrowUp className="size-3.5" /></button>
              <button type="button" aria-label="Move down" disabled={i === chosen.length - 1} onClick={() => move(i, 1)} className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface disabled:opacity-30"><ArrowDown className="size-3.5" /></button>
              <button type="button" aria-label={`Remove ${p.name}`} onClick={() => onChange(value.filter((x) => x !== p.id))} className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-danger"><X className="size-4" /></button>
            </li>
          ))}
        </ol>
      )}
      <label className="relative block">
        <span className="sr-only">Find a product to add</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <TextInput className="pl-9" placeholder="Search products to add…" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      {(q || chosen.length === 0) && (
        <ul className="divide-y divide-line rounded-md border border-line">
          {results.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => value.length < 48 && onChange([...value, p.id])} className="flex w-full items-center gap-3 px-2 py-1.5 text-left hover:bg-surface">
                {thumb(p)}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{p.name}</span>
                  <span className="text-xs text-muted">{formatINR(p.price)}{p.discounted ? " · discounted" : ""}</span>
                </span>
                <span className="text-xs font-medium text-accent">Add</span>
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="px-3 py-2 text-sm text-muted">No matching products.</li>}
        </ul>
      )}
    </div>
  );
}
