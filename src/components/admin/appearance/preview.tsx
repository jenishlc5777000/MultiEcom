"use client";

import { ExternalLink, Eye, EyeOff, Laptop, Loader2, Monitor, MousePointerClick, RefreshCw, Smartphone, Tablet } from "lucide-react";
import { useRouter } from "next/navigation";
import { STUDIO_MESSAGE, STUDIO_MODE_MESSAGE, STUDIO_TARGETS, STUDIO_TEXT_MESSAGE, type StudioTarget } from "@/lib/studio-targets";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { applyTextEditAction, clearSiteDraftAction, publishDraftAction, saveSiteDraftAction } from "@/actions/admin/site.actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Live preview for the dashboard. Editors call usePreviewDraft(); while the
 * pane is open, changes are written (debounced) as an owner-only draft and the
 * iframe reloads to show the real store with them. Saving publishes; visitors
 * never see drafts.
 */

const REFRESH = "cg-preview-refresh";
const STATUS = "cg-preview-status";
type Status = "idle" | "saving" | "ready" | "error";

const PreviewCtx = createContext<{ open: boolean; openPreview: (keepDraft?: boolean) => void }>({ open: false, openPreview: () => {} });
export const usePreviewOpen = () => useContext(PreviewCtx).open;
/** Open the preview pane from an editor (keepDraft: show a draft that was just written). */
export const useOpenPreview = () => useContext(PreviewCtx).openPreview;
/** Ask an open preview pane to reload. */
export const refreshPreview = () => window.dispatchEvent(new Event(REFRESH));

/** Events editors listen to: an inline edit was applied / everything was published. */
export const APPLIED_EVENT = "cg-studio-applied";
export const PUBLISHED_EVENT = "cg-studio-published";
export const FOCUS_EVENT = "cg-studio-focus";

const emitStatus = (status: Status, message?: string) => window.dispatchEvent(new CustomEvent(STATUS, { detail: { status, message } }));

/** Write `value` as the draft for `name` whenever it changes (only while the preview is open). */
export function usePreviewDraft(name: string, value: unknown) {
  const open = usePreviewOpen();
  const first = useRef(true);
  const json = JSON.stringify(value);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!open) return;
    emitStatus("saving");
    const t = setTimeout(async () => {
      const r = await saveSiteDraftAction(name, JSON.parse(json));
      if (r.ok) window.dispatchEvent(new Event(REFRESH));
      else emitStatus("error", r.error);
    }, 500);
    return () => clearTimeout(t);
  }, [json, name, open]);
}

const DEVICES = {
  desktop: { width: 1280, icon: Monitor, label: "Desktop" },
  laptop: { width: 1024, icon: Laptop, label: "Laptop" },
  tablet: { width: 820, icon: Tablet, label: "Tablet" },
  mobile: { width: 390, icon: Smartphone, label: "Phone" },
} as const;
type Device = keyof typeof DEVICES;

export type PreviewPage = { label: string; path: string };

