"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Countdown } from "@/components/builder/countdown";
import { ProductGrid } from "@/components/product/product-card";
import type { MerchPage } from "@/lib/site-config";
import type { PlacedList } from "@/services/merch.service";

/** Which Studio page key the current address belongs to. */
function pageOf(path: string): MerchPage | null {
  if (path === "/") return "home";
  if (path === "/category") return "categories";
  if (path.startsWith("/category/")) return "category";
  if (path.startsWith("/products/")) return "product";
  const first = path.split("/")[1];
  return (["search", "cart", "favourites", "about", "contact"] as const).find((p) => p === first) ?? null;
}

/** Offers / hot deals / most ordered on the pages chosen in Studio → Shopping. */
export function PlacedLists({ lists, position, offersPage }: { lists: PlacedList[]; position: "top" | "bottom"; offersPage: boolean }) {
  const page = pageOf(usePathname());
  const shown = page ? lists.filter((l) => l.position === position && l.pages.includes(page)) : [];
  if (!shown.length) return null;
  return (
    <div className={position === "top" ? "container space-y-12 pt-8 md:pt-12" : "container space-y-16 py-16 md:py-24"}>
      {shown.map((l) => (
        <section key={l.id} aria-labelledby={`placed-${l.id}`} className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1.5">
              <h2 id={`placed-${l.id}`} className="text-h3">{l.title}</h2>
              {l.subtitle && <p className="max-w-xl text-sm text-muted">{l.subtitle}</p>}
            </div>
            <div className="flex items-center gap-4">
              {l.endsAt && <Countdown endsAt={l.endsAt} endedText="These deals have ended." />}
              {offersPage && <Link href={`/offers#${l.id}`} className="text-sm font-medium underline underline-offset-4">See all</Link>}
            </div>
          </div>
          <ProductGrid products={l.products} />
        </section>
      ))}
    </div>
  );
}
