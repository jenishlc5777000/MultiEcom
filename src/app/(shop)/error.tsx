"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ShopError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container flex min-h-[50dvh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-3xl">Something went wrong</h1>
      <p className="text-ink/80">Please try again in a moment.</p>
      <Button onClick={reset} size="lg">Try again</Button>
    </div>
  );
}
