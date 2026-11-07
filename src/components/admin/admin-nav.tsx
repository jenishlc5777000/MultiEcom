"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CheckCircle2, ExternalLink, FolderTree, Mail, Package, Palette, Plug, Settings, ShoppingBag, Users, type LucideIcon } from "lucide-react";
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
    { href: "/admin/studio", label: "Studio", icon: Palette },
    { href: "/admin/integrations", label: "Integrations", icon: Plug },
    { href: "/admin/settings", label: "Settings & theme", icon: Settings },
  ];
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <>
      <nav aria-label="Dashboard" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active(item.href) ? "page" : undefined}
            className={cn(
              "group inline-flex min-h-touch shrink-0 items-center gap-3 rounded-pill px-4 text-[15px] transition-colors duration-200 lg:rounded-md",
              active(item.href) ? "bg-ink text-canvas" : "text-ink/80 hover:bg-surface-strong hover:text-ink",
            )}
          >
            <item.icon className="size-[18px]" strokeWidth={1.6} aria-hidden />
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span
                className={cn("min-w-6 rounded-full px-1.5 text-center text-xs font-semibold leading-6 tabular-nums", active(item.href) ? "bg-canvas text-ink" : "bg-accent text-on-accent")}
                aria-label={`${item.badge} pending`}
              >
                {item.badge}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>
      <div className="mt-auto hidden space-y-3 border-t border-line pt-5 text-sm lg:block">
        <Link href="/" className="inline-flex min-h-touch items-center gap-2 text-muted hover:text-ink">
          <ExternalLink className="size-4" aria-hidden /> View store
        </Link>
        <p className="text-muted">
          Signed in as <span className="text-ink">{ownerName}</span>
        </p>
      </div>
    </>
  );
}
