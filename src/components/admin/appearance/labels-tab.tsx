"use client";

import { RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { LABEL_GROUPS, LABEL_KEYS, LABELS, type LabelGroup, type LabelKey, type Labels } from "@/lib/labels";
import { TextInput } from "../form";
import { Panel, SaveBar, useSection } from "./shared";

/** "home.restTitle" → "Rest title" (fallback name when a label has no hint). */
const nameOf = (k: string) => {
  const last = k.split(".")[1] ?? k;
  const words = last.replace(/([A-Z])/g, " $1").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/**
 * Studio → Text & labels: every button, menu item and small heading on the
 * storefront. Empty = the default (shown greyed in the box).
 */
export function LabelsTab({ initial }: { initial: Labels }) {
  const s = useSection("labels", initial);
  const v = s.v as Partial<Record<LabelKey, string>>;
  const [q, setQ] = useState("");
  const [onlyChanged, setOnlyChanged] = useState(false);
  const set = (k: LabelKey, text: string) => s.update((cur) => ({ ...(cur as object), [k]: text }) as typeof cur);
  const changed = LABEL_KEYS.filter((k) => v[k]?.trim()).length;

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const match = (k: LabelKey) =>
      (!onlyChanged || Boolean(v[k]?.trim())) &&
      (!needle || [k, LABELS[k].d, LABELS[k].hint ?? "", v[k] ?? ""].some((x) => x.toLowerCase().includes(needle)));
    return (Object.keys(LABEL_GROUPS) as LabelGroup[])
      .map((g) => ({ g, keys: LABEL_KEYS.filter((k) => LABELS[k].g === g && match(k)) }))
      .filter((x) => x.keys.length);
  }, [q, onlyChanged, v]);

  return (
    <div className="space-y-6">
      <Panel
        title="Text & labels"
        description="Change any button, menu item or small heading on your store. Leave a box empty to use the default text (shown in grey). Wrap a word in *asterisks* to highlight it in headings."
      >
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-[240px] flex-1">
            <span className="sr-only">Find a text</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <TextInput className="pl-9" placeholder="Find a text, e.g. “Add to Cart” or “footer”" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onlyChanged} onChange={(e) => setOnlyChanged(e.target.checked)} /> Only changed ({changed})
          </label>
        </div>
      </Panel>

      {groups.length === 0 && <p className="text-sm text-muted">No text matches “{q}”.</p>}
      {groups.map(({ g, keys }) => (
        <Panel key={g} id={`labels-${g}`} title={LABEL_GROUPS[g]}>
          <ul className="divide-y divide-line">
            {keys.map((k) => {
              const own = v[k] ?? "";
              return (
                <li key={k} className="grid gap-2 py-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] sm:items-center">
                  <label htmlFor={`lbl-${k}`} className="text-sm">
                    <span className="font-medium">{nameOf(k)}</span>
                    {LABELS[k].hint && <span className="block text-xs text-muted">{LABELS[k].hint}</span>}
                  </label>
                  <TextInput id={`lbl-${k}`} value={own} placeholder={LABELS[k].d} maxLength={300} onChange={(e) => set(k, e.target.value)} className={own.trim() ? "border-ink" : undefined} />
                  <button
                    type="button"
                    disabled={!own}
                    onClick={() => set(k, "")}
                    title="Back to the default text"
                    aria-label={`Reset ${nameOf(k)} to default`}
                    className="inline-flex size-9 items-center justify-center justify-self-end rounded-full text-muted hover:bg-surface hover:text-ink disabled:opacity-30"
                  >
                    <RotateCcw className="size-4" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>
      ))}
      <SaveBar {...s} label="Save texts" />
    </div>
  );
}
