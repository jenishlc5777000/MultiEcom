import "server-only";
import type { Types } from "mongoose";
import type { Image } from "@/models";
import type { Availability, ProductType } from "@/models/Product";
import type { ImageDTO, ProductCardDTO, ProductDetailDTO, VariantDTO } from "@/types/dto";

type Id = Types.ObjectId | string;

/** Lean product shape after `populate("variants.glaze variants.size category")`. */
export type LeanVariant = {
  _id: Id;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  isActive?: boolean | null;
  glaze?: { _id: Id; name: string; hex?: string | null; swatch?: Image | null } | null;
  size?: { _id: Id; label: string } | null;
  images?: { main?: Image | null; side?: Image | null; bottom?: Image | null } | null;
};

export type LeanProduct = {
  _id: Id;
  slug: string;
  name: string;
  type: ProductType;
  availability: Availability;
  isUnique?: boolean | null;
  images?: Image[];
  variants: LeanVariant[];
  ratingAvg?: number | null;
  ratingCount?: number | null;
  patternName?: string | null;
  description?: string | null;
  capacity?: string | null;
  dimensions?: string | null;
  care?: string | null;
  kitContents?: string[];
  leadTimeDays?: number | null;
  category?: { name: string; slug: string } | Id | null;
};

export const toImage = (img?: Image | null, fallbackAlt = ""): ImageDTO | undefined =>
  img?.url ? { url: img.url, alt: img.alt || fallbackAlt } : undefined;

const activeVariants = (p: LeanProduct) => p.variants.filter((v) => v.isActive !== false);

export function toProductCard(p: LeanProduct): ProductCardDTO {
  const variants = activeVariants(p);
  const cheapest = variants.reduce<LeanVariant | undefined>((min, v) => (!min || v.price < min.price ? v : min), undefined);

  // Distinct photos: product gallery first, then variant shots.
  const photos = [...(p.images ?? []), ...variants.flatMap((v) => [v.images?.main, v.images?.side])].filter(
    (i): i is Image => Boolean(i?.url),
  );
  const unique = photos.filter((img, i) => photos.findIndex((x) => x.url === img.url) === i);

  const swatches = new Map<string, { name: string; hex?: string }>();
  for (const v of variants) {
    if (v.glaze && typeof v.glaze === "object" && "name" in v.glaze) {
      swatches.set(String(v.glaze._id), { name: v.glaze.name, hex: v.glaze.hex ?? undefined });
    }
  }

  return {
    id: String(p._id),
    slug: p.slug,
    name: p.name,
    type: p.type,
    availability: p.availability,
    isUnique: Boolean(p.isUnique),
    image: toImage(unique[0], p.name),
    hoverImage: toImage(unique[1], `${p.name}, another view`),
    swatches: [...swatches.values()],
    priceFrom: cheapest?.price ?? 0,
    compareAtFrom: cheapest?.compareAtPrice && cheapest.compareAtPrice > cheapest.price ? cheapest.compareAtPrice : undefined,
    ratingAvg: p.ratingAvg ?? 0,
    ratingCount: p.ratingCount ?? 0,
  };
}

export function toVariant(v: LeanVariant, p: LeanProduct): VariantDTO {
  const madeToOrder = p.availability === "MADE_TO_ORDER";
  return {
    id: String(v._id),
    sku: v.sku,
    price: v.price,
    compareAtPrice: v.compareAtPrice ?? undefined,
    stock: v.stock,
    inStock: p.availability !== "SOLD" && (madeToOrder || v.stock > 0),
    glaze: v.glaze
      ? { id: String(v.glaze._id), name: v.glaze.name, hex: v.glaze.hex ?? undefined, swatchUrl: v.glaze.swatch?.url }
      : null,
    size: v.size ? { id: String(v.size._id), label: v.size.label } : null,
    images: {
      main: toImage(v.images?.main, p.name),
      side: toImage(v.images?.side, `${p.name}, side view`),
      bottom: toImage(v.images?.bottom, `${p.name}, base`),
    },
  };
}

export function toProductDetail(p: LeanProduct): ProductDetailDTO {
  const category =
    p.category && typeof p.category === "object" && "slug" in p.category
      ? { name: p.category.name, slug: p.category.slug }
      : { name: "", slug: "" };
  return {
    ...toProductCard(p),
    patternName: p.patternName ?? undefined,
    description: p.description ?? "",
    capacity: p.capacity ?? undefined,
    dimensions: p.dimensions ?? undefined,
    care: p.care ?? undefined,
    kitContents: p.kitContents ?? [],
    leadTimeDays: p.leadTimeDays ?? undefined,
    images: (p.images ?? []).map((i) => toImage(i, p.name)).filter((i): i is ImageDTO => Boolean(i)),
    variants: activeVariants(p).map((v) => toVariant(v, p)),
    category,
  };
}

export function variantLabel(v: Pick<LeanVariant, "glaze" | "size">) {
  return [v.glaze?.name, v.size?.label].filter(Boolean).join(" · ");
}
