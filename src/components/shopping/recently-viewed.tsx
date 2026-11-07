"use client";

import { useEffect } from "react";
import { clearRecentlyViewed, recordRecentlyViewed, RECENT_KEY, useStoredList } from "@/lib/client-lists";
import { ProductIdGrid } from "./product-id-list";

/** Put on a product page: remembers that this product was viewed. Renders nothing. */
export function RecentlyViewedTracker({ productId }: { productId: string }) {
  useEffect(() => recordRecentlyViewed(productId), [productId]);
  return null;
}

/** "Recently viewed" products from this browser (hidden when there are none). */
export function RecentlyViewed({ title = "Recently viewed", count = 8, excludeId, className }: { title?: string; count?: number; excludeId?: string; className?: string }) {
  const ids = useStoredList(RECENT_KEY).filter((id) => id !== excludeId).slice(0, count);
  if (!ids.length) return null;
  return (
    <section className={className} aria-labelledby="recent-title">
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 id="recent-title" className="text-h3">{title}</h2>
        <button type="button" onClick={clearRecentlyViewed} className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline">Clear</button>
      </div>
      <ProductIdGrid ids={ids} />
    </section>
  );
}
