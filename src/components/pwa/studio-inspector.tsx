"use client";

import { Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { sectionTargets, STUDIO_MESSAGE, STUDIO_MODE_MESSAGE, STUDIO_TARGETS, STUDIO_TEXT_MESSAGE, type StudioTarget } from "@/lib/studio-targets";

type Hover = { key: string; rect: DOMRect; name: string; targets: StudioTarget[] };

/** What a data-studio element is and which Studio panels can edit it. */
function describe(el: HTMLElement): { key: string; name: string; targets: StudioTarget[] } | null {
  const key = el.dataset.studio;
  if (!key) return null;
  if (key === "section" && el.dataset.studioId) return { key: `section:${el.dataset.studioId}`, name: el.dataset.studioName || "Section", targets: sectionTargets(el.dataset.studioId) };
  const info = STUDIO_TARGETS[key];
  return info ? { key, name: info.name, targets: info.targets } : null;
}

/**
 * Click-to-edit inside the Studio preview iframe (owner preview mode only).
 * Hovering an element with data-studio outlines it; clicking it (or one of the
 * label buttons) tells the Studio which panel to open. Links don't navigate
 * while edit mode is on; the Studio toolbar can switch it off to browse.
 */
export function StudioInspector() {
  const [hover, setHover] = useState<Hover | null>(null);
  const [enabled, setEnabled] = useState(true);
  const framed = useRef(false);

  useEffect(() => {
    framed.current = window.self !== window.top;
    if (!framed.current) return;
    const send = (key: string, target?: StudioTarget) => window.parent.postMessage({ type: STUDIO_MESSAGE, key, target }, window.location.origin);
    const findEl = (t: EventTarget | null) => (t instanceof Element ? (t.closest("[data-studio]") as HTMLElement | null) : null);

    const onMove = (e: MouseEvent) => {
      if (!enabled) return;
      if ((e.target as Element | null)?.closest?.("[data-studio-ui]")) return;
      if ((e.target as Element | null)?.closest?.("[contenteditable=true],[contenteditable=plaintext-only]")) return;
      const el = findEl(e.target);
      const d = el ? describe(el) : null;
      setHover(el && d ? { ...d, rect: el.getBoundingClientRect() } : null);
    };
    const onClick = (e: MouseEvent) => {
      if (!enabled) return;
      if ((e.target as Element | null)?.closest?.("[data-studio-ui]")) return;
      const editing = (e.target as Element | null)?.closest?.("[contenteditable=true],[contenteditable=plaintext-only]");
      if (editing) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const el = findEl(e.target);
      const d = el ? describe(el) : null;
      if (!d) return;
      e.preventDefault();
      e.stopPropagation();
      // A double-click on text is for inline editing: don't also jump panels.
      if (e.detail > 1) return;
      send(d.key, d.targets[0]);
    };

    /* Double-click a marked text line to edit it right here. */
    const onDblClick = (e: MouseEvent) => {
      if (!enabled) return;
      const el = (e.target as Element | null)?.closest?.("[data-edit]") as HTMLElement | null;
      if (!el || el.isContentEditable) return;
      e.preventDefault();
      e.stopPropagation();
      const original = el.innerHTML;
      // Show the raw text (with *emphasis* and / line breaks) while editing.
      el.textContent = el.dataset.editRaw ?? el.innerText;
      try { el.contentEditable = "plaintext-only"; } catch { el.contentEditable = "true"; }
      if (el.contentEditable !== "plaintext-only") el.contentEditable = "true";
      el.style.outline = "2px solid #3B82F6";
      el.style.outlineOffset = "4px";
      el.style.cursor = "text";
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      setHover(null);

      let done = false;
      const finish = (save: boolean) => {
        if (done) return;
        done = true;
        el.removeAttribute("contenteditable");
        el.style.outline = "";
        el.style.cursor = "";
        el.removeEventListener("keydown", onKey);
        el.removeEventListener("blur", onBlur);
        const value = el.innerText.replace(/\u00a0/g, " ").trim();
        if (save && value !== (el.dataset.editRaw ?? "")) {
          el.textContent = value;
          window.parent.postMessage({ type: STUDIO_TEXT_MESSAGE, path: el.dataset.edit, value }, window.location.origin);
        } else {
          el.innerHTML = original;
        }
      };
      const onKey = (k: KeyboardEvent) => {
        if (k.key === "Escape") { k.preventDefault(); finish(false); }
        // Enter saves; Shift+Enter adds a line break (for longer text).
        if (k.key === "Enter" && !k.shiftKey) { k.preventDefault(); finish(true); }
      };
      const onBlur = () => finish(true);
      el.addEventListener("keydown", onKey);
      el.addEventListener("blur", onBlur);
    };
    const onScroll = () => setHover(null);
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const data = e.data as { type?: string; on?: boolean };
      if (data?.type === STUDIO_MODE_MESSAGE) {
        setEnabled(Boolean(data.on));
        setHover(null);
      }
    };
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("dblclick", onDblClick, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("message", onMessage);
    // Ask the Studio whether edit mode is on.
    window.parent.postMessage({ type: `${STUDIO_MODE_MESSAGE}-ready` }, window.location.origin);
    return () => {
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("dblclick", onDblClick, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("message", onMessage);
    };
  }, [enabled]);

  if (!hover || !enabled) return null;
  const { rect } = hover;
  const top = Math.max(0, rect.top);
  return (
    <>
      <div aria-hidden className="pointer-events-none fixed z-[9998] rounded-[4px] outline outline-2 outline-offset-[-2px] outline-[#3B82F6] transition-all duration-100" style={{ top, left: rect.left, width: rect.width, height: Math.min(rect.height, window.innerHeight - top) }} />
      <div
        data-studio-ui
        className="fixed z-[9999] flex items-center gap-1 rounded-md bg-[#3B82F6] p-1 text-[12px] font-medium text-white shadow-lg"
        style={{ top: Math.max(4, top - 2), left: Math.max(4, rect.left + 4) }}
      >
        <span className="flex items-center gap-1 px-1.5"><Pencil className="size-3" aria-hidden /> {hover.name}</span>
        {hover.targets.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => window.parent.postMessage({ type: STUDIO_MESSAGE, key: hover.key, target: t }, window.location.origin)}
            className="rounded bg-white/15 px-2 py-0.5 hover:bg-white/30"
          >
            {t.label}
          </button>
        ))}
        <span className="px-1.5 text-white/75">· double-click text to edit</span>
      </div>
    </>
  );
}
