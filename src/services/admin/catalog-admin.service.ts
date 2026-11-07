import "server-only";
import { DomainError } from "@/lib/errors";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import type { ProductInput } from "@/lib/validations/admin";
import { Category, Glaze, Order, Product, Size } from "@/models";
import { categoryFieldsSchema, checkAttributes, mergeFields, type CategoryField } from "@/lib/category-fields";

export class CatalogError extends DomainError {}

const toPaise = (rupees: number) => Math.round(rupees * 100);

function duplicateKeyMessage(e: unknown): string | null {
  if (typeof e === "object" && e && "code" in e && (e as { code: number }).code === 11000) {
    const key = Object.keys((e as { keyPattern?: object }).keyPattern ?? {})[0] ?? "";
    if (key.includes("sku")) return "That SKU is already used by another product.";
    if (key.includes("slug")) return "That URL slug is already taken.";
    return "That value is already in use.";
  }
  return null;
}

/* ───────────── Products ───────────── */

export type ProductListFilters = { q?: string; status?: string; category?: string; stock?: string };

export async function listProducts({ q, status, category, stock }: ProductListFilters) {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (status && status !== "ALL") filter.status = status;
  if (category && Types.ObjectId.isValid(category)) {
    // A top-level category also matches products in its subcategories.
    // A category also matches products in its subcategories and their sub-subcategories.
    const subs = await Category.find({ parent: category }).select("_id").lean();
    const subSubs = subs.length ? await Category.find({ parent: { $in: subs.map((s) => s._id) } }).select("_id").lean() : [];
    filter.category = { $in: [category, ...subs.map((s) => s._id), ...subSubs.map((s) => s._id)] };
  }
  if (stock === "low") Object.assign(filter, { availability: "READY_STOCK", "variants.stock": { $lte: 2 } });
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { slug: rx }, { "variants.sku": rx }];
  }
  const rows = await Product.find(filter)
    .select("name slug type status availability isUnique images variants category updatedAt")
    .populate({ path: "category", select: "name parent", populate: { path: "parent", select: "name" } })
    .sort({ updatedAt: -1 })
    .limit(200)
    .lean<
      {
        _id: Types.ObjectId; name: string; slug: string; type: string; status: string; availability: string; isUnique?: boolean;
        images?: { url: string }[]; variants: { price: number; stock: number; images?: { main?: { url: string } } }[];
        category?: { name: string; parent?: { name: string } | null } | null; updatedAt: Date;
      }[]
    >();

  return rows.map((p) => ({
    id: String(p._id),
    name: p.name,
    slug: p.slug,
    type: p.type,
    status: p.status,
    availability: p.availability,
    isUnique: Boolean(p.isUnique),
    imageUrl: p.images?.[0]?.url ?? p.variants[0]?.images?.main?.url,
    category: p.category ? (p.category.parent?.name ? `${p.category.parent.name} › ${p.category.name}` : p.category.name) : "",
    variantCount: p.variants.length,
    stock: p.variants.reduce((n, v) => n + v.stock, 0),
    priceFrom: Math.min(...p.variants.map((v) => v.price)),
    updatedAt: p.updatedAt.toISOString(),
  }));
}

