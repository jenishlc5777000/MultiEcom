"use client";

import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, GripVertical, LayoutTemplate, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FEATURE_ICONS, makeSection, newSectionId, SECTION_INFO, sectionLabel, sectionsFromLanding, type Builder, type Section, type SectionStyle, type SectionType } from "@/lib/builder";
import { cn } from "@/lib/utils";
import { Field, Select, TextArea, TextInput } from "../form";
import { ImageUploader } from "../image-uploader";
import { FOCUS_EVENT } from "./preview";
import { Choice, ColorField, Panel, RangeField, SaveBar, SwitchRow, useSection } from "./shared";

const TIP = 'Tip: "/" makes a line break, *asterisks* highlight a word. You can also double-click any text in the live preview to edit it there.';
const GROUPS = ["Content", "Media", "Shop", "Layout", "Built-in"] as const;

/** Studio → Sections: build the home page from sections. */
export function SectionsTab({ initial, landing, categories }: { initial: Builder; landing: { on: Record<string, boolean>; order: "story-first" | "shop-first" }; categories: { slug: string; name: string }[] }) {
  const s = useSection("builder", initial);
  const { sections, enabled } = s.v;
  const [selected, setSelected] = useState<string | null>(sections[0]?.id ?? null);
  const [adding, setAdding] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);

  // Click-to-edit from the preview: open the clicked section.
  useEffect(() => {
    const open = (panel: string | null) => {
      if (panel?.startsWith("section-")) setSelected(panel.slice("section-".length));
    };
    try {
      open(sessionStorage.getItem(FOCUS_EVENT));
      sessionStorage.removeItem(FOCUS_EVENT);
    } catch {}
    const onFocus = (e: Event) => open((e as CustomEvent<string>).detail);
    window.addEventListener(FOCUS_EVENT, onFocus);
    return () => window.removeEventListener(FOCUS_EVENT, onFocus);
  }, []);

  const setSections = (next: Section[]) => s.update((v) => ({ ...v, sections: next }));
  const patch = (id: string, p: Partial<Section>) => setSections(sections.map((x) => (x.id === id ? ({ ...x, ...p } as Section) : x)));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= sections.length || from === to) return;
    const next = [...sections];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it!);
    setSections(next);
  };
  const add = (type: SectionType) => {
    const sec = makeSection(type);
    const at = selected ? sections.findIndex((x) => x.id === selected) + 1 : sections.length;
    const next = [...sections];
    next.splice(at, 0, sec);
    setSections(next);
    setSelected(sec.id);
    setAdding(false);
  };
  const current = sections.find((x) => x.id === selected) ?? null;

  if (!enabled || sections.length === 0) {
    return (
      <div className="space-y-6">
        <Panel id="sections" title="Build your home page from sections" description="Add, reorder and customise every section of the home page: text, images, banners, features, FAQs, testimonials, product collections and the theme's own blocks.">
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => s.update(() => ({ enabled: true, sections: sectionsFromLanding(landing.on, landing.order) }))} className="rounded-lg border border-ink p-5 text-left ring-1 ring-ink">
              <LayoutTemplate className="mb-3 size-6" aria-hidden />
              <span className="block font-semibold">Start from my current home page</span>
              <span className="mt-1 block text-sm text-muted">Turns today&apos;s sections into editable blocks you can reorder and extend.</span>
            </button>
            <button type="button" onClick={() => s.update(() => ({ enabled: true, sections: [makeSection("hero"), makeSection("heading"), makeSection("products")] }))} className="rounded-lg border border-line p-5 text-left hover:border-ink">
              <Plus className="mb-3 size-6" aria-hidden />
              <span className="block font-semibold">Start almost blank</span>
              <span className="mt-1 block text-sm text-muted">A hero, a heading and a product collection to build on.</span>
            </button>
          </div>
          {sections.length > 0 && <SwitchRow label="Use the section builder for the home page" checked={enabled} onChange={(x) => s.update((v) => ({ ...v, enabled: x }))} />}
        </Panel>
        {s.dirty && <SaveBar {...s} label="Save & use builder" />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SwitchRow label="Home page uses these sections" hint="Off = back to the theme's own home page (your sections are kept)." checked={enabled} onChange={(x) => s.update((v) => ({ ...v, enabled: x }))} />

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Section list */}
        <div className="space-y-3">
          <ol className="space-y-1.5" aria-label="Sections">
            {sections.map((sec, i) => (
              <li
                key={sec.id}
                draggable
                onDragStart={() => setDragFrom(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (dragFrom !== null) move(dragFrom, i); setDragFrom(null); }}
                className={cn(
                  "group flex items-center gap-1 rounded-md border bg-paper px-2 py-1.5 transition-colors",
                  sec.id === selected ? "border-ink ring-1 ring-ink" : "border-line hover:border-muted",
                  !sec.enabled && "opacity-55",
                )}
              >
                <GripVertical className="size-4 shrink-0 cursor-grab text-muted" aria-hidden />
                <button type="button" onClick={() => setSelected(sec.id)} className="min-w-0 flex-1 py-1 text-left">
                  <span className="block truncate text-sm font-medium">{sectionLabel(sec)}</span>
                  <span className="block truncate text-[11px] text-muted">{SECTION_INFO[sec.type].label}</span>
                </button>
                <span className="flex shrink-0 opacity-60 group-hover:opacity-100">
                  <IconBtn label="Move up" onClick={() => move(i, i - 1)} disabled={i === 0}><ArrowUp className="size-3.5" /></IconBtn>
                  <IconBtn label="Move down" onClick={() => move(i, i + 1)} disabled={i === sections.length - 1}><ArrowDown className="size-3.5" /></IconBtn>
                  <IconBtn label={sec.enabled ? "Hide" : "Show"} onClick={() => patch(sec.id, { enabled: !sec.enabled })}>{sec.enabled ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}</IconBtn>
                </span>
              </li>
            ))}
          </ol>
          <Button type="button" variant="secondary" className="w-full" onClick={() => setAdding(true)}><Plus /> Add section</Button>
        </div>

        {/* Editor */}
        <div className="min-w-0 space-y-6">
          {adding && <AddGallery onAdd={add} onClose={() => setAdding(false)} />}
          {current ? (
            <SectionEditor
              key={current.id}
              section={current}
              categories={categories}
              onChange={(p) => patch(current.id, p)}
              onDuplicate={() => {
                const copy = { ...structuredClone(current), id: newSectionId() } as Section;
                const at = sections.findIndex((x) => x.id === current.id) + 1;
                const next = [...sections];
                next.splice(at, 0, copy);
                setSections(next);
                setSelected(copy.id);
              }}
              onDelete={() => {
                if (!confirm(`Delete the "${sectionLabel(current)}" section?`)) return;
                const i = sections.findIndex((x) => x.id === current.id);
                const next = sections.filter((x) => x.id !== current.id);
                setSections(next);
                setSelected(next[Math.max(0, i - 1)]?.id ?? null);
              }}
            />
          ) : (
            !adding && <p className="rounded-lg border border-dashed border-line p-10 text-center text-muted">Choose a section on the left, or add a new one.</p>
          )}
        </div>
      </div>

      <SaveBar {...s} label="Save sections" />
    </div>
  );
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className="inline-flex size-7 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-ink disabled:opacity-30">
      {children}
    </button>
  );
}

