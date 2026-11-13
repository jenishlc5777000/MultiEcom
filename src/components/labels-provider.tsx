"use client";

import { createContext, useContext, useMemo } from "react";
import { makeT, type Labels } from "@/lib/labels";

const Ctx = createContext<Labels>({});

/** Studio → Text & labels, available to every client component on the storefront. */
export function LabelsProvider({ labels, children }: { labels: Labels; children: React.ReactNode }) {
  return <Ctx.Provider value={labels}>{children}</Ctx.Provider>;
}

/** Client components: `const t = useT(); t("product.addToCart")`. */
export function useT() {
  const labels = useContext(Ctx);
  return useMemo(() => makeT(labels), [labels]);
}
