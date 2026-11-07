"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { saveProductAction } from "@/actions/admin/catalog.actions";
import { Button } from "@/components/ui/button";
import { AVAILABILITY, PRODUCT_STATUS, PRODUCT_TYPES } from "@/lib/constants";
import { cn, slugify } from "@/lib/utils";
import type { ProductFormValues } from "@/services/admin/catalog-admin.service";
import { type CategoryForm } from "@/lib/category-fields";
import { Field, Select, TextArea, TextInput, Toggle } from "./form";
import { ImageUploader, type UploadedImage } from "./image-uploader";

type Option = { id: string; name: string };
type Variant = ProductFormValues["variants"][number] & { key: string };

const LABEL = {
  READY_STOCK: "Ready to ship",
  MADE_TO_ORDER: "Made to order",
  SOLD: "Sold",
  DRAFT: "Draft (hidden)",
  ACTIVE: "Active (visible in store)",
  ARCHIVED: "Archived (hidden)",
  CERAMIC: "Ceramic",
  CRAFT: "Craft kit",
} as const;

let keySeed = 0;
const newKey = () => `v${Date.now()}-${keySeed++}`;

const blankVariant = (key = newKey()): Variant => ({ key, id: "", glaze: "", size: "", sku: "", price: 0, compareAtPrice: "", stock: 0, isActive: true, image: null });

const EMPTY: Omit<ProductFormValues, "id"> = {
  name: "", slug: "", type: "CERAMIC", status: "DRAFT", availability: "READY_STOCK", category: "", isUnique: false, leadTimeDays: "",
  patternName: "", description: "", capacity: "", dimensions: "", care: "", kitContents: [], tags: [], images: [], variants: [], attributes: {},
};

