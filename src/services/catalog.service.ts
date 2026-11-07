import "server-only";
import { cache } from "react";
import { sharedCache } from "@/lib/data-cache";
import { connectDB } from "@/lib/db/connect";
import { Category, HomepageBanner, Product } from "@/models";
import type { CategoryDTO, ProductCardDTO, ProductDetailDTO } from "@/types/dto";
import { toImage, toProductCard, toProductDetail, type LeanProduct } from "./mappers";

const PUBLIC = { status: "ACTIVE" } as const;
const CARD_FIELDS = "slug name type availability isUnique images variants ratingAvg ratingCount";
const PAGE_SIZE = 24;

/** Visible top-level categories, each with its visible subcategories. */
export const getCategories = cache(sharedCache(async (): Promise<CategoryDTO[]> => {
  await connectDB();
  const rows = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
  const sub = (c: (typeof rows)[number]) => ({ id: String(c._id), name: c.name, slug: c.slug, image: toImage(c.image, c.name) });
  return rows
    .filter((c) => !c.parent)
    .map((c) => ({ ...sub(c), children: rows.filter((k) => k.parent && String(k.parent) === String(c._id)).map(sub) }));
}, "categories", "catalog"));

/**
 * A category page: its parent (for a subcategory) or its subcategories (for a
 * top-level one). `productCategoryIds` covers the category and its subcategories.
 */
export type CategoryNav = { parent: { name: string; slug: string }; items: { id: string; name: string; slug: string; image?: ReturnType<typeof toImage> }[] };

/**
 * A category page (any of the three levels): its ancestors for the breadcrumb,
 * its direct children, the sibling/child navigation to show, and every
 * category id whose products belong on this page.
 * `requiresChild`: a category like Mugs (with patterns Tapered/Round/Classic
 * and "choose a pattern first") shows its patterns instead of a product list.
 */
export const getCategoryBySlug = cache(sharedCache(async (slug: string) => {
  await connectDB();
  const c = await Category.findOne({ slug, isActive: true }).lean();
  if (!c) return null;
  const parent = c.parent ? await Category.findOne({ _id: c.parent, isActive: true }).select("name slug parent options").lean() : null;
  if (c.parent && !parent) return null; // inside a hidden category
  const grand = parent?.parent ? await Category.findOne({ _id: parent.parent, isActive: true }).select("name slug options").lean() : null;
  if (parent?.parent && !grand) return null;
  const depth = grand ? 2 : parent ? 1 : 0;

  const children = depth < 2 ? await Category.find({ parent: c._id, isActive: true }).sort({ sortOrder: 1, name: 1 }).lean() : [];
  const grandChildren = depth === 0 && children.length
    ? await Category.find({ parent: { $in: children.map((k) => k._id) }, isActive: true }).select("_id").lean()
    : [];
  const siblings = parent ? await Category.find({ parent: parent._id, isActive: true }).sort({ sortOrder: 1, name: 1 }).lean() : [];
  const card = (k: { _id: unknown; name: string; slug: string; image?: unknown; description?: string | null }) => ({ id: String(k._id), name: k.name, slug: k.slug, image: toImage(k.image as never, k.name), description: k.description ?? "" });

  // Which links to show above the products.
  let nav: CategoryNav | null = null;
  if (depth === 0 || (depth === 1 && children.length)) nav = { parent: { name: c.name, slug: c.slug }, items: children.map(card) };
  else if (parent) nav = { parent: { name: parent.name, slug: parent.slug }, items: siblings.map(card) };

  // Product options (labels, glaze display, allowed values): nearest category that sets them.
  type WithOptions = { options?: { glazeLabel?: string | null; sizeLabel?: string | null; glazeStyle?: string | null } | null };
  const chain = [c, parent, grand].filter(Boolean) as unknown as WithOptions[];
  const pick = (k: "glazeLabel" | "sizeLabel" | "glazeStyle") => chain.map((x) => x?.options?.[k]).find((v) => v) ?? "";

  return {
    id: String(c._id),
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    depth,
    parent: parent ? { name: parent.name, slug: parent.slug } : null,
    ancestors: [grand, parent].filter(Boolean).map((a) => ({ name: a!.name, slug: a!.slug })),
    children: children.map(card),
    nav,
    requiresChild: Boolean(c.productsInChildrenOnly) && children.length > 0,
    productCategoryIds: [String(c._id), ...children.map((k) => String(k._id)), ...grandChildren.map((k) => String(k._id))],
    options: { glazeLabel: pick("glazeLabel"), sizeLabel: pick("sizeLabel"), glazeStyle: pick("glazeStyle") },
  };
}, "category-by-slug", "catalog"));

