/**
 * Plain, serialisable shapes passed from server to client components.
 * Mongoose documents (ObjectId, Date) never cross that boundary.
 */
import type { Availability, ProductType } from "@/models/Product";

export type ImageDTO = { url: string; alt: string };

export type GlazeDTO = { id: string; name: string; hex?: string; swatchUrl?: string };
export type SizeDTO = { id: string; label: string };

export type VariantDTO = {
  id: string;
  sku: string;
  price: number; // paise
  compareAtPrice?: number;
  inStock: boolean;
  stock: number;
  glaze: GlazeDTO | null;
  size: SizeDTO | null;
  images: { main?: ImageDTO; side?: ImageDTO; bottom?: ImageDTO };
};

export type ProductCardDTO = {
  id: string;
  slug: string;
  name: string;
  type: ProductType;
  availability: Availability;
  isUnique: boolean;
  image?: ImageDTO;
  hoverImage?: ImageDTO; // second photo, cross-faded on hover
  swatches: { name: string; hex?: string }[]; // distinct glazes across variants
  priceFrom: number; // paise
  compareAtFrom?: number; // paise, only when the cheapest variant is discounted
  ratingAvg: number;
  ratingCount: number;
};

export type ProductDetailDTO = ProductCardDTO & {
  patternName?: string;
  description: string;
  capacity?: string;
  dimensions?: string;
  care?: string;
  kitContents: string[];
  leadTimeDays?: number;
  images: ImageDTO[];
  variants: VariantDTO[];
  category: { name: string; slug: string };
};

export type SubcategoryDTO = { id: string; name: string; slug: string; image?: ImageDTO };
/** Top-level category with its visible subcategories (one level). */
export type CategoryDTO = { id: string; name: string; slug: string; image?: ImageDTO; children: SubcategoryDTO[] };

export type CartLineDTO = {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  variantLabel: string;
  image?: ImageDTO;
  unitPrice: number;
  qty: number;
  lineTotal: number;
  availability: Availability;
  maxQty: number;
  problem?: "unavailable" | "insufficient_stock";
};

export type CartDTO = { lines: CartLineDTO[]; itemCount: number; subtotal: number };

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
