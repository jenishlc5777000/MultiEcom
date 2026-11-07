"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProductAction } from "@/actions/admin/catalog.actions";
import { Button } from "@/components/ui/button";

/** Delete, or archive if the product appears in past orders (the server decides). */
export function ProductDangerZone({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-danger/25 p-5">
      <h2 className="font-sans text-[15px] font-semibold">Remove product</h2>
      <p className="mt-1 text-sm text-muted">Products that appear in past orders are archived instead of deleted, so order history stays intact.</p>
      {!confirming ? (
        <Button variant="secondary" size="sm" className="mt-4 border-danger/40 text-danger hover:border-danger hover:bg-danger hover:text-on-accent" onClick={() => setConfirming(true)}>
          Delete product
        </Button>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm">Remove “{name}”?</span>
          <Button
            size="sm"
            className="bg-danger hover:bg-danger/90"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await deleteProductAction(id);
                if (!res.ok) return setMsg(res.error);
                router.push(`/admin/products?removed=${res.data}`);
              })
            }
          >
            {pending ? "Removing…" : "Yes, remove"}
          </Button>
          <Button size="sm" variant="quiet" onClick={() => setConfirming(false)}>Keep it</Button>
        </div>
      )}
      {msg && <p role="alert" className="mt-2 text-sm text-danger">{msg}</p>}
    </div>
  );
}
