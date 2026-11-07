"use client";

import { ChevronsLeft, ChevronsRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const EVENT = "admin-sb-change";
const isCollapsed = () => typeof document !== "undefined" && document.documentElement.dataset.adminSb === "collapsed";

/** Collapsed / expanded admin sidebar, shared by every toggle button and saved in this browser. */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    setCollapsed(isCollapsed());
    const on = () => setCollapsed(isCollapsed());
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  const set = (next: boolean) => {
    if (next) document.documentElement.dataset.adminSb = "collapsed";
    else delete document.documentElement.dataset.adminSb;
    try {
      localStorage.setItem("admin-sidebar", next ? "collapsed" : "open");
    } catch {}
    window.dispatchEvent(new Event(EVENT));
  };
  return { collapsed, toggle: () => set(!isCollapsed()) };
}

/**
 * Collapse / expand button. "top" sits next to the logo (a chevron, always
 * visible on desktop); "bottom" is the labelled row at the foot of the sidebar.
 */
export function SidebarToggle({ place }: { place: "top" | "bottom" }) {
  const { collapsed, toggle } = useSidebarCollapsed();
  const label = collapsed ? "Expand sidebar" : "Collapse sidebar";
  if (place === "top") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-pressed={collapsed}
        title={label}
        className="hidden size-9 shrink-0 items-center justify-center rounded-md border border-line bg-paper text-muted transition-colors hover:bg-surface-strong hover:text-ink lg:inline-flex"
      >
        {collapsed ? <ChevronsRight className="size-4" aria-hidden /> : <ChevronsLeft className="size-4" aria-hidden />}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={collapsed}
      title={label}
      className={cn("inline-flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-muted hover:bg-surface-strong hover:text-ink")}
    >
      {collapsed ? <PanelLeftOpen className="size-4 shrink-0" aria-hidden /> : <PanelLeftClose className="size-4 shrink-0" aria-hidden />}
      <span className="admin-sb-hide">{collapsed ? "Expand" : "Collapse"}</span>
      {collapsed && <span className="sr-only">{label}</span>}
    </button>
  );
}
