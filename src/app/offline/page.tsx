import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata = { title: "Offline" };
export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="container flex min-h-dvh flex-col items-center justify-center gap-4 text-center">
      <WifiOff className="size-12 text-ink" aria-hidden />
      <h1 className="text-3xl">You&apos;re offline</h1>
      <p className="max-w-sm text-ink/80">Pages you&apos;ve visited are still available. Reconnect to browse new pieces or check out.</p>
      <Link href="/" className="font-semibold text-accent underline underline-offset-4">
        Try again
      </Link>
    </main>
  );
}
