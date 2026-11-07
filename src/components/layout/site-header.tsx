import { mainNav, policyPages } from "@/config/site";
import { getCategories } from "@/services/catalog.service";
import { getSiteConfig } from "@/services/site-config.service";
import { getStoreInfo } from "@/services/store.service";
import { HeaderBar } from "./header-bar";

/** Server wrapper: loads categories, announcement and header settings; the client bar handles scroll and menus. */
export async function SiteHeader({ cartCount }: { cartCount: number }) {
  const [categories, store, site] = await Promise.all([getCategories(), getStoreInfo(), getSiteConfig()]);
  const { pages, announcement } = site.visibility;
  const sh = site.shopping;
  // Studio → Visibility removes links to switched-off pages; Studio → Shopping adds Offers.
  const nav = [
    ...mainNav.filter((l) => (l.href === "/about" ? pages.about : l.href.startsWith("/policies/") ? pages.policies : true)),
    ...(sh.offersPage.enabled && sh.offersPage.showInNav ? [{ href: "/offers", label: sh.offersPage.title }] : []),
    ...(site.blog.enabled && site.blog.showInNav ? [{ href: "/blog", label: site.blog.footerLabel || site.blog.title }] : []),
  ];
  const policies = pages.policies ? policyPages.map((p) => ({ href: `/policies/${p.slug}`, label: p.label })) : [];
  return (
    <HeaderBar
      categories={categories}
      cartCount={cartCount}
      announcement={store.announcement}
      header={site.header}
      brand={site.logo}
      contact={{ email: store.contactEmail, phone: store.contactPhone }}
      search={site.search}
      nav={nav}
      policies={policies}
      features={{ favourites: sh.favourites.enabled && sh.favourites.showInHeader, search: pages.search, announcement }}
    />
  );
}