export type BrowseSort = "relevance" | "new" | "price-asc" | "price-desc" | "rating";
export type BrowseOptions = {
  q?: string;
  categoryIds?: string[];
  availability?: "READY_STOCK" | "MADE_TO_ORDER" | "";
  /** Price range in rupees (inclusive). */
  min?: number;
  max?: number;
  sort?: BrowseSort;
  page?: number;
};

const escapeRx = (q: string) => q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * One query for every product list (category pages, search, shop home):
 * text search, category, availability and price filters, sorting, pages.
 * A text search with no full-word match falls back to a name-contains match,
 * so partial words like "spec" still find "Speckled Oat Cup".
 */
export async function browseProducts(o: BrowseOptions = {}) {
  await connectDB();
  const page = Math.max(1, o.page ?? 1);
  const base: Record<string, unknown> = { ...PUBLIC };
  if (o.categoryIds?.length) base.category = { $in: o.categoryIds };
  if (o.availability) base.availability = o.availability;
  if (o.min !== undefined || o.max !== undefined) {
    const range: Record<string, number> = {};
    if (o.min !== undefined) range.$gte = Math.round(o.min * 100);
    if (o.max !== undefined) range.$lte = Math.round(o.max * 100);
    base.variants = { $elemMatch: { price: range } };
  }
  const q = o.q?.trim();
  let sort = o.sort ?? (q ? "relevance" : "new");
  if (sort === "relevance" && !q) sort = "new";
  const order: Record<string, 1 | -1 | { $meta: "textScore" }> =
    sort === "price-asc" ? { "variants.0.price": 1, createdAt: -1 }
    : sort === "price-desc" ? { "variants.0.price": -1, createdAt: -1 }
    : sort === "rating" ? { ratingAvg: -1, ratingCount: -1 }
    : sort === "relevance" ? { score: { $meta: "textScore" } }
    : { createdAt: -1 };

  const run = async (filter: Record<string, unknown>, textScore: boolean) => {
    const [rows, total] = await Promise.all([
      Product.find(filter, textScore ? { score: { $meta: "textScore" } } : undefined)
        .select(CARD_FIELDS).populate("variants.glaze", "name hex")
        .sort(textScore || sort !== "relevance" ? order : { createdAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean<LeanProduct[]>(),
      Product.countDocuments(filter),
    ]);
    return { products: rows.map(toProductCard), total, pageCount: Math.ceil(total / PAGE_SIZE) };
  };

  if (!q) return run(base, false);
  const text = await run({ ...base, $text: { $search: q } }, true);
  if (text.total > 0) return text;
  const rx = new RegExp(escapeRx(q), "i");
  return run({ ...base, $or: [{ name: rx }, { patternName: rx }, { tags: rx }] }, false);
}

/** Visible product count per category id (a parent includes its subcategories). */
export const getCategoryCounts = cache(sharedCache(async () => {
  await connectDB();
  const [rows, cats] = await Promise.all([
    Product.aggregate<{ _id: unknown; n: number }>([{ $match: PUBLIC }, { $group: { _id: "$category", n: { $sum: 1 } } }]),
    Category.find({ isActive: true }).select("parent").lean(),
  ]);
  const own = new Map(rows.map((r) => [String(r._id), r.n]));
  const total = new Map<string, number>();
  for (const c of cats) {
    const id = String(c._id);
    total.set(id, (total.get(id) ?? 0) + (own.get(id) ?? 0));
    if (c.parent) total.set(String(c.parent), (total.get(String(c.parent)) ?? 0) + (own.get(id) ?? 0));
  }
  return Object.fromEntries(total) as Record<string, number>;
}, "category-counts", "catalog"));

export async function getProductsByCategory(categoryIds: string | string[], page = 1, opts: Omit<BrowseOptions, "categoryIds" | "page"> = {}) {
  return browseProducts({ ...opts, categoryIds: Array.isArray(categoryIds) ? categoryIds : [categoryIds], page });
}

/** Instant-search suggestions: a few products and categories whose names match. */
export async function suggestProducts(q: string, limit = 6) {
  const term = q.trim();
  if (term.length < 2) return { products: [], categories: [] };
  await connectDB();
  const rx = new RegExp(escapeRx(term), "i");
  const [rows, cats] = await Promise.all([
    Product.find({ ...PUBLIC, $or: [{ name: rx }, { patternName: rx }, { tags: rx }] })
      .select("slug name images variants.price variants.images")
      .sort({ ratingCount: -1, createdAt: -1 })
      .limit(limit)
      .lean<LeanProduct[]>(),
    Category.find({ isActive: true, name: rx }).select("name slug").limit(4).lean(),
  ]);
  return {
    products: rows.map((p) => {
      const card = toProductCard(p);
      return { name: card.name, slug: card.slug, priceFrom: card.priceFrom, image: card.image?.url };
    }),
    categories: cats.map((c) => ({ name: c.name, slug: c.slug })),
  };
}

/** Every visible product, newest first, paginated (the direct-shop home page). */
export async function getShopFeed(page = 1, sort: "new" | "ready" | "price-asc" | "price-desc" = "new") {
  await connectDB();
  const filter = sort === "ready" ? { ...PUBLIC, availability: "READY_STOCK" } : PUBLIC;
  const order: Record<string, 1 | -1> =
    sort === "price-asc" ? { "variants.0.price": 1, createdAt: -1 } : sort === "price-desc" ? { "variants.0.price": -1, createdAt: -1 } : { createdAt: -1 };
  const [rows, total] = await Promise.all([
    Product.find(filter)
      .select(CARD_FIELDS).populate("variants.glaze", "name hex")
      .sort(order)
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean<LeanProduct[]>(),
    Product.countDocuments(filter),
  ]);
  return { products: rows.map(toProductCard), total, pageCount: Math.ceil(total / PAGE_SIZE) };
}

export const getProductBySlug = cache(async (slug: string): Promise<ProductDetailDTO | null> => {
  await connectDB();
  const p = await Product.findOne({ ...PUBLIC, slug })
    .populate("category", "name slug")
    .populate("variants.glaze", "name hex swatch")
    .populate("variants.size", "label")
    .lean<LeanProduct>();
  return p ? toProductDetail(p) : null;
});

export async function searchProducts(q: string, page = 1, opts: Omit<BrowseOptions, "q" | "page"> = {}) {
  if (!q && !opts.categoryIds?.length && !opts.availability && opts.min === undefined && opts.max === undefined)
    return { products: [] as ProductCardDTO[], total: 0, pageCount: 0 };
  return browseProducts({ ...opts, q, page });
}

export const getHomepageData = cache(sharedCache(async () => {
  await connectDB();
  const now = new Date();
  const [banners, readyStock, newest] = await Promise.all([
    HomepageBanner.find({
      isActive: true,
      $and: [
        { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
      ],
    })
      .sort({ sortOrder: 1 })
      .limit(5)
      .lean(),
    Product.find({ ...PUBLIC, availability: "READY_STOCK" }).select(CARD_FIELDS).populate("variants.glaze", "name hex").sort({ createdAt: -1 }).limit(12).lean<LeanProduct[]>(),
    Product.find(PUBLIC).select(CARD_FIELDS).populate("variants.glaze", "name hex").sort({ createdAt: -1 }).limit(12).lean<LeanProduct[]>(),
  ]);

  return {
    banners: banners.map((b) => ({
      id: String(b._id),
      title: b.title,
      subtitle: b.subtitle ?? "",
      ctaLabel: b.ctaLabel ?? "",
      ctaHref: b.ctaHref ?? "",
      image: toImage(b.image, b.title),
      mobileImage: toImage(b.mobileImage ?? b.image, b.title),
    })),
    readyStock: readyStock.map(toProductCard),
    newest: newest.map(toProductCard),
  };
}, "homepage-data", "catalog"));