/** Shape the product form edits (prices in rupees). */
export async function getProductForEdit(id: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(id)) return null;
  const p = await Product.findById(id).lean();
  if (!p) return null;
  return {
    id: String(p._id),
    name: p.name,
    slug: p.slug,
    type: p.type,
    status: p.status,
    availability: p.availability,
    category: String(p.category),
    isUnique: Boolean(p.isUnique),
    leadTimeDays: p.leadTimeDays ?? "",
    patternName: p.patternName ?? "",
    description: p.description ?? "",
    capacity: p.capacity ?? "",
    dimensions: p.dimensions ?? "",
    care: p.care ?? "",
    kitContents: p.kitContents ?? [],
    tags: p.tags ?? [],
    attributes: ((p as { attributes?: Record<string, string> }).attributes ?? {}) as Record<string, string>,
    images: (p.images ?? []).map((i) => ({ url: i.url, publicId: i.publicId, alt: i.alt ?? "" })),
    variants: p.variants.map((v) => ({
      id: String(v._id),
      glaze: v.glaze ? String(v.glaze) : "",
      size: v.size ? String(v.size) : "",
      sku: v.sku,
      price: v.price / 100,
      compareAtPrice: v.compareAtPrice ? v.compareAtPrice / 100 : "",
      stock: v.stock,
      isActive: v.isActive !== false,
      image: v.images?.main ? { url: v.images.main.url, publicId: v.images.main.publicId, alt: v.images.main.alt ?? "" } : null,
    })),
  };
}
export type ProductFormValues = NonNullable<Awaited<ReturnType<typeof getProductForEdit>>>;

function toDocument(input: ProductInput) {
  return {
    ...input,
    // A one-of-a-kind piece that has sold out stays SOLD; restocking it flips back.
    availability: input.isUnique && input.variants[0]?.stock === 0 && input.availability === "READY_STOCK" ? "SOLD" : input.availability,
    leadTimeDays: input.availability === "MADE_TO_ORDER" ? input.leadTimeDays : undefined,
    kitContents: input.type === "CRAFT" ? input.kitContents : [],
    variants: input.variants.map((v) => ({
      ...(v.id && Types.ObjectId.isValid(v.id) ? { _id: new Types.ObjectId(v.id) } : {}),
      glaze: v.glaze,
      size: v.size,
      sku: v.sku,
      price: toPaise(v.price),
      compareAtPrice: v.compareAtPrice ? toPaise(v.compareAtPrice) : undefined,
      stock: v.stock,
      isActive: v.isActive,
      images: v.image ? { main: v.image } : {},
    })),
  };
}

/** Fields a product in this category must fill (parent's + own), and the built-ins it hides. */
export async function getCategoryForm(categoryId: string) {
  await connectDB();
  type Row = { fields?: unknown; hideFields?: string[]; parent?: unknown };
  // Walk up the tree (category → parent → grandparent), then merge from the root down.
  const chain: Row[] = [];
  let id: unknown = categoryId;
  for (let n = 0; id && n < 5; n++) {
    const c = await Category.findById(id).select("fields hideFields parent").lean<Row>();
    if (!c) break;
    chain.unshift(c);
    id = c.parent;
  }
  const parse = (v: unknown) => { const r = categoryFieldsSchema.safeParse(v ?? []); return r.success ? r.data : []; };
  return {
    fields: chain.reduce<CategoryField[]>((acc, c) => mergeFields(acc, parse(c.fields)), []),
    hide: [...new Set(chain.flatMap((c) => c.hideFields ?? []))],
  };
}

/** Validate category attributes on the server (the form can be bypassed). */
async function withAttributes(input: ProductInput): Promise<ProductInput> {
  const { fields } = await getCategoryForm(input.category);
  const r = checkAttributes(fields, input.attributes ?? {});
  if (!r.ok) throw new CatalogError(r.error);
  return { ...input, attributes: r.value };
}

export async function createProduct(input: ProductInput) {
  await connectDB();
  input = await withAttributes(input);
  try {
    const p = await Product.create(toDocument(input));
    return String(p._id);
  } catch (e) {
    throw new CatalogError(duplicateKeyMessage(e) ?? "Couldn't save the product.");
  }
}

export async function updateProduct(id: string, input: ProductInput) {
  await connectDB();
  input = await withAttributes(input);
  try {
    // Variant _ids are preserved so carts and order snapshots keep pointing at them.
    const res = await Product.updateOne({ _id: id }, { $set: toDocument(input) }, { runValidators: true });
    if (res.matchedCount === 0) throw new CatalogError("Product not found.");
  } catch (e) {
    if (e instanceof CatalogError) throw e;
    throw new CatalogError(duplicateKeyMessage(e) ?? "Couldn't save the product.");
  }
}

