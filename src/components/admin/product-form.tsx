"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Copy, ImageIcon, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { saveProductAction } from "@/actions/admin/catalog.actions";
import { Button } from "@/components/ui/button";
import { AVAILABILITY, PRODUCT_STATUS } from "@/lib/constants";
import { cn, slugify } from "@/lib/utils";
import type { ProductFormValues } from "@/services/admin/catalog-admin.service";
import { type CategoryForm } from "@/lib/category-fields";
import { Field, Select, TextArea, TextInput, Toggle } from "./form";
import { ImageUploader, type UploadedImage } from "./image-uploader";

type Option = { id: string; name: string };
/** A category from Admin → Categories (top-level ones are the product "types"). */
type CategoryOption = Option & { label: string; parentId: string | null; isActive?: boolean };
type Variant = ProductFormValues["variants"][number] & { key: string };

const LABEL = {
  READY_STOCK: "Ready to ship",
  MADE_TO_ORDER: "Made to order",
  SOLD: "Sold",
  DRAFT: "Draft (hidden)",
  ACTIVE: "Active (visible in store)",
  ARCHIVED: "Archived (hidden)",
} as const;

/** Stored product kind, from the top-level category: craft / kit / art categories → CRAFT, the rest → CERAMIC. */
const kindOf = (root?: { name: string }) => (root && /craft|kit|\bart\b/i.test(root.name) ? "CRAFT" : "CERAMIC");

let keySeed = 0;
const newKey = () => `v${Date.now()}-${keySeed++}`;

const blankVariant = (key = newKey()): Variant => ({ key, id: "", glaze: "", size: "", sku: "", price: 0, compareAtPrice: "", stock: 0, isActive: true, image: null, images: [] });

const EMPTY: Omit<ProductFormValues, "id"> = {
  name: "", slug: "", type: "" as ProductFormValues["type"], status: "DRAFT", availability: "READY_STOCK", category: "", isUnique: false, leadTimeDays: "",
  patternName: "", description: "", capacity: "", dimensions: "", care: "", kitContents: [], tags: [], images: [], variants: [], attributes: {},
};