function AddGallery({ onAdd, onClose }: { onAdd: (t: SectionType) => void; onClose: () => void }) {
  return (
    <section className="rounded-lg border border-ink bg-paper p-5 shadow-float">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-sans text-[15px] font-semibold">Add a section</h3>
        <IconBtn label="Close" onClick={onClose}><X className="size-4" /></IconBtn>
      </div>
      <div className="space-y-5">
        {GROUPS.map((g) => (
          <div key={g}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{g}</p>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {(Object.keys(SECTION_INFO) as SectionType[]).filter((t) => SECTION_INFO[t].group === g).map((t) => (
                <button key={t} type="button" onClick={() => onAdd(t)} className="rounded-md border border-line p-3 text-left transition-colors hover:border-ink hover:bg-surface">
                  <span className="block text-sm font-medium">{SECTION_INFO[t].label}</span>
                  <span className="block text-xs text-muted">{SECTION_INFO[t].hint}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────────── Editing one section ───────────── */

type AnySection = Section & Record<string, unknown>;

function SectionEditor({ section, categories, onChange, onDuplicate, onDelete }: { section: Section; categories: { slug: string; name: string }[]; onChange: (p: Partial<Section>) => void; onDuplicate: () => void; onDelete: () => void }) {
  const sec = section as AnySection;
  const set = (key: string, value: unknown) => onChange({ [key]: value } as Partial<Section>);
  const str = (key: string) => (typeof sec[key] === "string" ? (sec[key] as string) : "");
  const t = section.type;
  const builtin = SECTION_INFO[t].group === "Built-in" || t === "shopFeed";
  const textField = (key: string, label: string, max = 200, hint?: string) => (
    <Field label={label} htmlFor={`${section.id}-${key}`} hint={hint}>
      <TextInput id={`${section.id}-${key}`} maxLength={max} value={str(key)} onChange={(e) => set(key, e.target.value)} />
    </Field>
  );
  const areaField = (key: string, label: string, max = 2000, rows = 4) => (
    <Field label={label} htmlFor={`${section.id}-${key}`}>
      <TextArea id={`${section.id}-${key}`} rows={rows} maxLength={max} value={str(key)} onChange={(e) => set(key, e.target.value)} />
    </Field>
  );
  const linkField = (key: string, label: string) => textField(key, label, 300, "A path like /category/mugs, #anchor, or a full https:// link");
  const imageField = (key: string, label: string) => (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <ImageUploader folder="banners" path={["sections"]} max={1} label={label} value={sec[key] ? [sec[key] as { url: string; publicId: string; alt: string }] : []} onChange={(imgs) => set(key, imgs[0] ?? null)} />
    </div>
  );

  return (
    <div className="space-y-6">
      <Panel id={`section-${section.id}`} title={`${SECTION_INFO[t].label}`} description={builtin ? `${SECTION_INFO[t].hint}. Its text is edited in Studio → Content (or double-click it in the preview).` : TIP}>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={onDuplicate}><Copy /> Duplicate</Button>
          <Button type="button" size="sm" variant="quiet" onClick={onDelete} className="text-danger"><Trash2 /> Delete</Button>
        </div>

        {t === "heading" && (
          <>
            {textField("eyebrow", "Small line above", 80)}
            {textField("title", "Heading")}
            {areaField("subtitle", "Text below", 400, 2)}
            <Choice label="Size" value={str("size")} onChange={(x) => set("size", x)} options={[{ value: "md", label: "Medium" }, { value: "lg", label: "Large" }, { value: "xl", label: "Extra large" }]} />
          </>
        )}
        {t === "text" && (
          <>
            {textField("title", "Heading (optional)")}
            {areaField("body", "Text", 4000, 8)}
            <Choice label="Columns" value={String(sec.columns)} onChange={(x) => set("columns", Number(x))} columns={2} options={[{ value: "1", label: "One column" }, { value: "2", label: "Two columns" }]} />
          </>
        )}
        {t === "imageText" && (
          <>
            {imageField("image", "Photo")}
            {textField("eyebrow", "Small line above", 80)}
            {textField("title", "Heading")}
            {areaField("body", "Text")}
            <div className="grid gap-4 sm:grid-cols-2">{textField("ctaLabel", "Button text (empty = no button)", 40)}{linkField("ctaHref", "Button link")}</div>
            <Choice label="Photo side" value={str("imageSide")} onChange={(x) => set("imageSide", x)} columns={2} options={[{ value: "left", label: "Left" }, { value: "right", label: "Right" }]} />
            <Choice label="Photo shape" value={str("imageShape")} onChange={(x) => set("imageShape", x)} columns={4} options={[{ value: "rounded", label: "Rounded" }, { value: "square", label: "Square" }, { value: "circle", label: "Circle" }, { value: "arch", label: "Arch" }]} />
          </>
        )}
        {t === "banner" && (
          <>
            {imageField("image", "Background photo")}
            {textField("title", "Heading")}
            {areaField("subtitle", "Text", 400, 2)}
            <div className="grid gap-4 sm:grid-cols-2">{textField("ctaLabel", "Button text", 40)}{linkField("ctaHref", "Button link")}</div>
            <Choice label="Height" value={str("height")} onChange={(x) => set("height", x)} options={[{ value: "sm", label: "Short" }, { value: "md", label: "Medium" }, { value: "lg", label: "Tall" }]} />
            <RangeField label="Darken photo" value={Number(sec.overlay)} min={0} max={85} step={5} unit="%" onChange={(x) => set("overlay", x)} />
          </>
        )}
        {t === "cta" && (
          <>
            {textField("title", "Heading")}
            {areaField("body", "Text", 400, 2)}
            <div className="grid gap-4 sm:grid-cols-2">
              {textField("ctaLabel", "Main button", 40)}{linkField("ctaHref", "Main button link")}
              {textField("secondaryLabel", "Second button (optional)", 40)}{linkField("secondaryHref", "Second button link")}
            </div>
          </>
        )}
        {(t === "features" || t === "testimonials") && textField("eyebrow", "Small line above", 80)}
        {(t === "features" || t === "stats" || t === "testimonials" || t === "faq" || t === "gallery") && textField("title", "Heading")}
        {t === "features" && (
          <>
            <RangeField label="Columns" value={Number(sec.columns)} min={2} max={4} unit="" onChange={(x) => set("columns", x)} />
            <ItemsEditor items={sec.items as Record<string, string>[]} max={8} onChange={(items) => set("items", items)} newItem={{ icon: "sparkles", title: "New feature", body: "" }}
              fields={[{ key: "icon", label: "Icon", type: "icon" }, { key: "title", label: "Title" }, { key: "body", label: "Text", type: "area" }]} />
          </>
        )}
        {t === "stats" && (
          <ItemsEditor items={sec.items as Record<string, string>[]} max={6} onChange={(items) => set("items", items)} newItem={{ value: "100+", label: "New number" }} fields={[{ key: "value", label: "Number" }, { key: "label", label: "Label" }]} />
        )}
        {t === "testimonials" && (
          <ItemsEditor items={sec.items as Record<string, string>[]} max={9} onChange={(items) => set("items", items)} newItem={{ quote: "", name: "", role: "" }} fields={[{ key: "quote", label: "Quote", type: "area" }, { key: "name", label: "Name" }, { key: "role", label: "City or role" }]} />
        )}
        {t === "faq" && (
          <ItemsEditor items={sec.items as Record<string, string>[]} max={20} onChange={(items) => set("items", items)} newItem={{ q: "New question?", a: "" }} fields={[{ key: "q", label: "Question" }, { key: "a", label: "Answer", type: "area" }]} />
        )}
        {t === "gallery" && (
          <>
            <ImageUploader folder="banners" path={["gallery"]} max={18} label="Gallery photos" value={sec.images as { url: string; publicId: string; alt: string }[]} onChange={(imgs) => set("images", imgs)} />
            <RangeField label="Columns" value={Number(sec.columns)} min={2} max={6} unit="" onChange={(x) => set("columns", x)} />
            <Choice label="Photo shape" value={str("shape")} onChange={(x) => set("shape", x)} options={[{ value: "square", label: "Square" }, { value: "portrait", label: "Portrait" }, { value: "landscape", label: "Landscape" }]} />
          </>
        )}
        {t === "products" && (
          <>
            {textField("eyebrow", "Small line above", 80)}
            {textField("title", "Heading")}
            <Choice label="Which products" value={str("source")} onChange={(x) => set("source", x)} columns={4} options={[{ value: "newest", label: "Newest" }, { value: "ready", label: "Ready to ship" }, { value: "rating", label: "Top rated" }, { value: "category", label: "One category" }, { value: "offers", label: "Offers" }, { value: "hotDeals", label: "Hot deals" }, { value: "bestsellers", label: "Most ordered" }]} />
            {sec.source === "category" && (
              <Field label="Category" htmlFor={`${section.id}-cat`}>
                <Select id={`${section.id}-cat`} value={str("category")} onChange={(e) => set("category", e.target.value)}>
                  <option value="">Choose a category…</option>
                  {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </Select>
              </Field>
            )}
            <RangeField label="How many" value={Number(sec.count)} min={2} max={24} unit="" onChange={(x) => set("count", x)} />
            <Choice label="Layout" value={str("layout")} onChange={(x) => set("layout", x)} columns={5} options={[{ value: "grid", label: "Grid" }, { value: "list", label: "List" }, { value: "compact", label: "Compact" }, { value: "masonry", label: "Masonry" }, { value: "large", label: "Large" }]} />
            {textField("linkLabel", "Link text (empty = no link)", 40)}
          </>
        )}
        {t === "countdown" && (
          <>
            {textField("eyebrow", "Small line above", 80)}
            {textField("title", "Heading")}
            {areaField("body", "Text", 400, 2)}
            <Field label="Ends at" htmlFor={`${section.id}-end`} hint="Your local time">
              <TextInput id={`${section.id}-end`} type="datetime-local" value={str("endsAt").slice(0, 16)} onChange={(e) => set("endsAt", e.target.value)} />
            </Field>
            {textField("endedText", "Text after it ends", 120)}
            <div className="grid gap-4 sm:grid-cols-2">{textField("ctaLabel", "Button text", 40)}{linkField("ctaHref", "Button link")}</div>
          </>
        )}
        {t === "recentlyViewed" && (
          <>
            {textField("title", "Heading", 80)}
            <RangeField label="How many" value={Number(sec.count)} min={2} max={12} unit="" onChange={(x) => set("count", x)} />
            <p className="text-xs text-muted">Only shows to visitors who have looked at products. Products in offers, hot deals and most ordered are chosen in Studio → Shopping.</p>
          </>
        )}
        {t === "trustBar" && (
          <ItemsEditor items={sec.items as Record<string, string>[]} max={6} onChange={(items) => set("items", items)} newItem={{ icon: "shield", label: "New promise" }} fields={[{ key: "icon", label: "Icon", type: "icon" }, { key: "label", label: "Text" }]} />
        )}
        {t === "spacer" && (
          <>
            <Choice label="Space" value={str("size")} onChange={(x) => set("size", x)} options={[{ value: "sm", label: "Small" }, { value: "md", label: "Medium" }, { value: "lg", label: "Large" }]} />
            <SwitchRow label="Show a divider line" checked={Boolean(sec.line)} onChange={(x) => set("line", x)} />
          </>
        )}
      </Panel>

      <StyleEditor style={section.style} builtin={builtin} onChange={(style) => onChange({ style } as Partial<Section>)} />
    </div>
  );
}

type ItemField = { key: string; label: string; type?: "text" | "area" | "icon" };

/** Repeating items (features, stats, quotes, FAQ): add, edit, reorder, remove. */
function ItemsEditor({ items, fields, max, newItem, onChange }: { items: Record<string, string>[]; fields: ItemField[]; max: number; newItem: Record<string, string>; onChange: (items: Record<string, string>[]) => void }) {
  const setItem = (i: number, key: string, value: string) => onChange(items.map((it, j) => (j === i ? { ...it, [key]: value } : it)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Items <span className="text-muted">({items.length}/{max})</span></p>
      <ol className="space-y-3">
        {items.map((it, i) => (
          <li key={i} className="space-y-3 rounded-md border border-line bg-paper/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted">#{i + 1}</span>
              <span className="flex">
                <IconBtn label="Move up" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="size-3.5" /></IconBtn>
                <IconBtn label="Move down" onClick={() => move(i, 1)} disabled={i === items.length - 1}><ArrowDown className="size-3.5" /></IconBtn>
                <IconBtn label="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))}><Trash2 className="size-3.5" /></IconBtn>
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((f) =>
                f.type === "icon" ? (
                  <Field key={f.key} label={f.label} htmlFor={`it-${i}-${f.key}`}>
                    <Select id={`it-${i}-${f.key}`} value={it[f.key] ?? ""} onChange={(e) => setItem(i, f.key, e.target.value)}>
                      {FEATURE_ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                    </Select>
                  </Field>
                ) : f.type === "area" ? (
                  <Field key={f.key} label={f.label} htmlFor={`it-${i}-${f.key}`} className="sm:col-span-2">
                    <TextArea id={`it-${i}-${f.key}`} rows={2} value={it[f.key] ?? ""} onChange={(e) => setItem(i, f.key, e.target.value)} />
                  </Field>
                ) : (
                  <Field key={f.key} label={f.label} htmlFor={`it-${i}-${f.key}`}>
                    <TextInput id={`it-${i}-${f.key}`} value={it[f.key] ?? ""} onChange={(e) => setItem(i, f.key, e.target.value)} />
                  </Field>
                ),
              )}
            </div>
          </li>
        ))}
      </ol>
      {items.length < max && <Button type="button" size="sm" variant="secondary" onClick={() => onChange([...items, { ...newItem }])}><Plus /> Add item</Button>}
    </div>
  );
}

/** Background, spacing, width, alignment, animation, visibility, anchor. */
function StyleEditor({ style, builtin, onChange }: { style: SectionStyle; builtin: boolean; onChange: (s: SectionStyle) => void }) {
  const set = (p: Partial<SectionStyle>) => onChange({ ...style, ...p });
  return (
    <Panel title="Section style" description={builtin ? "Built-in blocks keep their own design; spacing, background and visibility still apply." : undefined}>
      <Choice
        label="Background"
        value={style.background}
        onChange={(x) => set({ background: x })}
        columns={6}
        options={[
          { value: "none", label: "None" },
          { value: "surface", label: "Panel" },
          { value: "ink", label: "Dark" },
          { value: "accent", label: "Accent" },
          { value: "gradient", label: "Gradient" },
          { value: "custom", label: "Custom colour" },
        ]}
      />
      {(style.background === "custom" || style.background === "gradient") && (
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField label={style.background === "gradient" ? "From" : "Colour"} allowEmpty value={style.color} onChange={(x) => set({ color: x })} />
          {style.background === "gradient" && <ColorField label="To" allowEmpty value={style.color2} onChange={(x) => set({ color2: x })} />}
        </div>
      )}
      <Choice label="Space above & below" value={style.padding} onChange={(x) => set({ padding: x })} columns={5} options={[{ value: "none", label: "None" }, { value: "sm", label: "Small" }, { value: "md", label: "Medium" }, { value: "lg", label: "Large" }, { value: "xl", label: "Extra large" }]} />
      {!builtin && (
        <>
          <Choice label="Width" value={style.width} onChange={(x) => set({ width: x })} columns={4} options={[{ value: "narrow", label: "Narrow" }, { value: "normal", label: "Normal" }, { value: "wide", label: "Wide" }, { value: "full", label: "Full width" }]} />
          <Choice label="Alignment" value={style.align} onChange={(x) => set({ align: x })} columns={2} options={[{ value: "left", label: "Left" }, { value: "center", label: "Centred" }]} />
          <SwitchRow label="Fade in while scrolling" checked={style.animate} onChange={(x) => set({ animate: x })} />
        </>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        <SwitchRow label="Hide on phones" checked={style.hideOnMobile} onChange={(x) => set({ hideOnMobile: x })} />
        <SwitchRow label="Hide on desktop" checked={style.hideOnDesktop} onChange={(x) => set({ hideOnDesktop: x })} />
      </div>
      <Field label="Anchor (optional)" htmlFor="anchor" hint="e.g. offers, then link a button to #offers">
        <TextInput id="anchor" maxLength={40} value={style.anchor} onChange={(e) => set({ anchor: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} />
      </Field>
    </Panel>
  );
}
