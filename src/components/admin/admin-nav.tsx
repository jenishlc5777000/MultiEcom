"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CheckCircle2, ExternalLink, FolderTree, Mail, Newspaper, Package, Palette, Plug, Settings, ShoppingBag, Users, type LucideIcon } from "lucide-react";
import { SidebarToggle, useSidebarCollapsed } from "./sidebar-toggle";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon; badge?: number };

export function AdminNav({ pending, ownerName }: { pending: number; ownerName: string }) {
  const pathname = usePathname();
  const items: Item[] = [
    { href: "/admin", label: "Analytics", icon: BarChart3 },
    { href: "/admin/approvals", label: "Approvals", icon: CheckCircle2, badge: pending },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/categories", label: "Categories", icon: FolderTree },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/messages", label: "Messages", icon: Mail },
    { href: "/admin/blog", label: "Blog", icon: Newspaper },
    { href: "/admin/studio", label: "Studio", icon: Palette },
    { href: "/admin/integrations", label: "Integrations", icon: Plug },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];
  // Collapsed to icons only (desktop); toggled from the sidebar buttons, saved in this browser.
  const { collapsed } = useSidebarCollapsed();
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <>
      <nav aria-label="Dashboard" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:min-h-0 lg:flex-col lg:gap-0.5 lg:overflow-y-auto lg:px-0">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active(item.href) ? "page" : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              "group inline-flex min-h-touch shrink-0 items-center gap-3 rounded-pill px-4 text-[15px] transition-colors duration-200 lg:min-h-10 lg:gap-2.5 lg:rounded-md lg:px-3 lg:text-[14px]",
              active(item.href) ? "bg-ink text-canvas" : "text-ink/80 hover:bg-surface-strong hover:text-ink",
            )}
          >
            <span className="relative shrink-0">
              <item.icon className="size-[18px]" strokeWidth={1.6} aria-hidden />
              {item.badge ? <span className="admin-sb-dot absolute -right-1 -top-1 hidden size-2 rounded-full bg-accent" aria-hidden /> : null}
            </span>
            <span className="admin-sb-hide flex-1 truncate">{item.label}</span>
            {item.badge ? (
              <span
                className={cn("admin-sb-hide min-w-6 rounded-full px-1.5 text-center text-xs font-semibold leading-6 tabular-nums", active(item.href) ? "bg-canvas text-ink" : "bg-accent text-on-accent")}
                aria-label={`${item.badge} pending`}
              >
                {item.badge}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>
      <div className="mt-auto hidden space-y-2 border-t border-line pt-4 text-sm lg:block">
        <Link href="/" title={collapsed ? "View store" : undefined} className="inline-flex min-h-10 items-center gap-2 px-3 text-muted hover:text-ink">
          <ExternalLink className="size-4 shrink-0" aria-hidden /> <span className="admin-sb-hide">View store</span>
        </Link>
        <SidebarToggle place="bottom" />
        <p className="admin-sb-hide px-3 text-muted">
          Signed in as <span className="text-ink">{ownerName}</span>
        </p>
      </div>
    </>
  );
}
