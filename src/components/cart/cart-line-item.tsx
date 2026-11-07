"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { updateCartItemAction } from "@/actions/cart.actions";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";
import type { CartLineDTO } from "@/types/dto";

export function CartLineItem({ line }: { line: CartLineDTO }) {
  const [pending, startTransition] = useTransition();
  const setQty = (qty: number) =>
    startTransition(async () => {
      await updateCartItemAction({ productId: line.productId, variantId: line.variantId, qty });
    });

  return (
    <li className="flex gap-4 rounded-lg bg-surface p-3" aria-busy={pending}>
      <Link href={`/products/${line.slug}`} className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-surface-strong">
        {line.image && <Image src={line.image.url} alt={line.image.alt} fill sizes="96px" className="object-cover" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link href={`/products/${line.slug}`} className="font-medium text-ink hover:underline">
          {line.name}
        </Link>
        {line.variantLabel && <p className="text-sm text-ink/80">{line.variantLabel}</p>}
        {line.problem === "unavailable" && <p className="text-sm text-danger">No longer available. Please remove it.</p>}
        {line.problem === "insufficient_stock" && (
          <p className="text-sm text-danger">Only {line.maxQty} left. Please lower the quantity.</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center rounded-lg border border-line bg-canvas">
            <Button variant="ghost" size="icon" aria-label="Decrease quantity" disabled={pending || line.qty <= 1} onClick={() => setQty(line.qty - 1)}>
              <Minus />
            </Button>
            <span className="w-8 text-center tabular-nums" aria-label="Quantity">{line.qty}</span>
            <Button variant="ghost" size="icon" aria-label="Increase quantity" disabled={pending || line.qty >= line.maxQty} onClick={() => setQty(line.qty + 1)}>
              <Plus />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold text-ink">{formatINR(line.lineTotal)}</span>
            <Button variant="ghost" size="icon" aria-label={`Remove ${line.name}`} disabled={pending} onClick={() => setQty(0)}>
              <Trash2 />
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}
