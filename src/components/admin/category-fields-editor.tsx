"use client";

import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BUILTIN_FIELDS, FIELD_TYPES, type BuiltinField, type CategoryField, type FieldType } from "@/lib/category-fields";
import { Field, Select, TextInput } from "./form";

const TYPE_LABEL: Record<FieldType, string> = {
  text: "Short text",
  textarea: "Long text",
  number: "Number",
  select: "Dropdown",
  boolean: "Yes / No",
  color: "Colour",
};

const toKey = (label: string) =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").replace(/^(\d)/, "f_$1").slice(0, 31) || "field";

/**
 * Category → product form fields. Products in this category (and its
 * subcategories) get these inputs; built-in inputs can be hidden.
 * Values: `fields` (CategoryField[]) and `hideFields` (built-in keys).
 */
export function CategoryFieldsEditor({
  fields,
  hideFields,
  onChange,
  inheritedNote,
}: {
  fields: CategoryField[];
  hideFields: string[];
  onChange: (next: { fields: CategoryField[]; hideFields: string[] }) => void;
  /** e.g. "Also gets the 3 fields from Ceramics." */
  inheritedNote?: string;
}) {
  // Which field is open for editing (the rest show as one-line rows with Edit / Delete).
  const [editing, setEditing] = useState<number | null>(null);
  const setFields = (f: CategoryField[]) => onChange({ fields: f, hideFields });
  const patch = (i: number, p: Partial<CategoryField>) => setFields(fields.map((f, j) => (j === i ? { ...f, ...p } : f)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= fields.length) return;
    const next = [...fields];
    [next[i], next[j]] = [next[j]!, next[i]!];
    setFields(next);
    if (editing === i) setEditing(j);
    else if (editing === j) setEditing(i);
  };
  const remove = (i: number) => {
    if (!confirm(`Delete the field “${fields[i]?.label || "New field"}”?`)) return;
    setFields(fields.filter((_, j) => j !== i));
    setEditing((e) => (e === null || e === i ? null : e > i ? e - 1 : e));
  };
  const add = () => {
    let key = "new_field";
    for (let n = 2; fields.some((f) => f.key === key); n++) key = `new_field_${n}`;
    setFields([...fields, { key, label: "New field", type: "text", options: [], unit: "", placeholder: "", required: false, showOnProduct: true }]);
    setEditing(fields.length);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">Product fields for this category</p>
        <p className="text-xs text-muted">
          Extra inputs on the product form for products here, shown on the product page as specifications.
          {inheritedNote ? ` ${inheritedNote}` : " Subcategories get these fields too."}
        </p>
      </div>

      {fields.length > 0 && (
        <ol className="divide-y divide-line overflow-hidden rounded-md border border-line bg-paper/60">
          {fields.map((f, i) =>
            editing === i ? (
              <li key={i} className="space-y-3 bg-surface/40 p-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_160px]">
                  <Field label="Label" htmlFor={`cf-l-${i}`}>
                    <TextInput
                      id={`cf-l-${i}`}
                      maxLength={60}
                      autoFocus
                      value={f.label}
                      // The key follows the label until you change the key yourself.
                      onChange={(e) => patch(i, { label: e.target.value, ...(f.key.startsWith("new_field") || f.key === toKey(f.label) ? { key: toKey(e.target.value) } : {}) })}
                    />
                  </Field>
                  <Field label="Key" htmlFor={`cf-k-${i}`} hint="Stays the same once products use it">
                    <TextInput id={`cf-k-${i}`} maxLength={31} value={f.key} onChange={(e) => patch(i, { key: toKey(e.target.value) })} />
                  </Field>
                  <Field label="Type" htmlFor={`cf-t-${i}`}>
                    <Select id={`cf-t-${i}`} value={f.type} onChange={(e) => patch(i, { type: e.target.value as FieldType })}>
                      {FIELD_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                    </Select>
                  </Field>
                </div>
                {f.type === "select" && (
                  <Field label="Options" htmlFor={`cf-o-${i}`} hint="Comma separated, e.g. Stoneware, Porcelain, Terracotta">
                    <TextInput
                      id={`cf-o-${i}`}
                      value={f.options.join(", ")}
                      onChange={(e) => patch(i, { options: e.target.value.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 30) })}
                    />
                  </Field>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  {(f.type === "text" || f.type === "number") && (
                    <Field label="Unit (optional)" htmlFor={`cf-u-${i}`} hint="e.g. ml, cm, g">
                      <TextInput id={`cf-u-${i}`} maxLength={12} value={f.unit} onChange={(e) => patch(i, { unit: e.target.value })} />
                    </Field>
                  )}
                  {(f.type === "text" || f.type === "textarea" || f.type === "number") && (
                    <Field label="Placeholder (optional)" htmlFor={`cf-p-${i}`}>
                      <TextInput id={`cf-p-${i}`} maxLength={80} value={f.placeholder} onChange={(e) => patch(i, { placeholder: e.target.value })} />
                    </Field>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={f.required} onChange={(e) => patch(i, { required: e.target.checked })} /> Required</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={f.showOnProduct} onChange={(e) => patch(i, { showOnProduct: e.target.checked })} /> Show on product page</label>
                  </div>
                  <span className="flex items-center gap-1">
                    <IconBtn label="Delete field" onClick={() => remove(i)} danger><Trash2 className="size-4" /></IconBtn>
                    <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(null)}><Check /> Done</Button>
                  </span>
                </div>
              </li>
            ) : (
              <li key={i} className="flex items-center gap-2 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {f.label || "New field"}
                    {f.required && <span className="text-danger"> *</span>}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {TYPE_LABEL[f.type]}
                    {f.unit && ` · ${f.unit}`}
                    {f.type === "select" && f.options.length > 0 && ` · ${f.options.join(", ")}`}
                    {!f.showOnProduct && " · not shown on product page"}
                    {` · key ${f.key}`}
                  </p>
                </div>
                <IconBtn label="Move up" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="size-3.5" /></IconBtn>
                <IconBtn label="Move down" onClick={() => move(i, 1)} disabled={i === fields.length - 1}><ArrowDown className="size-3.5" /></IconBtn>
                <IconBtn label={`Edit ${f.label}`} onClick={() => setEditing(i)}><Pencil className="size-4" /></IconBtn>
                <IconBtn label={`Delete ${f.label}`} onClick={() => remove(i)} danger><Trash2 className="size-4" /></IconBtn>
              </li>
            ),
          )}
        </ol>
      )}
      {fields.length < 30 && <Button type="button" size="sm" variant="secondary" onClick={add}><Plus /> Add field</Button>}
      {fields.length > 0 && <p className="text-xs text-muted">Field changes are saved when you press <b>Save</b> for this category.</p>}

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Hide standard inputs for this category</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {(Object.keys(BUILTIN_FIELDS) as BuiltinField[]).map((k) => (
            <label key={k} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={hideFields.includes(k)}
                onChange={(e) => onChange({ fields, hideFields: e.target.checked ? [...hideFields, k] : hideFields.filter((x) => x !== k) })}
              />
              {BUILTIN_FIELDS[k]}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function IconBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface disabled:opacity-30 ${danger ? "hover:text-danger" : "hover:text-ink"}`}>
      {children}
    </button>
  );
}
