import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { sharedCache } from "@/lib/data-cache";
import type { ShoppingConfig } from "@/lib/site-config";
import { Order, Product } from "@/models";
import type { ProductCardDTO } from "@/types/dto";
import { toProductCard, type LeanProduct } from "./mappers";

/**
 * Product lists for Studio → Shopping: offers, hot deals, most ordered, and
 * cards for favourites / recently viewed (ids kept in the visitor's browser).
 */
const CARD_FIELDS = "slug name type availability isUnique images variants ratingAvg ratingCount";
const PUBLIC = { status: "ACTIVE" } as const;

const validIds = (ids: string[]) => ids.filter((id) => Types.ObjectId.isValid(id)).slice(0, 48);

/** Visible products by id, in the order given (unknown / hidden ids are skipped). */
export async function getProductCardsByIds(ids: string[]): Promise<ProductCardDTO[]> {
  const list = validIds(ids);
  if (!list.length) return [];
  await connectDB();
  const rows = await Product.find({ ...PUBLIC, _id: { $in: list } }).select(CARD_FIELDS).populate("variants.glaze", "name hex").lean<LeanProduct[]>();
  const byId = new Map(rows.map((r) => [String(r._id), r]));
  return list.flatMap((id) => (byId.has(id) ? [toProductCard(byId.get(id)!)] : []));
}

/** Picked offer products, then (optionally) every product with a compare-at price. */
export const getOfferProducts = sharedCache(
  async (cfg: Pick<ShoppingConfig["offers"], "productIds" | "includeDiscounted">, limit: number) => {
    const picked = await getProductCardsByIds(cfg.productIds);
    if (!cfg.includeDiscounted || picked.length >= limit) return picked.slice(0, limit);
    await connectDB();
    const seen = new Set(picked.map((p) => p.id));
    const rows = await Product.find({ ...PUBLIC, "variants.compareAtPrice": { $gt: 0 } })
      .select(CARD_FIELDS).populate("variants.glaze", "name hex").sort({ updatedAt: -1 }).limit(limit).lean<LeanProduct[]>();
    const discounted = rows.map(toProductCard).filter((p) => !seen.has(p.id) && p.compareAtFrom);
    return [...picked, ...discounted].slice(0, limit);
  },
  "merch-offers",
  "catalog",
);

export const getHotDealProducts = sharedCache(async (ids: string[]) => getProductCardsByIds(ids), "merch-hot-deals", "catalog");

/** Most ordered: by units in paid, not-cancelled orders (manual mode = the picked products). */
export const getBestsellerProducts = sharedCache(
  async (cfg: Pick<ShoppingConfig["bestsellers"], "mode" | "productIds" | "count">) => {
    if (cfg.mode === "manual") return (await getProductCardsByIds(cfg.productIds)).slice(0, cfg.count);
    await connectDB();
    const top = await Order.aggregate<{ _id: Types.ObjectId; units: number }>([
      { $match: { paymentStatus: { $in: ["PAID", "PARTIALLY_REFUNDED"] }, status: { $nin: ["CANCELLED", "RETURNED"] } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.product", units: { $sum: "$items.qty" } } },
      { $sort: { units: -1 } },
      { $limit: cfg.count * 2 },
    ]);
    const ranked = await getProductCardsByIds(top.map((t) => String(t._id)));
    if (ranked.length >= cfg.count) return ranked.slice(0, cfg.count);
    // Not enough sales yet: fill with the best-rated pieces so the section isn't empty.
    const seen = new Set(ranked.map((p) => p.id));
    const fill = await Product.find({ ...PUBLIC, _id: { $nin: [...seen].map((id) => new Types.ObjectId(id)) } })
      .select(CARD_FIELDS).populate("variants.glaze", "name hex").sort({ ratingCount: -1, ratingAvg: -1, createdAt: -1 })
      .limit(cfg.count - ranked.length).lean<LeanProduct[]>();
    return [...ranked, ...fill.map(toProductCard)];
  },
  "merch-bestsellers",
  "catalog",
);

/** Small product list for the admin pickers. */
export async function listProductsForPicker() {
  await connectDB();
  const rows = await Product.find({ status: { $ne: "ARCHIVED" } })
    .select("name images variants.price variants.compareAtPrice variants.images status")
    .sort({ name: 1 })
    .limit(500)
    .lean<{ _id: Types.ObjectId; name: string; status: string; images?: { url: string }[]; variants: { price: number; compareAtPrice?: number; images?: { main?: { url: string } } }[] }[]>();
  return rows.map((p) => ({
    id: String(p._id),
    name: p.name,
    status: p.status,
    image: p.images?.[0]?.url ?? p.variants[0]?.images?.main?.url ?? "",
    price: Math.min(...p.variants.map((v) => v.price)),
    discounted: p.variants.some((v) => (v.compareAtPrice ?? 0) > v.price),
  }));
}
export type PickerProduct = Awaited<ReturnType<typeof listProductsForPicker>>[number];

/** A list placed on store pages from Studio → Shopping → "Show on pages". */
export type PlacedList = {
  id: "offers" | "hot-deals" | "most-ordered";
  title: string;
  subtitle: string;
  pages: string[];
  position: "top" | "bottom";
  endsAt: string;
  products: ProductCardDTO[];
};

/** Lists that are on and placed on at least one page (empty lists are dropped). */
export async function getPlacedLists(s: ShoppingConfig): Promise<PlacedList[]> {
  const live = (x: { enabled: boolean; showOn: string[] }) => x.enabled && x.showOn.length > 0;
  const [offers, hot, best] = await Promise.all([
    live(s.offers) ? getOfferProducts({ productIds: s.offers.productIds, includeDiscounted: s.offers.includeDiscounted }, s.offers.placeCount) : [],
    live(s.hotDeals) ? getHotDealProducts(s.hotDeals.productIds) : [],
    live(s.bestsellers) ? getBestsellerProducts({ mode: s.bestsellers.mode, productIds: s.bestsellers.productIds, count: s.bestsellers.count }) : [],
  ]);
  const dealEnds = s.hotDeals.endsAt && Date.parse(s.hotDeals.endsAt) > Date.now() ? s.hotDeals.endsAt : "";
  const lists: PlacedList[] = [
    { id: "hot-deals", title: s.hotDeals.title, subtitle: s.hotDeals.subtitle, pages: s.hotDeals.showOn, position: s.hotDeals.position, endsAt: dealEnds, products: hot.slice(0, s.hotDeals.placeCount) },
    { id: "offers", title: s.offers.title, subtitle: s.offers.subtitle, pages: s.offers.showOn, position: s.offers.position, endsAt: "", products: offers.slice(0, s.offers.placeCount) },
    { id: "most-ordered", title: s.bestsellers.title, subtitle: s.bestsellers.subtitle, pages: s.bestsellers.showOn, position: s.bestsellers.position, endsAt: "", products: best.slice(0, s.bestsellers.placeCount) },
  ];
  return lists.filter((l) => l.pages.length && l.products.length);
}
