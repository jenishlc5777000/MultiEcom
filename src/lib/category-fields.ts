import { z } from "zod";

/**
 * Category-specific product fields. Each category (and subcategory) can add
 * its own inputs to the product form, e.g. Ceramics → "Clay body", "Oven safe";
 * Art & Craft → "Age group", "Pieces in kit". A subcategory inherits its
 * parent's fields. Categories can also hide built-in inputs that don't apply.
 */
export const FIELD_TYPES = ["text", "textarea", "number", "select", "boolean", "color"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

/** Built-in product inputs a category can hide. */
export const BUILTIN_FIELDS = {
  patternName: "Pattern name",
  capacity: "Capacity",
  dimensions: "Dimensions",
  care: "Care",
  kitContents: "Kit contents",
  glaze: "Glaze (variants)",
  size: "Size (variants)",
} as const;
export type BuiltinField = keyof typeof BUILTIN_FIELDS;
export const BUILTIN_KEYS = Object.keys(BUILTIN_FIELDS) as [BuiltinField, ...BuiltinField[]];

export const fieldSchema = z.object({
  key: z.string().trim().regex(/^[a-z][a-z0-9_]{0,30}$/, "Key: lowercase letters, numbers and _ (start with a letter)"),
  label: z.string().trim().min(1, "Label required").max(60),
  type: z.enum(FIELD_TYPES).default("text"),
  /** For "select". */
  options: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  unit: z.string().trim().max(12).default(""),
  placeholder: z.string().trim().max(80).default(""),
  required: z.boolean().default(false),
  /** Show the value in the product page's specifications. */
  showOnProduct: z.boolean().default(true),
});
export type CategoryField = z.infer<typeof fieldSchema>;

export const categoryFieldsSchema = z
  .array(fieldSchema)
  .max(30)
  .default([])
  .superRefine((list, ctx) => {
    const keys = list.map((f) => f.key);
    if (new Set(keys).size !== keys.length) ctx.addIssue({ code: "custom", message: "Two fields have the same key" });
    list.forEach((f, i) => {
      if (f.type === "select" && f.options.length === 0) ctx.addIssue({ code: "custom", path: [i, "options"], message: `"${f.label}" needs at least one option` });
    });
  });

/** Fields for a product in a category: parent's first, then the category's own (same key: own wins). */
export function mergeFields(parent: CategoryField[] = [], own: CategoryField[] = []): CategoryField[] {
  const ownKeys = new Set(own.map((f) => f.key));
  return [...parent.filter((f) => !ownKeys.has(f.key)), ...own];
}

/** Product attribute values: key → string (booleans "yes"/"no", numbers as text). */
export const attributesSchema = z.record(z.string().regex(/^[a-z][a-z0-9_]{0,30}$/), z.string().trim().max(2000)).default({});
export type Attributes = z.infer<typeof attributesSchema>;

/** Check values against the fields; returns cleaned values or the first error. */
export function checkAttributes(fields: CategoryField[], raw: Attributes): { ok: true; value: Attributes } | { ok: false; error: string } {
  const out: Attributes = {};
  for (const f of fields) {
    const v = (raw[f.key] ?? "").trim();
    if (!v) {
      if (f.required) return { ok: false, error: `"${f.label}" is required for this category.` };
      continue;
    }
    if (f.type === "number" && !/^-?\d+(\.\d+)?$/.test(v)) return { ok: false, error: `"${f.label}" must be a number.` };
    if (f.type === "select" && !f.options.includes(v)) return { ok: false, error: `"${f.label}" must be one of: ${f.options.join(", ")}.` };
    if (f.type === "boolean" && v !== "yes" && v !== "no") return { ok: false, error: `"${f.label}" must be yes or no.` };
    if (f.type === "color" && !/^#[0-9a-fA-F]{6}$/.test(v)) return { ok: false, error: `"${f.label}" must be a colour like #A24A25.` };
    out[f.key] = v;
  }
  return { ok: true, value: out };
}

/** Display text for a value ("yes" → "Yes", number + unit). */
export function formatAttribute(f: CategoryField, v: string) {
  if (f.type === "boolean") return v === "yes" ? "Yes" : "No";
  return f.unit ? `${v} ${f.unit}` : v;
}

/** Category id → its product form (fields from the root down + all hidden built-ins). */
export type CategoryForm = {
  fields: CategoryField[];
  hide: string[];
  /** Glaze / size ids offered for this category (nearest category with a list wins; empty = all). */
  allowedGlazes: string[];
  allowedSizes: string[];
};
export function resolveCategoryForms(rows: { id: string; parentId: string | null; fields: CategoryField[]; hideFields: string[]; options?: { allowedGlazes?: string[]; allowedSizes?: string[] } }[]): Record<string, CategoryForm> {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const out: Record<string, CategoryForm> = {};
  for (const r of rows) {
    const chain: typeof rows = [];
    for (let c: (typeof rows)[number] | undefined = r, n = 0; c && n < 5; c = c.parentId ? byId.get(c.parentId) : undefined, n++) chain.unshift(c);
    out[r.id] = {
      fields: chain.reduce<CategoryField[]>((acc, c) => mergeFields(acc, c.fields), []),
      hide: [...new Set(chain.flatMap((c) => c.hideFields))],
      allowedGlazes: [...chain].reverse().find((c) => c.options?.allowedGlazes?.length)?.options?.allowedGlazes ?? [],
      allowedSizes: [...chain].reverse().find((c) => c.options?.allowedSizes?.length)?.options?.allowedSizes ?? [],
    };
  }
  return out;
}
