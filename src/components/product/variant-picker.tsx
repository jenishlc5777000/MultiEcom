"use client";

import { Check, ChevronRight } from "lucide-react";
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export type Option = { id: string; label: string; hex?: string; swatchUrl?: string; disabled?: boolean };

type Props = {
  title: string; // "Glaze" | "Size"
  options: Option[];
  value: string | null;
  onChange: (id: string) => void;
};

function Swatch({ option }: { option: Option }) {
  if (!option.hex && !option.swatchUrl) return null;
  return (
    <span
      aria-hidden
      className="size-6 shrink-0 rounded-full border border-ink/10 bg-cover bg-center"
      style={{ backgroundColor: option.hex, backgroundImage: option.swatchUrl ? `url(${option.swatchUrl})` : undefined }}
    />
  );
}

/** Desktop: inline chips. */
export function OptionChips({ title, options, value, onChange }: Props) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-ink">
        {title}: <span className="text-muted">{options.find((o) => o.id === value)?.label ?? "Choose"}</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            disabled={o.disabled}
            aria-pressed={o.id === value}
            onClick={() => onChange(o.id)}
            className={cn(
              "inline-flex min-h-touch items-center gap-2 rounded-pill border bg-canvas px-4 text-sm transition-colors duration-300",
              o.id === value ? "border-ink ring-1 ring-ink" : "border-line hover:border-ink/50",
              o.disabled && "cursor-not-allowed text-muted line-through opacity-60",
            )}
          >
            <Swatch option={o} />
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Mobile: a row that opens a bottom sheet. */
export function OptionSheet({ title, options, value, onChange }: Props) {
  const selected = options.find((o) => o.id === value);
  return (
    <Drawer>
      <DrawerTrigger className="flex min-h-[52px] w-full items-center justify-between rounded-lg border border-line bg-surface px-4 text-left">
        <span className="flex items-center gap-3">
          <span className="text-sm text-muted">{title}</span>
          {selected && <Swatch option={selected} />}
          <span className="font-medium text-ink">{selected?.label ?? "Choose"}</span>
        </span>
        <ChevronRight className="size-5 text-muted" />
      </DrawerTrigger>
      <DrawerContent aria-describedby={undefined}>
        <DrawerHeader>
          <DrawerTitle>Choose {title.toLowerCase()}</DrawerTitle>
        </DrawerHeader>
        <ul className="overflow-y-auto px-2 pb-4">
          {options.map((o) => (
            <li key={o.id}>
              <DrawerClose asChild>
                <button
                  type="button"
                  disabled={o.disabled}
                  onClick={() => onChange(o.id)}
                  className="flex min-h-[52px] w-full items-center gap-3 rounded-lg px-3 text-left hover:bg-surface disabled:opacity-50"
                >
                  <Swatch option={o} />
                  <span className="flex-1">
                    {o.label}
                    {o.disabled && <span className="ml-2 text-sm text-muted">Unavailable</span>}
                  </span>
                  {o.id === value && <Check className="size-5 text-ink" />}
                </button>
              </DrawerClose>
            </li>
          ))}
        </ul>
      </DrawerContent>
    </Drawer>
  );
}
