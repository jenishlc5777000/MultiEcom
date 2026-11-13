"use client";

import { useT } from "@/components/labels-provider";
import type { LabelKey } from "@/lib/labels";
import { SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export type FilterValues = { availability?: string; min?: string; max?: string; sort?: string; cat?: string };
type CategoryOption = { slug: string; name: string; depth: 0 | 1 };

const SORT_LABELS: Record<string, LabelKey> = {
  relevance: "list.sortBest",
  new: "list.sortNew",
  "price-asc": "list.sortPriceAsc",
  "price-desc": "list.sortPriceDesc",
  rating: "list.sortRated",
};

/**
 * Filter + sort form for product lists (GET, so results are shareable links).
 * "bar" sits above the list; "sidebar" is a vertical panel. Changing a select
 * submits straight away.
 */
export function ProductFilters({
  action,
  values,
  hidden = {},
  layout = "bar",
  show = { availability: true, price: true, sort: true },
  sorts = ["new", "price-asc", "price-desc", "rating"],
  categories,
}: {
  action: string;
  values: FilterValues;
  /** Extra params to keep (e.g. the search query). */
  hidden?: Record<string, string>;
  layout?: "bar" | "sidebar";
  show?: { availability?: boolean; price?: boolean; sort?: boolean };
  sorts?: string[];
  categories?: CategoryOption[];
}) {
  const t = useT();
  const form = useRef<HTMLFormElement>(null);
  const submit = () => form.current?.requestSubmit();
  const active = Boolean(values.availability || values.min || values.max || values.cat);
  const clearHref = `${action}${Object.keys(hidden).length ? `?${new URLSearchParams(hidden)}` : ""}`;
  const field = "min-h-10 w-full rounded-md border border-line bg-paper px-3 text-sm focus:border-ink focus:outline-none";
  const sidebar = layout === "sidebar";

  return (
    <form ref={form} action={action} className={cn(sidebar ? "fx-panel space-y-5 rounded-lg border border-line bg-paper/60 p-5" : "flex flex-wrap items-end gap-3")} aria-label="Filter products">
      {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {sidebar && (
        <p className="flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal className="size-4" aria-hidden /> Filter</p>
      )}

      {categories && categories.length > 0 && (
        <label className={cn("block space-y-1.5", !sidebar && "min-w-40")}>
          <span className="text-xs font-medium text-muted">{t("list.filterCategory")}</span>
          <select name="cat" defaultValue={values.cat ?? ""} onChange={submit} className={field}>
            <option value="">{t("nav.allCategories")}</option>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.depth ? `  ↳ ${c.name}` : c.name}</option>)}
          </select>
        </label>
      )}

      {show.availability && (
        <label className={cn("block space-y-1.5", !sidebar && "min-w-40")}>
          <span className="text-xs font-medium text-muted">{t("list.availability")}</span>
          <select name="availability" defaultValue={values.availability ?? ""} onChange={submit} className={field}>
            <option value="">{t("list.any")}</option>
            <option value="READY_STOCK">{t("list.readyToShip")}</option>
            <option value="MADE_TO_ORDER">{t("list.madeToOrder")}</option>
          </select>
        </label>
      )}

      {show.price && (
        <fieldset className="space-y-1.5">
          <legend className="text-xs font-medium text-muted">{t("list.price")} (₹)</legend>
          <div className="flex items-center gap-2">
            <input name="min" type="number" min={0} inputMode="numeric" placeholder={t("list.min")} defaultValue={values.min} aria-label="Minimum price" className={cn(field, "w-24")} />
            <span className="text-muted">–</span>
            <input name="max" type="number" min={0} inputMode="numeric" placeholder={t("list.max")} defaultValue={values.max} aria-label="Maximum price" className={cn(field, "w-24")} />
          </div>
        </fieldset>
      )}

      {show.sort && (
        <label className={cn("block space-y-1.5", !sidebar && "min-w-44 sm:ml-auto")}>
          <span className="text-xs font-medium text-muted">{t("list.sortBy")}</span>
          <select name="sort" defaultValue={values.sort ?? sorts[0]} onChange={submit} className={field}>
            {sorts.map((s) => <option key={s} value={s}>{SORT_LABELS[s] ? t(SORT_LABELS[s]) : s}</option>)}
          </select>
        </label>
      )}

      <div className={cn("flex items-center gap-3", sidebar && "pt-1")}>
        {show.price && <button type="submit" className="btn-primary inline-flex min-h-10 items-center rounded-pill bg-ink px-4 text-sm font-medium text-canvas">{t("list.apply")}</button>}
        {active && (
          <Link href={clearHref} className="inline-flex items-center gap-1 text-sm text-muted underline-offset-4 hover:underline">
            <X className="size-3.5" aria-hidden /> Clear
          </Link>
        )}
      </div>
    </form>
  );
}