export async function setProductStatus(id: string, status: "DRAFT" | "ACTIVE" | "ARCHIVED") {
  await connectDB();
  await Product.updateOne({ _id: id }, { $set: { status } });
}

/** Products that appear in orders are archived instead of deleted so history stays intact. */
export async function deleteProduct(id: string) {
  await connectDB();
  const used = await Order.exists({ "items.product": id });
  if (used) {
    await Product.updateOne({ _id: id }, { $set: { status: "ARCHIVED" } });
    return "archived" as const;
  }
  await Product.deleteOne({ _id: id });
  return "deleted" as const;
}

/* ───────────── Categories, glazes, sizes ───────────── */

/**
 * All categories as a flattened tree: each top-level category is followed by
 * its subcategories (one level deep). `label` is "Parent › Child" for selects.
 */
export async function listCategoriesAdmin() {
  await connectDB();
  const [cats, counts] = await Promise.all([
    Category.find().sort({ sortOrder: 1, name: 1 }).lean(),
    Product.aggregate<{ _id: Types.ObjectId; n: number }>([{ $group: { _id: "$category", n: { $sum: 1 } } }]),
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c.n]));
  const ids = new Set(cats.map((c) => String(c._id)));
  const rows = cats.map((c) => ({
    id: String(c._id),
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    sortOrder: c.sortOrder ?? 0,
    isActive: c.isActive !== false,
    image: c.image ? { url: c.image.url, publicId: c.image.publicId, alt: c.image.alt ?? "" } : null,
    productCount: byId.get(String(c._id)) ?? 0,
    fields: (categoryFieldsSchema.safeParse((c as { fields?: unknown }).fields ?? []).data ?? []) as CategoryField[],
    hideFields: ((c as { hideFields?: string[] }).hideFields ?? []) as string[],
    productsInChildrenOnly: Boolean(c.productsInChildrenOnly),
    options: {
      glazeLabel: c.options?.glazeLabel ?? "",
      sizeLabel: c.options?.sizeLabel ?? "",
      glazeStyle: (c.options?.glazeStyle ?? "") as "" | "photo" | "color" | "chips",
      allowedGlazes: (c.options?.allowedGlazes ?? []).map(String),
      allowedSizes: (c.options?.allowedSizes ?? []).map(String),
    },
    // A parent that no longer exists is treated as top-level.
    parentId: c.parent && ids.has(String(c.parent)) ? String(c.parent) : null,
  }));

  type Row = (typeof rows)[number] & { depth: 0 | 1 | 2; label: string; parentName: string; childCount: number };
  const out: Row[] = [];
  const kidsOf = (id: string) => rows.filter((r) => r.parentId === id);
  // Depth-first: category, its subcategories, and their sub-subcategories (patterns).
  for (const p of rows.filter((r) => !r.parentId)) {
    const kids = kidsOf(p.id);
    out.push({ ...p, depth: 0, label: p.name, parentName: "", childCount: kids.length });
    for (const k of kids) {
      const grand = kidsOf(k.id);
      out.push({ ...k, depth: 1, label: `${p.name} › ${k.name}`, parentName: p.name, childCount: grand.length });
      for (const g of grand) out.push({ ...g, depth: 2, label: `${p.name} › ${k.name} › ${g.name}`, parentName: k.name, childCount: 0 });
    }
  }
  return out;
}

type CategoryData = {
  fields?: CategoryField[];
  hideFields?: string[];
  name: string; slug: string; description?: string; sortOrder: number; isActive: boolean;
  image?: { url: string; publicId: string; alt: string } | null; parent?: string | null;
};

