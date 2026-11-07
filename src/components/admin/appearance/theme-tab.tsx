"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { applyTemplateAction, saveThemeAction } from "@/actions/admin/site.actions";
import { TEMPLATES } from "@/config/templates";
import { Button } from "@/components/ui/button";
import { getTheme } from "@/config/themes";
import { FormMessage } from "../form";
import { ThemePicker } from "../theme-picker";
import { ThemeTransfer } from "../theme-transfer";
import { refreshPreview, useOpenPreview, usePreviewDraft, usePreviewOpen } from "./preview";
import { Panel } from "./shared";

/** Studio → Theme: pick one of the themes (with live preview), export or import. */
export function ThemeTab({ initial }: { initial: string }) {
  const router = useRouter();
  const [theme, setTheme] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);
  // Live preview of the picked theme before saving (owner only).
  usePreviewDraft("theme", theme);
  const previewOpen = usePreviewOpen();
  const openPreview = useOpenPreview();
  const template = TEMPLATES[theme];
  const runTemplate = (mode: "preview" | "live") => {
    if (mode === "live" && !confirm(`Apply the "${getTheme(theme).name}" template now? This replaces your home-page sections, hero texts and layout/colour/card overrides (products, categories, header, footer and settings stay). Tip: export first as a backup.`)) return;
    start(async () => {
      const r = await applyTemplateAction(theme, mode);
      setMsg(r.ok ? { ok: true, message: r.data } : { ok: false, message: r.error });
      if (!r.ok) return;
      if (mode === "preview") {
        if (previewOpen) refreshPreview();
        else openPreview(true);
      } else {
        setSaved(theme);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <Panel
        id="theme"
        title="Theme"
        description="Each theme is a complete design: colours, fonts, shapes, effects, product cards and the kind of home page. Everything in the other Studio tabs is layered on top."
      >
        <ThemePicker value={theme} onChange={setTheme} />
      </Panel>

      <div className="sticky bottom-3 z-20 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-canvas/95 p-3 shadow-float backdrop-blur">
        <Button
          type="button"
          disabled={pending || theme === saved}
          onClick={() =>
            start(async () => {
              const r = await saveThemeAction(theme);
              setMsg(r.ok ? { ok: true, message: `“${getTheme(theme).name}” is now live.` } : { ok: false, message: r.error });
              if (r.ok) {
                setSaved(theme);
                router.refresh();
              }
            })
          }
        >
          {pending ? "Saving…" : theme === saved ? "Theme saved" : `Use “${getTheme(theme).name}”`}
        </Button>
        {theme !== saved && (
          <Button type="button" variant="quiet" size="sm" onClick={() => setTheme(saved)}>Undo choice</Button>
        )}
        <FormMessage result={msg} />
      </div>

      {template && (
        <Panel id="template" title={`Template: ${getTheme(theme).name}`} description={`${template.summary} Your products, categories and settings are not changed; everything stays editable in Sections and Content.`}>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" disabled={pending} onClick={() => runTemplate("preview")}>Try template in preview</Button>
            <Button type="button" disabled={pending} onClick={() => runTemplate("live")}>Apply template now</Button>
          </div>
        </Panel>
      )}

      <Panel id="theme-transfer" title="Export / import">
        <ThemeTransfer />
      </Panel>
    </div>
  );
}
