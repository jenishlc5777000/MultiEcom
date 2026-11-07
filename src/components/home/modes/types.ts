import type { Theme } from "@/config/themes";
import type { SiteConfig } from "@/lib/site-config";
import type { CategoryDTO, ImageDTO, ProductCardDTO } from "@/types/dto";

export type HomeBanner = { title: string; subtitle: string; ctaLabel: string; ctaHref: string; image?: ImageDTO };
export type ShopSort = "new" | "ready" | "price-asc" | "price-desc";

/** Everything the home page loads once; each home mode uses what it needs. */
export type HomeData = {
  theme: Theme;
  /** Admin → Studio settings (content, section switches…). */
  site: SiteConfig;
  banner?: HomeBanner;
  heroImage?: ImageDTO;
  /** Pictures the hero cycles through (Studio → Content → Hero → change automatically). */
  heroSlides?: ImageDTO[];
  storyImage?: ImageDTO;
  gallery: ImageDTO[];
  featured?: ProductCardDTO;
  stats: { value: number; label: string }[];
  tickerItems: string[];
  readyStock: ProductCardDTO[];
  newest: ProductCardDTO[];
  categories: CategoryDTO[];
  store: { shippingFlatFee: number; freeShippingThreshold: number; returnWindowDays: number };
  /** Only loaded for the direct-shop home page. */
  feed?: { products: ProductCardDTO[]; total: number; pageCount: number; page: number; sort: ShopSort };
};

/** "Made slowly, / for the *everyday* table." → plain text for small spaces. */
export const plainTitle = (t: string) => t.replace(/\*/g, "").replace(/\s*\/\s*|\n/g, " ");
