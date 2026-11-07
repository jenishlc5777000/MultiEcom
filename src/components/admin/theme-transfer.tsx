"use client";

import { Download, Palette, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { importThemeAction } from "@/actions/admin/site.actions";
import { Button } from "@/components/ui/button";
import { IMPORT_PARTS, importPartLabels, THEME_FILE_FORMAT, THEME_PARTS, type ImportPart } from "@/lib/theme-file";
import { FormMessage } from "./form";

type Loaded = { name: string; text: string; theme?: string; exportedAt?: string; scope: "theme" | "all"; parts: ImportPart[] };

/** Studio → Theme: theme export, full export, and import with a choice of parts. */
export function ThemeTransfer() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<Loaded | null>(null);
  const [parts, setParts] = useState<ImportPart[]>([]);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);

  const reset = () => {
    setFile(null);
    setParts([]);
    if (input.current) input.current.value = "";
  };

  const pick = async (f: File | undefined) => {
    setMsg(null);
    if (!f) return;
    if (f.size > 2_000_000) return setMsg({ ok: false, message: "That file is too big to be an export file." });
    const text = await f.text();
    try {
      const j = JSON.parse(text) as { format?: string; theme?: string; exportedAt?: string; scope?: string; site?: Record<string, unknown>; store?: unknown };
      if (j.format !== THEME_FILE_FORMAT || !j.site) throw new Error();
      const available = IMPORT_PARTS.filter((p) => (p === "theme" ? true : p === "store" ? Boolean(j.store) : p in j.site!));
      const scope = j.scope === "theme" ? "theme" : "all";
      setFile({ name: f.name, text, theme: j.theme, exportedAt: j.exportedAt, scope, parts: available });
      // Default: everything in a theme file; the look only from a full export (safer).
      setParts(scope === "theme" ? available : available.filter((p) => THEME_PARTS.includes(p)));
    } catch {
      reset();
      setMsg({ ok: false, message: "That isn't an export file from this store." });
    }
  };

  const apply = () => {
    if (!file || !parts.length) return;
    if (!confirm(`Import ${parts.length} part${parts.length === 1 ? "" : "s"} from this file? Your current settings for those parts will be replaced. Tip: make a full export first as a backup.`)) return;
    start(async () => {
      const r = await importThemeAction(file.text, parts);
      setMsg(r.ok ? { ok: true, message: r.data } : { ok: false, message: r.error });
      if (r.ok) {
        reset();
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">Download your design as a file, as a backup or to copy it to another store. Credentials, products, orders and customers are never included.</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-line bg-paper/60 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold"><Palette className="size-4" aria-hidden /> Theme export</p>
          <p className="mt-1 text-xs text-muted">The look only: theme, colours, fonts, effects, product card styles, header, logo, footer and page layouts.</p>
          <Button asChild variant="secondary" size="sm" className="mt-3">
            <a href="/api/admin/theme-export?scope=theme" download><Download /> Export theme</a>
          </Button>
        </div>
        <div className="rounded-md border border-line bg-paper/60 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold"><Download className="size-4" aria-hidden /> Full export</p>
          <p className="mt-1 text-xs text-muted">Everything: the look plus home-page sections, all text, search, contact form, shopping, visibility, every theme&apos;s customisations and store settings.</p>
          <Button asChild variant="secondary" size="sm" className="mt-3">
            <a href="/api/admin/theme-export?scope=all" download><Download /> Export everything</a>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" size="sm" onClick={() => input.current?.click()}><Upload /> Import a file…</Button>
        <span className="text-xs text-muted">Works with theme exports and full exports.</span>
        <input ref={input} type="file" accept="application/json,.json" className="sr-only" aria-label="Export file" onChange={(e) => pick(e.target.files?.[0])} />
      </div>

      {file && (
        <div className="space-y-3 rounded-md border border-line p-4">
          <p className="text-sm">
            <span className="font-medium">{file.name}</span>
            <span className="text-muted">
              {" "}· {file.scope === "theme" ? "theme export" : "full export"} · theme “{file.theme}”
              {file.exportedAt ? ` · ${new Date(file.exportedAt).toLocaleDateString("en-IN")}` : ""}
            </span>
          </p>
          <fieldset>
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <legend className="text-sm font-medium">What to import</legend>
              <button type="button" className="text-xs underline" onClick={() => setParts(file.parts)}>Everything in file</button>
              <button type="button" className="text-xs underline" onClick={() => setParts(file.parts.filter((p) => THEME_PARTS.includes(p)))}>Look only</button>
              <button type="button" className="text-xs underline" onClick={() => setParts([])}>None</button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {file.parts.map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={parts.includes(p)} onChange={(e) => setParts((s) => (e.target.checked ? [...s, p] : s.filter((x) => x !== p)))} />
                  {importPartLabels[p]}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={apply} disabled={pending || parts.length === 0}>{pending ? "Importing…" : `Import ${parts.length} part${parts.length === 1 ? "" : "s"}`}</Button>
            <Button type="button" size="sm" variant="quiet" onClick={reset}>Cancel</Button>
          </div>
        </div>
      )}
      <FormMessage result={msg} />
    </div>
  );
}