export async function saveCategory(id: string | null, data: CategoryData) {
  await connectDB();
  const parent = data.parent ?? null;
  if (parent) {
    // Up to three levels: category → subcategory → sub-subcategory (e.g. Ceramics → Mugs → Tapered).
    if (parent === id) throw new CatalogError("A category can't be its own parent.");
    const p = await Category.findById(parent).select("parent").lean();
    if (!p) throw new CatalogError("That parent category no longer exists.");
    const parentDepth = p.parent ? ((await Category.findById(p.parent).select("parent").lean())?.parent ? 2 : 1) : 0;
    if (parentDepth >= 2) throw new CatalogError("Sub-subcategories can't have their own children. Pick a category or subcategory as the parent.");
    if (id) {
      const kids = await Category.find({ parent: id }).select("_id").lean();
      const grandKids = kids.length ? await Category.exists({ parent: { $in: kids.map((k) => k._id) } }) : null;
      // Moving a branch must keep it within three levels.
      if (grandKids || (kids.length && parentDepth >= 1))
        throw new CatalogError("This would make the tree deeper than three levels. Move its subcategories first.");
      if (String(parent) === id || kids.some((k) => String(k._id) === String(parent))) throw new CatalogError("A category can't be inside its own subcategory.");
    }
  }
  const doc = { ...data, parent, image: data.image ?? undefined };
  try {
    if (id) await Category.updateOne({ _id: id }, { $set: doc, ...(data.image ? {} : { $unset: { image: 1 } }) });
    else await Category.create(doc);
  } catch (e) {
    throw new CatalogError(duplicateKeyMessage(e) ?? "Couldn't save the category.");
  }
}

/** Show or hide a category (and with it, its subcategories) in the store. */
export async function setCategoryActive(id: string, active: boolean) {
  await connectDB();
  await Category.updateOne({ _id: id }, { $set: { isActive: active } });
}

export async function deleteCategory(id: string) {
  await connectDB();
  const n = await Product.countDocuments({ category: id });
  // (subcategory check below also covers sub-subcategories)
  if (n > 0) throw new CatalogError(`Move or delete its ${n} product${n === 1 ? "" : "s"} first, or hide the category instead.`);
  const subs = await Category.countDocuments({ parent: id });
  if (subs > 0) throw new CatalogError(`Move or delete its ${subs} subcategor${subs === 1 ? "y" : "ies"} first.`);
  await Category.deleteOne({ _id: id });
}

export async function listGlazesAndSizes() {
  await connectDB();
  const [glazes, sizes] = await Promise.all([Glaze.find().sort({ name: 1 }).lean(), Size.find().sort({ sortOrder: 1, label: 1 }).lean()]);
  return {
    glazes: glazes.map((g) => ({ id: String(g._id), name: g.name, slug: g.slug, hex: g.hex ?? "#cccccc", finish: g.finish ?? "glossy" })),
    sizes: sizes.map((s) => ({ id: String(s._id), label: s.label, slug: s.slug, sortOrder: s.sortOrder ?? 0 })),
  };
}

export async function saveGlaze(id: string | null, data: { name: string; slug: string; hex: string; finish: string }) {
  await connectDB();
  try {
    if (id) await Glaze.updateOne({ _id: id }, { $set: data });
    else await Glaze.create(data);
  } catch (e) {
    throw new CatalogError(duplicateKeyMessage(e) ?? "Couldn't save the glaze.");
  }
}

export async function saveSize(id: string | null, data: { label: string; slug: string; sortOrder: number }) {
  await connectDB();
  try {
    if (id) await Size.updateOne({ _id: id }, { $set: data });
    else await Size.create(data);
  } catch (e) {
    throw new CatalogError(duplicateKeyMessage(e) ?? "Couldn't save the size.");
  }
}

export async function deleteGlaze(id: string) {
  await connectDB();
  if (await Product.exists({ "variants.glaze": id })) throw new CatalogError("This glaze is used by product variants.");
  await Glaze.deleteOne({ _id: id });
}

export async function deleteSize(id: string) {
  await connectDB();
  if (await Product.exists({ "variants.size": id })) throw new CatalogError("This size is used by product variants.");
  await Size.deleteOne({ _id: id });
}
