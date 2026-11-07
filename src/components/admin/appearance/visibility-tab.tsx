"use client";

import type { SiteConfig } from "@/lib/site-config";
import { Panel, SaveBar, SwitchRow, useSection } from "./shared";

/** Studio → Visibility: switch site parts and pages on or off. */
export function VisibilityTab({ initial }: { initial: SiteConfig["visibility"] }) {
  const s = useSection("visibility", initial);
  const v = s.v;
  const setPage = (k: keyof typeof v.pages, on: boolean) => s.set("pages", { ...v.pages, [k]: on });

  return (
    <div className="space-y-6">
      <Panel id="visibility-parts" title="Site parts" description="Turn whole parts of the store on or off. Header and footer designs are in the Header & logo and Footer tabs.">
        <div className="grid gap-2 sm:grid-cols-2">
          <SwitchRow label="Header" hint="Logo, menu, search, account and cart at the top" checked={v.header} onChange={(x) => s.set("header", x)} />
          <SwitchRow label="Footer" checked={v.footer} onChange={(x) => s.set("footer", x)} />
          <SwitchRow label="Announcement bar" hint="The text is set in Settings" checked={v.announcement} onChange={(x) => s.set("announcement", x)} />
          <SwitchRow label="Phone tab bar" hint="The floating bar at the bottom on phones" checked={v.mobileTabBar} onChange={(x) => s.set("mobileTabBar", x)} />
        </div>
        {!v.header && <p className="text-sm text-mto">With the header off, visitors can only reach the cart from the phone tab bar or links on the page.</p>}
      </Panel>

      <Panel id="visibility-pages" title="Pages" description="A page that is off shows “not found” and disappears from the menus, footer and tab bar.">
        <div className="grid gap-2 sm:grid-cols-2">
          <SwitchRow label="About page" hint="/about" checked={v.pages.about} onChange={(x) => setPage("about", x)} />
          <SwitchRow label="Contact page" hint="/contact (its form settings are in Contact form)" checked={v.pages.contact} onChange={(x) => setPage("contact", x)} />
          <SwitchRow label="Search" hint="/search and the search icon" checked={v.pages.search} onChange={(x) => setPage("search", x)} />
          <SwitchRow label="All categories page" hint="/category (single category pages stay on)" checked={v.pages.categories} onChange={(x) => setPage("categories", x)} />
          <SwitchRow label="Policy pages" hint="Shipping, returns, privacy, terms" checked={v.pages.policies} onChange={(x) => setPage("policies", x)} />
          <SwitchRow label="Reviews on product pages" checked={v.pages.reviews} onChange={(x) => setPage("reviews", x)} />
        </div>
        <p className="text-xs text-muted">Home, products, cart, checkout and the account pages are always on, so customers can still buy. Favourites and Offers are switched in the Shopping tab.</p>
      </Panel>

      <SaveBar {...s} label="Save visibility" />
    </div>
  );
}
