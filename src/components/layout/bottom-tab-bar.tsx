"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, ShoppingBag, User, type LucideIcon } from "lucide-react";
import { mobileTabs } from "@/config/site";
import { cn } from "@/lib/utils";

const icons: Record<(typeof mobileTabs)[number]["icon"], LucideIcon> = {
  home: Home,
  grid: LayoutGrid,
  search: Search,
  cart: ShoppingBag,
  user: User,
};

const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

/** Floating pill tab bar (mobile only). */
/** `hidden`: tab hrefs to leave out (pages switched off in Studio → Visibility). */
export function BottomTabBar({ cartCount, hidden = [] }: { cartCount: number; hidden?: string[] }) {
  const tabs = mobileTabs.filter((t) => !hidden.includes(t.href));
  const pathname = usePathname();
  // Product and checkout pages show their own sticky action bar instead.
  if (pathname.startsWith("/products/") || pathname.startsWith("/checkout")) return null;

  return (
    <nav aria-label="Primary" className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-30 md:hidden">
      <ul style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }} className="mx-auto grid max-w-md rounded-pill bg-ink/95 p-1.5 shadow-float backdrop-blur">
        {tabs.map((tab) => {
          const Icon = icons[tab.icon];
          const active = isActive(pathname, tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                aria-label={tab.icon === "cart" ? `Cart, ${cartCount} items` : tab.label}
                className={cn(
                  "relative flex h-12 flex-col items-center justify-center gap-0.5 rounded-pill text-[10px] font-medium transition-colors duration-300",
                  active ? "bg-canvas text-ink" : "text-canvas/70 hover:text-canvas",
                )}
              >
                <span className="relative">
                  <Icon className="size-5" strokeWidth={1.6} />
                  {tab.icon === "cart" && cartCount > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] leading-4 text-on-accent">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