export function ProductForm({
  initial,
  categories,
  glazes,
  sizes,
  categoryForms = {},
  patternNames = [],
}: {
  initial: ProductFormValues | null;
  /** Category id → extra fields and hidden built-in inputs (Admin → Categories). */
  categoryForms?: Record<string, CategoryForm>;
  categories: CategoryOption[];
  /** Pattern names already used on other products (suggestions). */
  patternNames?: string[];
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
    category: initial?.category ?? "",
    // Initial rows get deterministic keys so server and client render identical ids (no hydration mismatch).
    variants: (initial?.variants.length ? initial.variants : [blankVariant("init-0")]).map((x, i) => ({ ...x, key: x.id || `init-${i}` })) as Variant[],
  }));
  const [kitText, setKitText] = useState((initial?.kitContents ?? []).join("\n"));
  const [tagText, setTagText] = useState((initial?.tags ?? []).join(", "));

  // Type = top-level category; Category = that type or one of its subcategories (always the live list).
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const rootOf = (id: string) => {
    let c = byId.get(id);
    for (let n = 0; c?.parentId && byId.has(c.parentId) && n < 5; n++) c = byId.get(c.parentId);
    return c;
  };
  const types = categories.filter((c) => !c.parentId);
  const root = rootOf(v.category);
  const inType = root ? categories.filter((c) => rootOf(c.id)?.id === root.id) : [];
  const kind = kindOf(root);
  const chooseType = (rootId: string) => {
    setSaved(false);
    // Pick the type itself; its own fields (and inherited ones) show straight away.
    setV((s) => ({ ...s, category: rootId, type: kindOf(byId.get(rootId)) as typeof s.type }));
  };

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
  // Functional update: photo uploads finish later and must not overwrite other edits.
  const setVariant = (key: string, patch: Partial<Variant>) => {
    setSaved(false);
    setV((s) => ({ ...s, variants: s.variants.map((x) => (x.key === key ? { ...x, ...patch } : x)) }));
  };

  // Variants are a list of collapsible rows: a summary line, opened to edit.
  // One variant: open. Several: all closed until clicked.
  const [openKeys, setOpenKeys] = useState<Set<string>>(() => new Set(v.variants.length === 1 ? [v.variants[0]!.key] : []));
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const variantRefs = useRef(new Map<string, HTMLLIElement>());
  useEffect(() => {
    if (!focusKey) return;
    variantRefs.current.get(focusKey)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setFocusKey(null);
  }, [focusKey]);
  const toggleVariant = (key: string) =>
    setOpenKeys((o) => {
      const n = new Set(o);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  /** Add a variant (optionally copying colour, photos and prices, right below the source) and open it. */
  const addVariant = (from?: Variant) => {
    const row: Variant = {
      ...blankVariant(),
      ...(from ? { glaze: from.glaze, price: from.price, compareAtPrice: from.compareAtPrice, stock: from.stock, images: from.images, image: from.image } : {}),
    };
    setSaved(false);
    setV((s) => {
      const at = from ? s.variants.findIndex((x) => x.key === from.key) + 1 : s.variants.length;
      const next = [...s.variants];
      next.splice(at, 0, row);
      return { ...s, variants: next };
    });
    setOpenKeys(new Set([row.key]));
    setFocusKey(row.key);
  };
  const removeVariant = (key: string) => {
    setSaved(false);
    setV((s) => ({ ...s, variants: s.variants.filter((y) => y.key !== key) }));
  };
  const variantPhoto = (x: Variant) => x.images[0] ?? x.image ?? null;

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
    if (!v.category) {
      setError("Choose a type and category first.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const payload = {
      ...v,
      type: kind as typeof v.type,
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

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] 2xl:grid-cols-[1fr_400px]">
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
              <Field label="Type" htmlFor="type" hint={types.length ? "Your categories from Admin → Categories" : <>No categories yet. <Link className="underline" href="/admin/categories">Add one first</Link>.</>}>
                <Select id="type" required value={root?.id ?? ""} onChange={(e) => chooseType(e.target.value)}>
                  <option value="">Choose a product type</option>
                  {types.map((t) => <option key={t.id} value={t.id}>{t.name}{t.isActive === false ? " (hidden)" : ""}</option>)}
                </Select>
              </Field>
              <Field label="Category" htmlFor="category" hint={root ? "Fields below change with the category" : "Choose a type first"}>
                <Select id="category" required disabled={!root} value={v.category} onChange={(e) => set("category", e.target.value)}>
                  {!root && <option value="">Choose a type first</option>}
                  {inType.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id === root?.id ? `All ${c.name} (no subcategory)` : c.label.split(" › ").slice(1).join(" › ")}
                      {c.isActive === false ? " (hidden)" : ""}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Description" htmlFor="description" className="sm:col-span-2">
                <TextArea id="description" rows={5} value={v.description} onChange={(e) => set("description", e.target.value)} />
              </Field>
            </div>
          </section>

          <section className={section} aria-labelledby="sec-media">
            <h2 id="sec-media" className={h2}>Photos</h2>
            <ImageUploader folder="products" path={[v.slug || slugify(v.name) || "new-product"]} value={v.images as UploadedImage[]} onChange={(imgs) => set("images", imgs)} />
          </section>

          <section className={section} aria-labelledby="sec-variants">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 id="sec-variants" className="font-sans text-[15px] font-semibold">Variants, prices &amp; stock <span className="font-normal text-muted">({v.variants.length})</span></h2>
              <Button type="button" size="sm" variant="secondary" onClick={() => addVariant()} disabled={v.isUnique && v.variants.length >= 1}>
                <Plus /> Add variant
              </Button>
            </div>
            <p className="mb-4 text-sm text-muted">
              One variant per colour and size, each with its own price, stock and photos. Click a variant to open it. Use <b>Add another size</b> inside a variant to copy its colour and photos with a new size and price.
              {glazes.length === 0 && <> <Link href="/admin/categories#glazes" className="underline">Add colours</Link> to offer colour options.</>}
            </p>
            <ul className="space-y-2">
              {v.variants.map((x, i) => {
                const open = openKeys.has(x.key);
                const photo = variantPhoto(x);
                const hex = glazes.find((g) => g.id === x.glaze)?.hex;
                const title = [glazeName.get(x.glaze), sizeName.get(x.size)].filter(Boolean).join(" · ") || "No colour or size";
                return (
                  <li
                    key={x.key}
                    ref={(el) => {
                      if (el) variantRefs.current.set(x.key, el);
                      else variantRefs.current.delete(x.key);
                    }}
                    className={cn("overflow-hidden rounded-md border bg-canvas/60 transition-colors", open ? "border-ink/30" : "border-line", !x.isActive && "opacity-70")}
                  >
                    {/* Summary row: click to open / close */}
                    <button
                      type="button"
                      onClick={() => toggleVariant(x.key)}
                      aria-expanded={open}
                      aria-controls={`variant-${x.key}`}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-surface/60 sm:px-4"
                    >
                      <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-surface">
                        {photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photo.url} alt="" className="size-full object-cover" />
                        ) : hex ? (
                          <span className="size-6 rounded-full border border-ink/15" style={{ backgroundColor: hex }} />
                        ) : (
                          <ImageIcon className="size-4 text-muted" aria-hidden />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          <span className="text-muted">Variant {i + 1} · </span>
                          {title}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {x.price ? `₹${x.price}` : "No price yet"}
                          {x.compareAtPrice ? <> · <s>₹{x.compareAtPrice}</s></> : null}
                          {" · "}
                          {v.availability === "MADE_TO_ORDER" ? "made to order" : `${x.stock} in stock`}
                          {x.images.length > 0 && ` · ${x.images.length} photo${x.images.length > 1 ? "s" : ""}`}
                          {!x.isActive && " · hidden"}
                        </span>
                      </span>
                      <ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} aria-hidden />
                    </button>

                    {open && (
                      <div id={`variant-${x.key}`} className="space-y-4 border-t border-line px-3 pb-4 pt-4 sm:px-4">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {shown("glaze") && (
                            <Field label="Colour" htmlFor={`g-${x.key}`}>
                              <Select id={`g-${x.key}`} value={x.glaze} onChange={(e) => setVariant(x.key, { glaze: e.target.value })}>
                                <option value="">No colour option</option>
                                {glazeChoices(x).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                              </Select>
                            </Field>
                          )}
                          {shown("size") && (
                            <Field label="Size" htmlFor={`s-${x.key}`}>
                              <Select id={`s-${x.key}`} value={x.size} onChange={(e) => setVariant(x.key, { size: e.target.value })}>
                                <option value="">No size option</option>
                                {sizeChoices(x).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </Select>
                            </Field>
                          )}
                          <Field label="SKU" htmlFor={`sku-${x.key}`} hint={x.sku ? undefined : `Auto: ${suggestSku(x) || "set a slug"}`}>
                            <TextInput id={`sku-${x.key}`} value={x.sku} onChange={(e) => setVariant(x.key, { sku: e.target.value.toUpperCase() })} />
                          </Field>
                          <Field label="Price (₹)" htmlFor={`p-${x.key}`} hint="Price for this colour and size">
                            <TextInput id={`p-${x.key}`} type="number" inputMode="decimal" min={0} step="0.01" required value={x.price || ""} onChange={(e) => setVariant(x.key, { price: Number(e.target.value) })} />
                          </Field>
                          <Field label="Compare-at price (₹)" htmlFor={`c-${x.key}`} hint="Optional. Shows as a sale.">
                            <TextInput id={`c-${x.key}`} type="number" inputMode="decimal" min={0} step="0.01" value={x.compareAtPrice} onChange={(e) => setVariant(x.key, { compareAtPrice: e.target.value === "" ? "" : Number(e.target.value) })} />
                          </Field>
                          <Field label="Stock" htmlFor={`st-${x.key}`} hint={v.availability === "MADE_TO_ORDER" ? "Not limited for made-to-order" : undefined}>
                            <TextInput id={`st-${x.key}`} type="number" inputMode="numeric" min={0} step={1} value={x.stock} onChange={(e) => setVariant(x.key, { stock: Math.max(0, Math.floor(Number(e.target.value))) })} />
                          </Field>
                        </div>

                        <div className="rounded-md border border-dashed border-line p-3">
                          <p className="mb-1 text-sm font-medium">Photos for this variant</p>
                          <p className="mb-3 text-xs text-muted">Shown when a customer picks this colour and size. 1st = main, 2nd = side, 3rd = bottom. None = the product photos.</p>
                          <ImageUploader
                            folder="products"
                            path={[v.slug || slugify(v.name) || "new-product", glazeName.get(x.glaze) ?? "variant"]}
                            max={3}
                            label={`Variant ${i + 1} photo`}
                            value={x.images as UploadedImage[]}
                            onChange={(imgs) => setVariant(x.key, { images: imgs, image: imgs[0] ?? null })}
                          />
                          {v.images.length > 0 && x.images.length < 3 && (
                            <div className="mt-3 max-w-sm">
                              <Select
                                aria-label="Use one of the product photos"
                                value=""
                                onChange={(e) => {
                                  const im = v.images.find((p) => p.url === e.target.value);
                                  if (im && !x.images.some((p) => p.url === im.url)) setVariant(x.key, { images: [...x.images, im], image: x.images[0] ?? im });
                                }}
                              >
                                <option value="">…or use a product photo</option>
                                {v.images.map((im, j) => <option key={im.url} value={im.url}>Product photo {j + 1}{im.alt ? `: ${im.alt}` : ""}</option>)}
                              </Select>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <Toggle label="Available" checked={x.isActive} onChange={(on) => setVariant(x.key, { isActive: on })} />
                          <div className="flex flex-wrap gap-2">
                            {!v.isUnique && (
                              <Button type="button" size="sm" variant="secondary" onClick={() => addVariant(x)}>
                                <Copy /> Add another size
                              </Button>
                            )}
                            <Button type="button" size="sm" variant="quiet" disabled={v.variants.length === 1} onClick={() => removeVariant(x.key)} className="text-danger">
                              <Trash2 /> Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
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
              {shown("patternName") && (
                <Field
                  label="Pattern"
                  htmlFor="pattern"
                  hint={<>Shown as the Pattern filter on the category page. <Link className="underline" href="/admin/categories#patterns">Manage patterns</Link></>}
                >
                  <Select id="pattern" value={patternNames.find((n) => n.toLowerCase() === v.patternName.trim().toLowerCase()) ?? v.patternName} onChange={(e) => set("patternName", e.target.value)}>
                    <option value="">No pattern</option>
                    {patternNames.map((n) => <option key={n} value={n}>{n}</option>)}
                    {/* A name typed before the pattern list existed stays selectable. */}
                    {v.patternName && !patternNames.some((n) => n.toLowerCase() === v.patternName.trim().toLowerCase()) && <option value={v.patternName}>{v.patternName} (not in the list)</option>}
                  </Select>
                </Field>
              )}
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
              {(kind === "CRAFT" || kitText.trim() !== "") && shown("kitContents") && (
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
        <div className="mx-auto flex max-w-[1200px] items-center 2xl:max-w-[1600px] 3xl:max-w-[2000px] justify-between gap-3 px-4 py-3 md:px-8 lg:px-12">
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
