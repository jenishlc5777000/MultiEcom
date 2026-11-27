import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ListsAccountSync } from "@/components/shopping/lists-account-sync";
import { PlacedLists } from "@/components/shopping/placed-lists";
import { getCurrentUser } from "@/lib/auth/guards";
import { getCartCount } from "@/services/cart.service";
import { getPlacedLists } from "@/services/merch.service";
import { getSiteConfig } from "@/services/site-config.service";

// Header shows per-user cart count and catalogue data from the DB.
export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [cartCount, site, user] = await Promise.all([getCartCount(), getSiteConfig(), getCurrentUser()]);
  // Studio → Visibility.
  const v = site.visibility;
  // Studio → Shopping → "Show on pages" (each list picks its pages and top/bottom).
  const placed = await getPlacedLists(site.shopping).catch(() => []);
  const offersPage = site.shopping.offersPage.enabled;
  const hiddenTabs = [...(v.pages.search ? [] : ["/search"]), ...(v.pages.categories ? [] : ["/category"])];
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-ink focus:p-3 focus:text-canvas">
        Skip to content
      </a>
      {/* Favourites / recently viewed belong to whoever is signed in. */}
      <ListsAccountSync userId={user?.id ?? null} />
      {v.header && <SiteHeader cartCount={cartCount} />}
      <main id="main" className={v.mobileTabBar ? "pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom))] md:pb-0" : undefined}>
        {placed.length > 0 && <PlacedLists lists={placed} position="top" offersPage={offersPage} />}
        {children}
        {placed.length > 0 && <PlacedLists lists={placed} position="bottom" offersPage={offersPage} />}
      </main>
      {v.footer && <SiteFooter />}
      {v.mobileTabBar && <BottomTabBar cartCount={cartCount} hidden={hiddenTabs} />}
    </>
  );
}