/** Wraps an editor: a toggle bar on top, and the preview pane beside it when open. */
export function PreviewLayout({ pages, children, basePath = "/admin/studio" }: { pages: PreviewPage[]; children: React.ReactNode; basePath?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [keepDraft, setKeepDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const openPreview = useCallback((keep = false) => {
    setKeepDraft(keep);
    setOpen(true);
    try { localStorage.setItem("cg-preview-open", "1"); } catch {}
  }, []);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);

  const publishAll = async () => {
    if (!confirm("Publish all changes shown in the preview? Visitors will see them straight away.")) return;
    setPublishing(true);
    const r = await publishDraftAction();
    setPublishing(false);
    setPublishMsg(r.ok ? (r.data ? "Published. Your store is up to date." : "Nothing new to publish.") : r.error);
    if (r.ok) {
      window.dispatchEvent(new Event(PUBLISHED_EVENT));
      router.refresh();
    }
  };

  // Click-to-edit and inline text edits from the preview iframe.
  useEffect(() => {
    const onMessage = async (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const data = e.data as { type?: string; key?: string; target?: StudioTarget; path?: string; value?: string };
      if (data?.type === STUDIO_TEXT_MESSAGE && data.path && typeof data.value === "string") {
        emitStatus("saving");
        const r = await applyTextEditAction(data.path, data.value);
        if (r.ok) {
          window.dispatchEvent(new CustomEvent(APPLIED_EVENT, { detail: r.data }));
          window.dispatchEvent(new Event(REFRESH));
        } else emitStatus("error", r.error);
        return;
      }
      if (data?.type !== STUDIO_MESSAGE || !data.key) return;
      const target = data.target ?? STUDIO_TARGETS[data.key]?.targets[0];
      if (!target) return;
      const url = new URL(window.location.href);
      if (url.searchParams.get("tab") !== target.tab) router.push(`${basePath}?tab=${target.tab}`, { scroll: false });
      focusPanel(target.panel);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [router, basePath]);
  useEffect(() => {
    try {
      setOpen(localStorage.getItem("cg-preview-open") === "1");
    } catch {}
  }, []);
  const toggle = () =>
    setOpen((o) => {
      try {
        localStorage.setItem("cg-preview-open", o ? "0" : "1");
      } catch {}
      return !o;
    });

  return (
    <PreviewCtx.Provider value={{ open, openPreview }}>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        {publishMsg && <span className="text-sm text-muted" role="status">{publishMsg}</span>}
        {open && (
          <Button type="button" size="sm" variant="accent" onClick={publishAll} disabled={publishing} title="Make every change you see in the preview live">
            {publishing ? "Publishing…" : "Publish all changes"}
          </Button>
        )}
        <Button type="button" size="sm" variant={open ? "secondary" : "primary"} onClick={toggle}>
          {open ? <><EyeOff /> Hide preview</> : <><Eye /> Live preview</>}
        </Button>
      </div>
      <div className={cn(open && "grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]")}>
        <div className="min-w-0">{children}</div>
        {open && <PreviewPane pages={pages} keepDraft={keepDraft} />}
      </div>
    </PreviewCtx.Provider>
  );
}

/** Scroll to a Studio panel (waiting for its tab to render) and flash it. */
function focusPanel(id: string) {
  // Editors that open items (e.g. a section in the builder) listen for this.
  try { sessionStorage.setItem(FOCUS_EVENT, id); } catch {}
  window.dispatchEvent(new CustomEvent(FOCUS_EVENT, { detail: id }));
  const started = Date.now();
  const tick = () => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.classList.remove("studio-flash");
      void el.offsetWidth;
      el.classList.add("studio-flash");
      return;
    }
    if (Date.now() - started < 4000) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function PreviewPane({ pages, keepDraft = false }: { pages: PreviewPage[]; keepDraft?: boolean }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [device, setDevice] = useState<Device>("desktop");
  const [path, setPath] = useState(pages[0]?.path ?? "/");
  const [status, setStatus] = useState<{ status: Status; message?: string }>({ status: "idle" });
  const [size, setSize] = useState({ w: 600, h: 700 });
  const [editMode, setEditMode] = useState(true);

  // Tell the preview whether clicks should open the editor or navigate.
  const sendMode = useCallback((on: boolean) => {
    frame.current?.contentWindow?.postMessage({ type: STUDIO_MODE_MESSAGE, on }, window.location.origin);
  }, []);
  useEffect(() => sendMode(editMode), [editMode, sendMode]);
  useEffect(() => {
    const onReady = (e: MessageEvent) => {
      if (e.origin === window.location.origin && (e.data as { type?: string })?.type === `${STUDIO_MODE_MESSAGE}-ready`) sendMode(editMode);
    };
    window.addEventListener("message", onReady);
    return () => window.removeEventListener("message", onReady);
  }, [editMode, sendMode]);

  // Start from the saved settings: drop any draft left over from an earlier session
  // (unless an editor just wrote one on purpose, e.g. "Try template in preview").
  useEffect(() => {
    if (keepDraft) setReady(true);
    else clearSiteDraftAction().finally(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on first open
  }, []);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => e && setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const reload = useCallback(() => {
    try {
      frame.current?.contentWindow?.location.reload();
    } catch {
      if (frame.current) frame.current.src = frame.current.src;
    }
  }, []);

  useEffect(() => {
    const onRefresh = () => {
      setStatus({ status: "saving" });
      reload();
    };
    const onStatus = (e: Event) => setStatus((e as CustomEvent<{ status: Status; message?: string }>).detail);
    window.addEventListener(REFRESH, onRefresh);
    window.addEventListener(STATUS, onStatus);
    return () => {
      window.removeEventListener(REFRESH, onRefresh);
      window.removeEventListener(STATUS, onStatus);
    };
  }, [reload]);

  const width = DEVICES[device].width;
  const scale = Math.min(1, size.w / width);
  const src = `/api/preview?mode=on&to=${encodeURIComponent(path)}`;

  return (
    <aside className="flex h-[75dvh] min-w-0 flex-col overflow-hidden rounded-lg border border-line bg-surface xl:sticky xl:top-4 xl:h-[calc(100dvh-2rem)]" aria-label="Live preview">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-paper px-3 py-2">
        <div className="flex rounded-pill border border-line p-0.5" role="radiogroup" aria-label="Screen size">
          {(Object.keys(DEVICES) as Device[]).map((d) => {
            const D = DEVICES[d];
            return (
              <button key={d} type="button" role="radio" aria-checked={device === d} aria-label={D.label} title={`${D.label} (${D.width}px)`} onClick={() => setDevice(d)} className={cn("inline-flex size-8 items-center justify-center rounded-pill transition-colors", device === d ? "bg-ink text-canvas" : "text-muted hover:text-ink")}>
                <D.icon className="size-4" />
              </button>
            );
          })}
        </div>
        <select aria-label="Page to preview" value={path} onChange={(e) => setPath(e.target.value)} className="min-h-9 max-w-[45%] rounded-md border border-line bg-paper px-2 text-sm">
          {pages.map((p) => <option key={p.path} value={p.path}>{p.label}</option>)}
        </select>
        <button
          type="button"
          aria-pressed={editMode}
          onClick={() => setEditMode((m) => !m)}
          title="Click any part of the preview to edit it"
          className={cn("inline-flex h-8 items-center gap-1.5 rounded-pill px-3 text-xs font-medium transition-colors", editMode ? "bg-[#3B82F6] text-white" : "border border-line text-muted hover:text-ink")}
        >
          <MousePointerClick className="size-3.5" /> Click to edit
        </button>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-muted" aria-live="polite">
          {status.status === "saving" && <><Loader2 className="size-3.5 animate-spin" /> Updating…</>}
          {status.status === "ready" && "Showing your unsaved changes"}
          {status.status === "error" && <span className="text-danger">{status.message}</span>}
        </span>
        <button type="button" onClick={reload} aria-label="Reload preview" className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-ink"><RefreshCw className="size-4" /></button>
        <a href={src} target="_blank" rel="noreferrer" aria-label="Open preview in a new tab" className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-ink"><ExternalLink className="size-4" /></a>
      </div>

      <div ref={box} className="relative min-h-0 flex-1 overflow-hidden">
        {ready ? (
          <iframe
            key={`${path}`}
            ref={frame}
            src={src}
            title="Store preview"
            onLoad={() => setStatus((s) => (s.status === "error" ? s : { status: "ready" }))}
            className="absolute left-1/2 top-0 origin-top border-0 bg-canvas shadow-sm"
            style={{ width, height: size.h / scale, transform: `translateX(-50%) scale(${scale})` }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted"><Loader2 className="mr-2 size-4 animate-spin" /> Loading preview…</div>
        )}
      </div>
      <p className="border-t border-line bg-paper px-3 py-1.5 text-[11px] text-muted">
        {editMode ? "Click any part of the page to jump to its settings. " : ""}Only you see this preview; visitors see the last saved version.
      </p>
    </aside>
  );
}
