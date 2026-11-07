"use client";

import { useEffect, useState } from "react";
import { ProductGrid } from "@/components/product/product-card";
import type { ProductCardDTO } from "@/types/dto";

/** Loads product cards for ids kept in the browser (favourites, recently viewed). */
export function useProductCards(ids: string[]) {
  const key = ids.join(",");
  const [state, setState] = useState<{ key: string; products: ProductCardDTO[] } | null>(null);
  useEffect(() => {
    if (!key) {
      setState({ key, products: [] });
      return;
    }
    const ctrl = new AbortController();
    fetch(`/api/products/cards?ids=${key}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d: { products: ProductCardDTO[] }) => setState({ key, products: d.products }))
      .catch(() => {});
    return () => ctrl.abort();
  }, [key]);
  return { products: state?.key === key ? state.products : null };
}

export function ProductIdGrid({ ids }: { ids: string[] }) {
  const { products } = useProductCards(ids);
  if (products === null) {
    return (
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-4" aria-label="Loading">
        {ids.slice(0, 4).map((id) => <li key={id} className="aspect-[4/5] animate-pulse rounded-lg bg-surface" />)}
      </ul>
    );
  }
  return <ProductGrid products={products} />;
}
