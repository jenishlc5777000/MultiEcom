import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getCartCount } from "@/services/cart.service";
import { getSiteConfig } from "@/services/site-config.service";

// Header shows per-user cart count and catalogue data from the DB.
export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [cartCount, site] = await Promise.all([getCartCount(), getSiteConfig()]);
  // Studio → Visibility.
  const v = site.visibility;
  const hiddenTabs = [...(v.pages.search ? [] : ["/search"]), ...(v.pages.categories ? [] : ["/category"])];
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-ink focus:p-3 focus:text-canvas">
        Skip to content
      </a>
      {v.header && <SiteHeader cartCount={cartCount} />}
      <main id="main" className={v.mobileTabBar ? "pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom))] md:pb-0" : undefined}>
        {children}
      </main>
      {v.footer && <SiteFooter />}
      {v.mobileTabBar && <BottomTabBar cartCount={cartCount} hidden={hiddenTabs} />}
    </>
  );
}
