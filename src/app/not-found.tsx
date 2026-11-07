import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="container flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl">Page not found</h1>
      <p className="text-ink/80">This piece may have found a new home.</p>
      <Button asChild size="lg">
        <Link href="/">Back to the shop</Link>
      </Button>
    </main>
  );
}