export function ProductForm({
  initial,
  categories,
  glazes,
  sizes,
  categoryForms = {},
}: {
  initial: ProductFormValues | null;
  /** Category id → extra fields and hidden built-in inputs (Admin → Categories). */
  categoryForms?: Record<string, CategoryForm>;
  categories: Option[];
  glazes: (Option & { hex: string })[];
  sizes: Option[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [v, setV] = useState(() => ({
    ...(initial ?? EMPTY),
    category: initial?.category ?? categories[0]?.id ?? "",
    // Initial rows get deterministic keys so server and client render identical ids (no hydration mismatch).
    variants: (initial?.variants.length ? initial.variants : [blankVariant("init-0")]).map((x, i) => ({ ...x, key: x.id || `init-${i}` })) as Variant[],
  }));
  const [kitText, setKitText] = useState((initial?.kitContents ?? []).join("\n"));
  const [tagText, setTagText] = useState((initial?.tags ?? []).join(", "));

  const form = categoryForms[v.category] ?? { fields: [], hide: [], allowedGlazes: [], allowedSizes: [] };
  // Only the glazes / sizes allowed for this category (a value already chosen stays listed).
  const glazeChoices = (x: Variant) => (form.allowedGlazes.length ? glazes.filter((g) => form.allowedGlazes.includes(g.id) || g.id === x.glaze) : glazes);
  const sizeChoices = (x: Variant) => (form.allowedSizes.length ? sizes.filter((s) => form.allowedSizes.includes(s.id) || s.id === x.size) : sizes);
  const shown = (k: string) => !form.hide.includes(k);
  const setAttr = (key: string, value: string) => set("attributes", { ...v.attributes, [key]: value });

  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => {
    setSaved(false);
    setV((s) => ({ ...s, [k]: val }));
  };
  const setVariant = (key: string, patch: Partial<Variant>) => set("variants", v.variants.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  const glazeName = useMemo(() => new Map(glazes.map((g) => [g.id, g.name])), [glazes]);
  const sizeName = useMemo(() => new Map(sizes.map((s) => [s.id, s.name])), [sizes]);

  const suggestSku = (x: Variant) =>
    [v.slug.split("-").map((w) => w.slice(0, 4)).join("").slice(0, 10), glazeName.get(x.glaze)?.slice(0, 3), sizeName.get(x.size)?.replace(/\D/g, "") || sizeName.get(x.size)?.slice(0, 2)]
      .filter(Boolean)
      .join("-")
      .toUpperCase();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      ...v,
      kitContents: kitText.split("\n").map((s) => s.trim()).filter(Boolean),
      tags: tagText.split(",").map((s) => s.trim()).filter(Boolean),
      variants: v.variants.map(({ key: _key, ...rest }) => ({ ...rest, id: rest.id || undefined, sku: rest.sku || suggestSku({ ...rest, key: _key }) })),
    };
    start(async () => {
      const res = await saveProductAction(initial?.id ?? null, payload);
      if (!res.ok) {
        setError(res.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setSaved(true);
      if (!initial) router.push(`/admin/products/${res.data.id}?created=1`);
      else router.refresh();
    });
  }

  const section = "rounded-lg border border-line bg-paper/60 p-5 md:p-6";
  const h2 = "mb-5 font-sans text-[15px] font-semibold";

  return (
    <form onSubmit={submit} className="space-y-6 pb-28" noValidate>
      {error && (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className={section} aria-labelledby="sec-basics">
            <h2 id="sec-basics" className={h2}>Basics</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="name" className="sm:col-span-2">
                <TextInput
                  id="name"
                  required
                  value={v.name}
                  onChange={(e) => {
                    set("name", e.target.value);
                    if (!slugTouched) setV((s) => ({ ...s, name: e.target.value, slug: slugify(e.target.value) }));
                  }}
                />
              </Field>
              <Field label="URL slug" htmlFor="slug" hint={`Shown at /products/${v.slug || "…"}`} className="sm:col-span-2">
                <TextInput
                  id="slug"
                  required
                  value={v.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", slugify(e.target.value));
                  }}
                />
              </Field>
              <Field label="Type" htmlFor="type">
                <Select id="type" value={v.type} onChange={(e) => set("type", e.target.value as typeof v.type)}>
                  {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{LABEL[t]}</option>)}
                </Select>
              </Field>
              <Field label="Category" htmlFor="category" hint={categories.length ? undefined : <>No categories yet. <Link className="underline" href="/admin/categories">Add one first</Link>.</>}>
                <Select id="category" required value={v.category} onChange={(e) => set("category", e.target.value)}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="Description" htmlFor="description" className="sm:col-span-2">
                <TextArea id="description" rows={5} value={v.description} onChange={(e) => set("description", e.target.value)} />
              </Field>
            </div>
          </section>

          <section className={section} aria-labelledby="sec-media">
            <h2 id="sec-media" className={h2}>Photos</h2>
            <ImageUploader folder="products" value={v.images as UploadedImage[]} onChange={(imgs) => set("images", imgs)} />
          </section>

          <section className={section} aria-labelledby="sec-variants">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 id="sec-variants" className="font-sans text-[15px] font-semibold">Variants, prices &amp; stock</h2>
              <Button type="button" size="sm" variant="secondary" onClick={() => set("variants", [...v.variants, blankVariant()])} disabled={v.isUnique && v.variants.length >= 1}>
                <Plus /> Add variant
              </Button>
            </div>
            <p className="mb-4 text-sm text-muted">
              One row per glaze and size combination. Leave glaze or size empty if the product doesn&apos;t vary by it. Prices are in rupees.
              {glazes.length === 0 && <> <Link href="/admin/categories#glazes" className="underline">Add glazes</Link> to offer colour options.</>}
            </p>
            <ul className="space-y-3">
              {v.variants.map((x, i) => (
                <li key={x.key} className={cn("rounded-md border border-line bg-canvas/60 p-4", !x.isActive && "opacity-60")}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Variant {i + 1}
                      {(x.glaze || x.size) && <span className="font-normal text-muted"> · {[glazeName.get(x.glaze), sizeName.get(x.size)].filter(Boolean).join(" · ")}</span>}
                    </p>
                    <button
                      type="button"
                      aria-label={`Remove variant ${i + 1}`}
                      disabled={v.variants.length === 1}
                      onClick={() => set("variants", v.variants.filter((y) => y.key !== x.key))}
                      className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-danger disabled:opacity-30"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {shown("glaze") && <Field label="Glaze" htmlFor={`g-${x.key}`}>
                      <Select id={`g-${x.key}`} value={x.glaze} onChange={(e) => setVariant(x.key, { glaze: e.target.value })}>
                        <option value="">No glaze option</option>
                        {glazeChoices(x).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </Select>
                    </Field>}
                    {shown("size") && <Field label="Size" htmlFor={`s-${x.key}`}>
                      <Select id={`s-${x.key}`} value={x.size} onChange={(e) => setVariant(x.key, { size: e.target.value })}>
                        <option value="">No size option</option>
                        {sizeChoices(x).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </Select>
                    </Field>}
                    <Field label="SKU" htmlFor={`sku-${x.key}`} hint={x.sku ? undefined : `Auto: ${suggestSku(x) || "set a slug"}`}>
                      <TextInput id={`sku-${x.key}`} value={x.sku} onChange={(e) => setVariant(x.key, { sku: e.target.value.toUpperCase() })} />
                    </Field>
                    <Field label="Price (₹)" htmlFor={`p-${x.key}`}>
                      <TextInput id={`p-${x.key}`} type="number" inputMode="decimal" min={0} step="0.01" required value={x.price || ""} onChange={(e) => setVariant(x.key, { price: Number(e.target.value) })} />
                    </Field>
                    <Field label="Compare-at price (₹)" htmlFor={`c-${x.key}`} hint="Optional. Shows as a sale.">
                      <TextInput id={`c-${x.key}`} type="number" inputMode="decimal" min={0} step="0.01" value={x.compareAtPrice} onChange={(e) => setVariant(x.key, { compareAtPrice: e.target.value === "" ? "" : Number(e.target.value) })} />
                    </Field>
                    <Field label="Stock" htmlFor={`st-${x.key}`} hint={v.availability === "MADE_TO_ORDER" ? "Not limited for made-to-order" : undefined}>
                      <TextInput id={`st-${x.key}`} type="number" inputMode="numeric" min={0} step={1} value={x.stock} onChange={(e) => setVariant(x.key, { stock: Math.max(0, Math.floor(Number(e.target.value))) })} />
                    </Field>
                    <Field label="Variant photo" htmlFor={`img-${x.key}`} className="sm:col-span-2">
                      <Select
                        id={`img-${x.key}`}
                        value={x.image?.url ?? ""}
                        onChange={(e) => setVariant(x.key, { image: v.images.find((im) => im.url === e.target.value) ?? null })}
                      >
                        <option value="">Use the product cover</option>
                        {v.images.map((im, j) => <option key={im.url} value={im.url}>Photo {j + 1}{im.alt ? `: ${im.alt}` : ""}</option>)}
                      </Select>
                    </Field>
                    <div className="flex items-end pb-2">
                      <Toggle label="Available" checked={x.isActive} onChange={(on) => setVariant(x.key, { isActive: on })} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className={section} aria-labelledby="sec-visibility">
            <h2 id="sec-visibility" className={h2}>Visibility</h2>
            <div className="space-y-4">
              <Field label="Status" htmlFor="status" hint="Only Active products appear in the store.">
                <Select id="status" value={v.status} onChange={(e) => set("status", e.target.value as typeof v.status)}>
                  {PRODUCT_STATUS.map((s) => <option key={s} value={s}>{LABEL[s]}</option>)}
                </Select>
              </Field>
              <Field label="Availability" htmlFor="availability">
                <Select id="availability" value={v.availability} onChange={(e) => set("availability", e.target.value as typeof v.availability)}>
                  {AVAILABILITY.map((s) => <option key={s} value={s}>{LABEL[s]}</option>)}
                </Select>
              </Field>
              {v.availability === "MADE_TO_ORDER" && (
                <Field label="Lead time (days)" htmlFor="lead">
                  <TextInput id="lead" type="number" min={1} max={365} value={v.leadTimeDays} onChange={(e) => set("leadTimeDays", e.target.value === "" ? "" : Number(e.target.value))} />
                </Field>
              )}
              <Toggle
                label="One of a kind"
                description="A single piece. It shows as Sold once bought."
                checked={v.isUnique}
                onChange={(on) => {
                  set("isUnique", on);
                  if (on) setV((s) => ({ ...s, isUnique: true, variants: s.variants.slice(0, 1).map((x) => ({ ...x, stock: Math.min(1, x.stock) })) }));
                }}
              />
            </div>
          </section>

          <section className={section} aria-labelledby="sec-details">
            <h2 id="sec-details" className={h2}>Details</h2>
            <div className="space-y-4">
              {shown("patternName") && <Field label="Pattern name" htmlFor="pattern"><TextInput id="pattern" value={v.patternName} onChange={(e) => set("patternName", e.target.value)} /></Field>}
              {shown("capacity") && <Field label="Capacity" htmlFor="capacity"><TextInput id="capacity" placeholder="e.g. 350 ml" value={v.capacity} onChange={(e) => set("capacity", e.target.value)} /></Field>}
              {shown("dimensions") && <Field label="Dimensions" htmlFor="dimensions"><TextInput id="dimensions" placeholder="e.g. 9 cm × 8 cm" value={v.dimensions} onChange={(e) => set("dimensions", e.target.value)} /></Field>}
              {shown("care") && <Field label="Care" htmlFor="care"><TextArea id="care" rows={3} value={v.care} onChange={(e) => set("care", e.target.value)} /></Field>}

              {/* Fields defined for this category in Admin → Categories */}
              {form.fields.map((f) => {
                const id = `attr-${f.key}`;
                const val = v.attributes[f.key] ?? "";
                const label = `${f.label}${f.required ? " *" : ""}`;
                const hint = f.unit ? `In ${f.unit}` : undefined;
                if (f.type === "textarea") return <Field key={f.key} label={label} htmlFor={id}><TextArea id={id} rows={3} placeholder={f.placeholder} value={val} onChange={(e) => setAttr(f.key, e.target.value)} /></Field>;
                if (f.type === "select")
                  return (
                    <Field key={f.key} label={label} htmlFor={id}>
                      <Select id={id} value={val} onChange={(e) => setAttr(f.key, e.target.value)}>
                        <option value="">Choose…</option>
                        {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </Select>
                    </Field>
                  );
                if (f.type === "boolean")
                  return (
                    <Field key={f.key} label={label} htmlFor={id}>
                      <Select id={id} value={val} onChange={(e) => setAttr(f.key, e.target.value)}>
                        <option value="">Not set</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </Select>
                    </Field>
                  );
                if (f.type === "color")
                  return (
                    <Field key={f.key} label={label} htmlFor={id}>
                      <span className="flex items-center gap-2">
                        <input type="color" aria-label={`${f.label} picker`} value={/^#[0-9a-fA-F]{6}$/.test(val) ? val : "#cccccc"} onChange={(e) => setAttr(f.key, e.target.value.toUpperCase())} className="h-11 w-12 rounded-md border border-line bg-paper p-1" />
                        <TextInput id={id} maxLength={7} placeholder="#A24A25" value={val} onChange={(e) => setAttr(f.key, e.target.value.trim())} />
                      </span>
                    </Field>
                  );
                return <Field key={f.key} label={label} htmlFor={id} hint={hint}><TextInput id={id} inputMode={f.type === "number" ? "decimal" : undefined} placeholder={f.placeholder} value={val} onChange={(e) => setAttr(f.key, e.target.value)} /></Field>;
              })}
              {v.type === "CRAFT" && shown("kitContents") && (
                <Field label="Kit contents" htmlFor="kit" hint="One item per line.">
                  <TextArea id="kit" rows={4} value={kitText} onChange={(e) => setKitText(e.target.value)} />
                </Field>
              )}
              <Field label="Search tags" htmlFor="tags" hint="Comma separated, e.g. gift, breakfast">
                <TextInput id="tags" value={tagText} onChange={(e) => setTagText(e.target.value)} />
              </Field>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/90 backdrop-blur lg:left-[248px]">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3 md:px-8 lg:px-12">
          <p className="text-sm text-muted" role="status">
            {pending ? "Saving…" : saved ? "All changes saved." : initial ? "Edits aren't live until you save." : "New product"}
          </p>
          <div className="flex gap-2">
            {initial && v.status === "ACTIVE" && (
              <Button asChild variant="secondary" size="sm"><Link href={`/products/${initial.slug}`} target="_blank">View in store</Link></Button>
            )}
            <Button type="submit" disabled={pending}>{initial ? "Save changes" : "Create product"}</Button>
          </div>
        </div>
      </div>
    </form>
  );
}
