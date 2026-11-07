"use client";

import { Check, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { resetSiteSectionAction, saveSiteSectionAction } from "@/actions/admin/site.actions";
import { Button } from "@/components/ui/button";
import { defaultSiteConfig, type SiteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { FormMessage } from "../form";
import { APPLIED_EVENT, PUBLISHED_EVENT, usePreviewDraft } from "./preview";

/** Local state + save/reset for one Appearance section. */
export function useSection<K extends keyof SiteConfig>(name: K, initial: SiteConfig[K]) {
  const router = useRouter();
  const [v, setV] = useState<SiteConfig[K]>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  // Live preview: unsaved changes are shown in the preview pane (owner only).
  usePreviewDraft(name, v);

  // Text edited directly in the preview updates this editor too.
  useEffect(() => {
    const onApplied = (e: Event) => {
      const d = (e as CustomEvent<{ section: string; value: unknown }>).detail;
      if (d?.section === name) {
        setV(d.value as SiteConfig[K]);
        setDirty(true);
      }
    };
    const onPublished = () => setDirty(false);
    window.addEventListener(APPLIED_EVENT, onApplied);
    window.addEventListener(PUBLISHED_EVENT, onPublished);
    return () => {
      window.removeEventListener(APPLIED_EVENT, onApplied);
      window.removeEventListener(PUBLISHED_EVENT, onPublished);
    };
  }, [name]);

  const set = <F extends keyof SiteConfig[K]>(key: F, value: SiteConfig[K][F]) => {
    setDirty(true);
    setV((s) => ({ ...s, [key]: value }));
  };
  const update = (fn: (s: SiteConfig[K]) => SiteConfig[K]) => {
    setDirty(true);
    setV(fn);
  };
  const save = () =>
    start(async () => {
      const r = await saveSiteSectionAction(name, v);
      setMsg(r.ok ? { ok: true, message: "Saved. The store now uses these settings." } : { ok: false, message: r.error });
      if (r.ok) {
        setDirty(false);
        router.refresh();
      }
    });
  const reset = () => {
    if (!confirm("Reset this section to the default settings?")) return;
    start(async () => {
      const r = await resetSiteSectionAction(name);
      if (r.ok) {
        setV(defaultSiteConfig[name]);
        setDirty(false);
        setMsg({ ok: true, message: "Back to the defaults." });
        router.refresh();
      } else setMsg({ ok: false, message: r.error });
    });
  };
  return { v, set, update, save, reset, pending, msg, dirty };
}

export function SaveBar({ save, reset, pending, msg, dirty, label = "Save changes" }: { save: () => void; reset: () => void; pending: boolean; msg: { ok: boolean; message: string } | null; dirty: boolean; label?: string }) {
  return (
    <div className="sticky bottom-3 z-20 mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-canvas/95 p-3 shadow-float backdrop-blur">
      <Button type="button" onClick={save} disabled={pending}>{pending ? "Saving…" : label}</Button>
      <Button type="button" variant="quiet" size="sm" onClick={reset} disabled={pending}><RotateCcw /> Reset to defaults</Button>
      {dirty && !pending && <span className="text-sm text-mto">Unsaved changes</span>}
      <FormMessage result={msg} />
    </div>
  );
}

export function Panel({ id, title, description, children, className }: { id?: string; title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    // `id` lets click-to-edit in the Studio preview jump straight to this panel.
    <section id={id} className={cn("studio-panel scroll-mt-6 rounded-lg border border-line bg-paper/60 p-5 md:p-6", className)}>
      <h2 className="font-sans text-[15px] font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export type ChoiceOption<T extends string> = { value: T; label: string; hint?: string; preview?: React.ReactNode };

/** A row of selectable cards (radio group). */
export function Choice<T extends string>({ label, value, options, onChange, columns = 3 }: { label: string; value: T; options: ChoiceOption<NoInfer<T>>[]; onChange: (v: T) => void; columns?: 2 | 3 | 4 | 5 | 6 }) {
  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4", 5: "sm:grid-cols-3 lg:grid-cols-5", 6: "sm:grid-cols-3 lg:grid-cols-6" }[columns];
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div role="radiogroup" aria-label={label} className={cn("grid grid-cols-2 gap-2", cols)}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.value)}
              className={cn("relative rounded-md border p-3 text-left text-sm transition-colors", on ? "border-ink bg-paper ring-1 ring-ink" : "border-line hover:border-muted")}
            >
              {o.preview && <div className="mb-2">{o.preview}</div>}
              <span className="flex items-center justify-between gap-2 font-medium">
                {o.label}
                {on && <Check className="size-4 shrink-0" aria-hidden />}
              </span>
              {o.hint && <span className="mt-0.5 block text-xs text-muted">{o.hint}</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ColorField({ label, value, onChange, allowEmpty = false, placeholder = "#A24A25" }: { label: string; value: string; onChange: (v: string) => void; allowEmpty?: boolean; placeholder?: string }) {
  const valid = /^#[0-9a-fA-F]{6}$/.test(value);
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={valid ? value : placeholder}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-11 w-12 shrink-0 cursor-pointer rounded-md border border-line bg-paper p-1"
        />
        <input
          value={value}
          placeholder={allowEmpty ? "Theme colour" : placeholder}
          onChange={(e) => onChange(e.target.value.trim())}
          className={cn("min-h-11 w-full rounded-md border bg-paper/80 px-3 font-mono text-sm uppercase", value && !valid ? "border-danger" : "border-line")}
          maxLength={7}
        />
        {allowEmpty && value && (
          <button type="button" className="shrink-0 text-xs text-muted underline" onClick={() => onChange("")}>Clear</button>
        )}
      </span>
    </label>
  );
}

export function RangeField({ label, value, min, max, step = 1, unit = "px", onChange, hint, format }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void; hint?: string; format?: (v: number) => string }) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted">{format ? format(value) : `${value}${unit}`}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[rgb(var(--ink))]" />
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}

/** Compact on/off switch with a label, for lists of options. */
export function SwitchRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-md border border-line bg-paper/50 px-4 py-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn("relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors", checked ? "bg-ink" : "bg-line")}
      >
        <span className={cn("inline-block size-5 rounded-full bg-white shadow transition-transform duration-300", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
      </button>
    </label>
  );
}

/** "theme" + named options, for overrides of the active theme. */
export const withTheme = <const T extends string>(themeLabel: string, opts: ChoiceOption<T>[]): ChoiceOption<T | "theme">[] => [
  { value: "theme", label: "Theme default", hint: themeLabel },
  ...opts,
];
