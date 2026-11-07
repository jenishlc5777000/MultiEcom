"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const SCROLL_KEY = "cg-preview-scroll";

/**
 * Shown only in owner preview mode. Inside the dashboard's preview pane it
 * keeps the scroll position across live reloads; in a normal tab it shows a
 * badge with a way out, so the owner never mistakes the draft for the live site.
 */
export function PreviewIndicator() {
  const pathname = usePathname();
  const [framed, setFramed] = useState(true);

  useEffect(() => {
    setFramed(window.self !== window.top);
    // Restore the scroll position after a live reload of the same page.
    try {
      const saved = JSON.parse(sessionStorage.getItem(SCROLL_KEY) ?? "null") as { path: string; y: number } | null;
      if (saved && saved.path === location.pathname) requestAnimationFrame(() => window.scrollTo(0, saved.y));
    } catch {}
    const save = () => {
      try {
        sessionStorage.setItem(SCROLL_KEY, JSON.stringify({ path: location.pathname, y: window.scrollY }));
      } catch {}
    };
    window.addEventListener("pagehide", save);
    return () => window.removeEventListener("pagehide", save);
  }, []);

  if (framed) return null;
  return (
    <div className="fixed bottom-24 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-full bg-black px-4 py-2 text-sm text-white shadow-float md:bottom-6">
      <span className="size-2 animate-pulse rounded-full bg-amber-400" aria-hidden />
      Previewing unsaved design changes
      <a href={`/api/preview?mode=off&to=${encodeURIComponent(pathname)}`} className="font-semibold underline underline-offset-4">Exit preview</a>
    </div>
  );
}
