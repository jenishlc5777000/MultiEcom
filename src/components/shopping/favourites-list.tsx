"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useFavourites } from "@/lib/client-lists";
import { ProductIdGrid } from "./product-id-list";

export function FavouritesList() {
  const { list, clear } = useFavourites();
  if (!list.length) {
    return (
      <div className="fx-panel flex flex-col items-center gap-4 rounded-lg border border-line bg-paper/60 p-10 text-center">
        <Heart className="size-8 text-accent" aria-hidden />
        <p className="text-lg">No favourites yet.</p>
        <p className="max-w-sm text-muted">Tap the heart on any piece to keep it here. Favourites are saved on this device.</p>
        <Button asChild><Link href="/category">Browse the shop</Link></Button>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted">{list.length} saved piece{list.length === 1 ? "" : "s"} · saved on this device</p>
        <button type="button" onClick={() => confirm("Remove all favourites?") && clear()} className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline">Clear all</button>
      </div>
      <ProductIdGrid ids={list} />
    </div>
  );
}
