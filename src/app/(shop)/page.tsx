import { getProductCardsByIds } from "@/services/merch.service";
import { RecentlyViewed } from "@/components/shopping/recently-viewed";
import { BuilderHome } from "@/components/builder/builder-home";
import { BentoHome } from "@/components/home/modes/bento-home";
import { LandingHome } from "@/components/home/modes/landing-home";
import { LookbookHome } from "@/components/home/modes/lookbook-home";
import { ShopHome } from "@/components/home/modes/shop-home";
import { SpotlightHome } from "@/components/home/modes/spotlight-home";
import type { HomeData, ShopSort } from "@/components/home/modes/types";
import { getCategories, getHomepageData, getShopFeed } from "@/services/catalog.service";
import { getSiteConfig } from "@/services/site-config.service";
import { getActiveTheme, getStoreHighlights, getStoreInfo } from "@/services/store.service";

type Props = { searchParams: Promise<{ page?: string; sort?: string }> };
const SORTS: ShopSort[] = ["new", "ready", "price-asc", "price-desc"];

/** The home page. Which kind (landing, direct shop, lookbook…) comes from the owner's theme. */
export default async function HomePage({ searchParams }: Props) {
  const [{ banners, readyStock, newest }, categories, highlights, store, theme, site, sp] = await Promise.all([
    getHomepageData(),
    getCategories(),
    getStoreHighlights(),
    getStoreInfo(),
    getActiveTheme(),
    getSiteConfig(),
    searchParams,
  ]);

  // Studio → Content → Hero decides whether an active homepage banner replaces the hero text.
  const banner = site.content.hero.useBannerText ? banners[0] : undefined;
  // Studio → Content → Hero: uploaded pictures and the featured card.
  const hero = site.content.hero;
  const uploaded = hero.images.map((i) => ({ url: i.url, alt: i.alt }));
  const fromProducts = async () => {
    const list = hero.productSource === "chosen" ? await getProductCardsByIds(hero.productIds) : hero.productSource === "ready" ? readyStock : newest;
    return list.flatMap((p) => (p.image ? [{ url: p.image.url, alt: p.image.alt || p.name }] : [])).slice(0, hero.productCount);
  };
  const pictures = hero.imageSource === "products" ? await fromProducts() : hero.imageSource === "upload" ? uploaded : uploaded.length ? uploaded : [];
  const picked = hero.featured === "product" && hero.featuredProductId ? (await getProductCardsByIds([hero.featuredProductId]))[0] : undefined;
  const data: HomeData = {
    theme,
    site,
    banner,
    heroImage: pictures[0] ?? banner?.image ?? newest[0]?.image ?? categories[0]?.image,
    heroSlides: hero.rotate && pictures.length > 1 ? pictures : undefined,
    storyImage: newest[1]?.image ?? categories[1]?.image ?? newest[0]?.image,
    gallery: [...pictures, ...[...newest, ...readyStock].flatMap((p) => (p.image ? [p.image] : []))].slice(0, 6),
    featured: hero.featured === "hide" ? undefined : (picked ?? readyStock[0] ?? newest[0]),
    // Real catalogue numbers only; anything that is zero is left out.
    stats: [
      { value: highlights.readyCount, label: "ready to ship" },
      { value: highlights.glazeNames.length, label: "glazes" },
      { value: categories.length, label: "categories" },
    ].filter((s) => s.value > 0 && site.content.hero.showStats),
    tickerItems: [...highlights.glazeNames, ...categories.map((c) => c.name)],
    readyStock,
    newest,
    categories,
    store: { shippingFlatFee: store.shippingFlatFee, freeShippingThreshold: store.freeShippingThreshold, returnWindowDays: store.returnWindowDays },
  };

  // Studio → Shopping → Recently viewed "on the home page" (added under any home page type).
  const rv = site.shopping.recentlyViewed;
  const recent = rv.enabled && rv.onHome ? <div className="container py-16 md:py-24"><RecentlyViewed title={rv.title} count={rv.count} /></div> : null;
  const page = await homeContent();
  return recent ? <>{page}{recent}</> : page;

  async function homeContent() {
  // Studio → Sections: a custom-built home page replaces the theme's one.
  if (site.builder.enabled && site.builder.sections.length) {
    const page = Math.max(1, Number(sp.page) || 1);
    const needsFeed = site.builder.sections.some((s) => s.enabled && s.type === "shopFeed");
    const feed = needsFeed ? { ...(await getShopFeed(page, "new")), page, sort: "new" as const } : undefined;
    return <BuilderHome data={{ ...data, feed }} sections={site.builder.sections} />;
  }

  switch (theme.layout.home) {
    case "shop": {
      const page = Math.max(1, Number(sp.page) || 1);
      const sort = (SORTS as string[]).includes(sp.sort ?? "") ? (sp.sort as ShopSort) : "new";
      const feed = await getShopFeed(page, sort);
      return <ShopHome {...data} feed={{ ...feed, page, sort }} />;
    }
    case "lookbook":
      return <LookbookHome {...data} />;
    case "spotlight":
      return <SpotlightHome {...data} />;
    case "bento":
      return <BentoHome {...data} />;
    default:
      return <LandingHome {...data} />;
  }
  }
}
