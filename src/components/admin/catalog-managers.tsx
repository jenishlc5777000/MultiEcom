"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { CornerDownRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import {
  deleteCategoryAction,
  deleteGlazeAction,
  deleteSizeAction,
  saveCategoryAction,
  saveGlazeAction,
  saveSizeAction,
} from "@/actions/admin/catalog.actions";
import { setCategoryActiveAction } from "@/actions/admin/site.actions";
import { Button } from "@/components/ui/button";
import { cn, slugify } from "@/lib/utils";
import type { ActionResult } from "@/types/dto";
import { Field, Select, TextArea, TextInput, Toggle } from "./form";
import { ImageUploader, type UploadedImage } from "./image-uploader";
import { CategoryFieldsEditor } from "./category-fields-editor";
import type { CategoryField } from "@/lib/category-fields";
import { Pill } from "./ui";

/* Shared plumbing: run an action, show its error, refresh the server data. */
function useMutation() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<ActionResult<unknown>>, onOk?: () => void) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) return setError(res.error);
      onOk?.();
      router.refresh();
    });
  return { pending, error, run, setError };
}

const rowCls = "flex flex-wrap items-center gap-4 border-b border-line/70 px-5 py-3 last:border-b-0";
const iconBtn = "inline-flex size-touch items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink disabled:opacity-30";

/* ───────────── Categories → subcategories → sub-subcategories ───────────── */

type OptionRef = { id: string; name: string };

export type CategoryRow = {
  id: string; name: string; slug: string; description: string; sortOrder: number; isActive: boolean;
  image: UploadedImage | null; productCount: number;
  parentId: string | null; parentName: string; depth: 0 | 1 | 2; childCount: number;
  productsInChildrenOnly: boolean;
  options: { glazeLabel: string; sizeLabel: string; glazeStyle: "" | "photo" | "color" | "chips"; allowedGlazes: string[]; allowedSizes: string[] };
  /** Custom product fields (managed by the category fields editor); always sent back on save. */
  fields?: CategoryField[];
  hideFields?: string[];
};

const LEVEL_LABEL = ["Category", "Subcategory", "Sub-subcategory"] as const;

/** Which editor is open: an existing row, or a new category (optionally under a parent). */
type Editing = { id: string } | { newUnder: string | null } | null;

