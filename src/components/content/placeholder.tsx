import { cn } from "@/lib/utils";

/**
 * Clearly marked copy the owner still has to write. Search the codebase for
 * <Placeholder> before launch; nothing here should ship as-is.
 */
/** Inline blank to fill in, e.g. <Fill>registered business name</Fill>. */
export function Fill({ children }: { children: React.ReactNode }) {
  return (
    <mark className="rounded-sm bg-accent/10 px-1 text-accent ring-1 ring-inset ring-accent/30" title="Placeholder: replace before launch">
      [{children}]
    </mark>
  );
}

export function Placeholder({ children, className, as: Tag = "p" }: { children: React.ReactNode; className?: string; as?: "p" | "div" | "span" }) {
  return (
    <Tag className={cn("rounded-md border border-dashed border-accent/50 bg-accent/5 p-4 text-base text-ink", className)}>
      <span className="mb-1 block text-eyebrow uppercase text-accent">Placeholder: replace before launch</span>
      {children}
    </Tag>
  );
}