export function CategoryManager({ categories, glazes = [], sizes = [] }: { categories: CategoryRow[]; glazes?: OptionRef[]; sizes?: OptionRef[] }) {
  const [editing, setEditing] = useState<Editing>(categories.length ? null : { newUnder: null });
  const { pending, error, run } = useMutation();
  // Possible parents: categories and subcategories (three levels at most).
  const parents = categories.filter((c) => c.depth < 2);
  const close = () => setEditing(null);
  const isNewUnder = (parent: string | null) => editing !== null && "newUnder" in editing && editing.newUnder === parent;
  const editorFor = (props: { initial?: CategoryRow; defaultParent?: string | null; nextOrder: number }) => (
    <CategoryEditor {...props} parents={parents} glazes={glazes} sizes={sizes} onDone={close} />
  );

  const row = (c: CategoryRow) =>
    editing && "id" in editing && editing.id === c.id ? (
      <li key={c.id}>{editorFor({ initial: c, nextOrder: c.sortOrder })}</li>
    ) : (
      <li key={c.id} className={cn(rowCls, c.depth === 1 && "bg-surface/30 pl-10 md:pl-14", c.depth === 2 && "bg-surface/50 pl-16 md:pl-24")}>
        {c.depth > 0 && <CornerDownRight className="-ml-6 size-4 shrink-0 text-muted" aria-hidden />}
        <span className={cn("relative shrink-0 overflow-hidden rounded-md bg-surface", c.depth === 0 ? "size-12" : c.depth === 1 ? "size-10" : "size-8")}>
          {c.image && <Image src={c.image.url} alt="" fill sizes="48px" className="object-cover" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            {c.name}
            {c.depth > 0 && <Pill tone="muted" className="ml-2">{LEVEL_LABEL[c.depth]}</Pill>}
            {c.productsInChildrenOnly && c.childCount > 0 && <Pill tone="info" className="ml-2">Choose first</Pill>}
            {!c.isActive && <Pill tone="muted" className="ml-2">Hidden</Pill>}
          </p>
          <p className="text-xs text-muted">
            /category/{c.slug} · {c.productCount} product{c.productCount === 1 ? "" : "s"}
            {c.depth < 2 && ` · ${c.childCount} ${c.depth === 0 ? "subcategor" : "sub-subcategor"}${c.childCount === 1 ? "y" : "ies"}`} · order {c.sortOrder}
          </p>
        </div>
        {/* Quick on/off: hidden categories (and everything under them) disappear from the store */}
        <button
          type="button"
          role="switch"
          aria-checked={c.isActive}
          aria-label={`${c.isActive ? "Hide" : "Show"} ${c.name} in the store`}
          title={c.isActive ? "Visible in store: click to hide" : "Hidden: click to show"}
          disabled={pending}
          onClick={() => run(() => setCategoryActiveAction(c.id, !c.isActive))}
          className={cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50", c.isActive ? "bg-ready" : "bg-line")}
        >
          <span className={cn("inline-block size-5 rounded-full bg-white shadow transition-transform duration-300", c.isActive ? "translate-x-[22px]" : "translate-x-0.5")} />
        </button>
        {c.depth < 2 && (
          <Button size="sm" variant="quiet" onClick={() => setEditing({ newUnder: c.id })} disabled={isNewUnder(c.id)}>
            <Plus /> {c.depth === 0 ? "Subcategory" : "Sub-subcategory"}
          </Button>
        )}
        <button className={iconBtn} aria-label={`Edit ${c.name}`} onClick={() => setEditing({ id: c.id })}><Pencil className="size-4" /></button>
        <button
          className={cn(iconBtn, "hover:text-danger")}
          aria-label={`Delete ${c.name}`}
          disabled={pending}
          onClick={() => confirm(`Delete ${LEVEL_LABEL[c.depth].toLowerCase()} “${c.name}”?`) && run(() => deleteCategoryAction(c.id))}
        >
          <Trash2 className="size-4" />
        </button>
      </li>
    );

  const tops = categories.filter((c) => c.depth === 0);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-sans text-[15px] font-semibold">Categories, subcategories &amp; sub-subcategories</h2>
          <p className="text-xs text-muted">Up to three levels, e.g. Ceramics → Mugs → Tapered. Sub-subcategories never appear in the header menu.</p>
        </div>
        <Button size="sm" onClick={() => setEditing({ newUnder: null })} disabled={isNewUnder(null)}><Plus /> Add category</Button>
      </div>
      {isNewUnder(null) && editorFor({ nextOrder: tops.length + 1 })}
      <ul>
        {categories.map((c) => [
          row(c),
          isNewUnder(c.id) ? (
            <li key={`new-${c.id}`}>{editorFor({ defaultParent: c.id, nextOrder: categories.filter((k) => k.parentId === c.id).length + 1 })}</li>
          ) : null,
        ])}
      </ul>
      {categories.length === 0 && !isNewUnder(null) && <p className="px-5 py-8 text-center text-sm text-muted">No categories yet.</p>}
      {error && <p role="alert" className="px-5 pb-4 text-sm text-danger">{error}</p>}
    </div>
  );
}

function CategoryEditor({
  initial, parents, glazes, sizes, defaultParent = null, onDone, nextOrder,
}: { initial?: CategoryRow; parents: CategoryRow[]; glazes: OptionRef[]; sizes: OptionRef[]; defaultParent?: string | null; onDone: () => void; nextOrder: number }) {
  const { pending, error, run } = useMutation();
  const [f, setF] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    sortOrder: initial?.sortOrder ?? nextOrder,
    isActive: initial?.isActive ?? true,
    parent: initial ? initial.parentId ?? "" : defaultParent ?? "",
    images: initial?.image ? [initial.image] : ([] as UploadedImage[]),
    productsInChildrenOnly: initial?.productsInChildrenOnly ?? false,
    options: initial?.options ?? { glazeLabel: "", sizeLabel: "", glazeStyle: "" as const, allowedGlazes: [] as string[], allowedSizes: [] as string[] },
    // Custom fields are edited in their own editor; keep them on save.
    fields: initial?.fields ?? [],
    hideFields: initial?.hideFields ?? [],
  });
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const key = initial?.id ?? `new-${defaultParent ?? "top"}`;
  const parentRow = parents.find((p) => p.id === f.parent);
  const level = !f.parent ? 0 : parentRow?.depth === 1 ? 2 : 1;
  // Image folder: categories/<parent>/<subcategory>/… following the chosen parent.
  const categoryPath = [parentRow?.depth === 1 ? parentRow.parentName : "", parentRow?.name ?? "", f.slug || slugify(f.name) || "new-category"].filter(Boolean);
  // A category with children can only move where the tree stays within three levels.
  const parentOptions = parents.filter((p) => p.id !== initial?.id && p.parentId !== initial?.id && (!initial?.childCount || p.depth === 0) && !(initial?.depth === 0 && initial.childCount > 0));
  const canHaveParent = !(initial?.depth === 0 && (initial?.childCount ?? 0) > 0);
  const o = f.options;
  const setO = (patch: Partial<typeof o>) => setF((s) => ({ ...s, options: { ...s.options, ...patch } }));
  const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return (
    <form
      className={cn("space-y-4 border-b border-line bg-surface/40 px-5 py-5 animate-in fade-in-0", level === 1 && "md:pl-14", level === 2 && "md:pl-24")}
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveCategoryAction(initial?.id ?? null, { ...f, parent: f.parent || null, image: f.images[0] ?? null }), onDone);
      }}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_120px]">
        <Field label={`${LEVEL_LABEL[level]} name`} htmlFor={`cn-${key}`}>
          <TextInput
            id={`cn-${key}`}
            required
            value={f.name}
            onChange={(e) => setF((s) => ({ ...s, name: e.target.value, slug: slugTouched ? s.slug : slugify(e.target.value) }))}
          />
        </Field>
        <Field label="URL slug" htmlFor={`cs-${key}`} hint={level === 2 ? "Must be unique, e.g. mugs-tapered" : undefined}>
          <TextInput id={`cs-${key}`} required value={f.slug} onChange={(e) => { setSlugTouched(true); setF((s) => ({ ...s, slug: slugify(e.target.value) })); }} />
        </Field>
        <Field label="Parent" htmlFor={`cp-${key}`} hint={canHaveParent ? "None = top-level category" : "Has subcategories, so it stays top-level"}>
          <Select id={`cp-${key}`} value={f.parent} disabled={!canHaveParent} onChange={(e) => setF((s) => ({ ...s, parent: e.target.value }))}>
            <option value="">None (top-level)</option>
            {parentOptions.map((p) => <option key={p.id} value={p.id}>{p.depth === 1 ? `  ↳ ${p.parentName} › ${p.name}` : p.name}</option>)}
          </Select>
        </Field>
        <Field label="Sort order" htmlFor={`co-${key}`} hint="Lower shows first">
          <TextInput id={`co-${key}`} type="number" min={0} value={f.sortOrder} onChange={(e) => setF((s) => ({ ...s, sortOrder: Number(e.target.value) }))} />
        </Field>
      </div>
      <Field label="Description" htmlFor={`cd-${key}`} hint="Shown at the top of the category page.">
        <TextArea id={`cd-${key}`} rows={2} className="min-h-16" value={f.description} onChange={(e) => setF((s) => ({ ...s, description: e.target.value }))} />
      </Field>
      <div className="grid gap-6 md:grid-cols-[1fr_260px]">
        <div>
          <p className="mb-2 text-sm font-medium">Tile image</p>
          <ImageUploader folder="categories" path={categoryPath} max={1} label="Category image" value={f.images} onChange={(images) => setF((s) => ({ ...s, images }))} />
          <p className="mt-1 text-xs text-muted">Shown on category tiles and menus, and as the “All {f.name || "…"}” tile on this category&apos;s page.</p>
        </div>
        <div className="space-y-3">
          <Toggle label="Visible in store" description="Hidden categories (and everything under them) don't appear in menus." checked={f.isActive} onChange={(isActive) => setF((s) => ({ ...s, isActive }))} />
          {level < 2 && (
            <Toggle
              label="Customers choose a sub-subcategory first"
              description="E.g. Mugs → Tapered / Round / Classic: the page shows those first and lists products only after one is chosen."
              checked={f.productsInChildrenOnly}
              onChange={(productsInChildrenOnly) => setF((s) => ({ ...s, productsInChildrenOnly }))}
            />
          )}
        </div>
      </div>

      {/* Product options for this category (sub-levels inherit what they leave empty) */}
      <details className="rounded-md border border-line bg-paper/60 p-4" open={Boolean(o.glazeLabel || o.sizeLabel || o.glazeStyle || o.allowedGlazes.length || o.allowedSizes.length)}>
        <summary className="cursor-pointer text-sm font-semibold">Product options in this category</summary>
        <p className="mt-1 text-xs text-muted">Labels and choices on product pages, e.g. &quot;Glaze&quot; for mugs, &quot;Colour&quot; for kits. Empty = same as the parent category.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Glaze option name" htmlFor={`gl-${key}`} hint='Default "Glaze"'><TextInput id={`gl-${key}`} maxLength={30} placeholder="Glaze" value={o.glazeLabel} onChange={(e) => setO({ glazeLabel: e.target.value })} /></Field>
          <Field label="Size option name" htmlFor={`sl-${key}`} hint='Default "Size"'><TextInput id={`sl-${key}`} maxLength={30} placeholder="Size" value={o.sizeLabel} onChange={(e) => setO({ sizeLabel: e.target.value })} /></Field>
          <Field label="Show glazes as" htmlFor={`gs-${key}`}>
            <Select id={`gs-${key}`} value={o.glazeStyle} onChange={(e) => setO({ glazeStyle: e.target.value as typeof o.glazeStyle })}>
              <option value="">Same as parent</option>
              <option value="photo">Product photos (Nibbea style)</option>
              <option value="color">Colour dots + name</option>
              <option value="chips">Text buttons</option>
            </Select>
          </Field>
        </div>
        {glazes.length > 0 && (
          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-medium">Glazes offered <span className="font-normal text-muted">(none ticked = all)</span></legend>
            <div className="flex flex-wrap gap-2">
              {glazes.map((g) => (
                <label key={g.id} className="inline-flex items-center gap-2 rounded-pill border border-line px-3 py-1.5 text-sm">
                  <input type="checkbox" checked={o.allowedGlazes.includes(g.id)} onChange={() => setO({ allowedGlazes: toggleIn(o.allowedGlazes, g.id) })} /> {g.name}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {sizes.length > 0 && (
          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-medium">Sizes offered <span className="font-normal text-muted">(none ticked = all)</span></legend>
            <div className="flex flex-wrap gap-2">
              {sizes.map((z) => (
                <label key={z.id} className="inline-flex items-center gap-2 rounded-pill border border-line px-3 py-1.5 text-sm">
                  <input type="checkbox" checked={o.allowedSizes.includes(z.id)} onChange={() => setO({ allowedSizes: toggleIn(o.allowedSizes, z.id) })} /> {z.name}
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </details>

      {/* Extra product-form fields for this category (sub-levels inherit them) */}
      <details className="rounded-md border border-line bg-paper/60 p-4" open={f.fields.length > 0 || f.hideFields.length > 0}>
        <summary className="cursor-pointer text-sm font-semibold">Product form fields in this category</summary>
        <div className="mt-4">
          <CategoryFieldsEditor
            fields={f.fields}
            hideFields={f.hideFields}
            onChange={({ fields, hideFields }) => setF((s) => ({ ...s, fields, hideFields }))}
            inheritedNote={level > 0 ? "Fields from the parent categories are added automatically; add only what's different here." : undefined}
          />
        </div>
      </details>

      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : initial ? "Save" : `Create ${LEVEL_LABEL[level].toLowerCase()}`}
        </Button>
        <Button type="button" size="sm" variant="quiet" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}

/* ───────────── Glazes ───────────── */

export type GlazeRow = { id: string; name: string; slug: string; hex: string; finish: string };

export function GlazeManager({ glazes }: { glazes: GlazeRow[] }) {
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const { pending, error, run } = useMutation();
  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 className="font-sans text-[15px] font-semibold">Glazes</h2>
        <Button size="sm" variant="secondary" onClick={() => setEditing("new")} disabled={editing === "new"}><Plus /> Add glaze</Button>
      </div>
      {editing === "new" && <GlazeEditor onDone={() => setEditing(null)} />}
      <ul>
        {glazes.map((g) =>
          editing === g.id ? (
            <li key={g.id}><GlazeEditor initial={g} onDone={() => setEditing(null)} /></li>
          ) : (
            <li key={g.id} className={rowCls}>
              <span className="size-8 shrink-0 rounded-full border border-ink/15" style={{ backgroundColor: g.hex }} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{g.name}</p>
                <p className="text-xs capitalize text-muted">{g.finish} · {g.hex}</p>
              </div>
              <button className={iconBtn} aria-label={`Edit ${g.name}`} onClick={() => setEditing(g.id)}><Pencil className="size-4" /></button>
              <button className={cn(iconBtn, "hover:text-danger")} aria-label={`Delete ${g.name}`} disabled={pending} onClick={() => confirm(`Delete glaze “${g.name}”?`) && run(() => deleteGlazeAction(g.id))}>
                <Trash2 className="size-4" />
              </button>
            </li>
          ),
        )}
      </ul>
      {glazes.length === 0 && editing !== "new" && <p className="px-5 py-8 text-center text-sm text-muted">No glazes yet.</p>}
      {error && <p role="alert" className="px-5 pb-4 text-sm text-danger">{error}</p>}
    </div>
  );
}

function GlazeEditor({ initial, onDone }: { initial?: GlazeRow; onDone: () => void }) {
  const { pending, error, run } = useMutation();
  const [f, setF] = useState({ name: initial?.name ?? "", slug: initial?.slug ?? "", hex: initial?.hex ?? "#9DBFA9", finish: initial?.finish ?? "glossy" });
  const id = initial?.id ?? "new";
  return (
    <form className="space-y-4 border-b border-line bg-surface/40 px-5 py-5" onSubmit={(e) => { e.preventDefault(); run(() => saveGlazeAction(initial?.id ?? null, f), onDone); }}>
      <div className="grid gap-4 sm:grid-cols-[1fr_140px_140px]">
        <Field label="Name" htmlFor={`gn-${id}`}>
          <TextInput id={`gn-${id}`} required value={f.name} onChange={(e) => setF((s) => ({ ...s, name: e.target.value, slug: initial ? s.slug : slugify(e.target.value) }))} />
        </Field>
        <Field label="Colour" htmlFor={`gh-${id}`}>
          <div className="flex gap-2">
            <input aria-label="Pick colour" type="color" value={f.hex} onChange={(e) => setF((s) => ({ ...s, hex: e.target.value }))} className="h-touch w-12 cursor-pointer rounded-md border border-line bg-paper p-1" />
            <TextInput id={`gh-${id}`} value={f.hex} onChange={(e) => setF((s) => ({ ...s, hex: e.target.value }))} className="font-mono" />
          </div>
        </Field>
        <Field label="Finish" htmlFor={`gf-${id}`}>
          <Select id={`gf-${id}`} value={f.finish} onChange={(e) => setF((s) => ({ ...s, finish: e.target.value }))}>
            {["glossy", "matte", "satin", "raw"].map((x) => <option key={x} value={x} className="capitalize">{x}</option>)}
          </Select>
        </Field>
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : "Save glaze"}</Button>
        <Button type="button" size="sm" variant="quiet" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}

/* ───────────── Sizes ───────────── */

export type SizeRow = { id: string; label: string; slug: string; sortOrder: number };

export function SizeManager({ sizes }: { sizes: SizeRow[] }) {
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const { pending, error, run } = useMutation();
  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 className="font-sans text-[15px] font-semibold">Sizes</h2>
        <Button size="sm" variant="secondary" onClick={() => setEditing("new")} disabled={editing === "new"}><Plus /> Add size</Button>
      </div>
      {editing === "new" && <SizeEditor onDone={() => setEditing(null)} nextOrder={sizes.length + 1} />}
      <ul>
        {sizes.map((s) =>
          editing === s.id ? (
            <li key={s.id}><SizeEditor initial={s} onDone={() => setEditing(null)} nextOrder={s.sortOrder} /></li>
          ) : (
            <li key={s.id} className={rowCls}>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{s.label}</p>
                <p className="text-xs text-muted">order {s.sortOrder}</p>
              </div>
              <button className={iconBtn} aria-label={`Edit ${s.label}`} onClick={() => setEditing(s.id)}><Pencil className="size-4" /></button>
              <button className={cn(iconBtn, "hover:text-danger")} aria-label={`Delete ${s.label}`} disabled={pending} onClick={() => confirm(`Delete size “${s.label}”?`) && run(() => deleteSizeAction(s.id))}>
                <Trash2 className="size-4" />
              </button>
            </li>
          ),
        )}
      </ul>
      {sizes.length === 0 && editing !== "new" && <p className="px-5 py-8 text-center text-sm text-muted">No sizes yet.</p>}
      {error && <p role="alert" className="px-5 pb-4 text-sm text-danger">{error}</p>}
    </div>
  );
}

function SizeEditor({ initial, onDone, nextOrder }: { initial?: SizeRow; onDone: () => void; nextOrder: number }) {
  const { pending, error, run } = useMutation();
  const [f, setF] = useState({ label: initial?.label ?? "", slug: initial?.slug ?? "", sortOrder: initial?.sortOrder ?? nextOrder });
  const id = initial?.id ?? "new";
  return (
    <form className="space-y-4 border-b border-line bg-surface/40 px-5 py-5" onSubmit={(e) => { e.preventDefault(); run(() => saveSizeAction(initial?.id ?? null, f), onDone); }}>
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <Field label="Label" htmlFor={`sl-${id}`} hint="e.g. Small, 250 ml">
          <TextInput id={`sl-${id}`} required value={f.label} onChange={(e) => setF((s) => ({ ...s, label: e.target.value, slug: initial ? s.slug : slugify(e.target.value) }))} />
        </Field>
        <Field label="Sort order" htmlFor={`so-${id}`}>
          <TextInput id={`so-${id}`} type="number" min={0} value={f.sortOrder} onChange={(e) => setF((s) => ({ ...s, sortOrder: Number(e.target.value) }))} />
        </Field>
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : "Save size"}</Button>
        <Button type="button" size="sm" variant="quiet" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}
