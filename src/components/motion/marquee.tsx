import { Fragment } from "react";
import { cn } from "@/lib/utils";

/** Endless horizontal ticker. Content is duplicated once so the loop is seamless. */
export function Marquee({ items, className }: { items: string[]; className?: string }) {
  if (!items.length) return null;
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <Fragment key={`${item}-${i}`}>
          <li className="whitespace-nowrap font-display text-4xl md:text-6xl">{item}</li>
          <li aria-hidden className="size-2.5 shrink-0 rounded-full bg-accent" />
        </Fragment>
      ))}
    </ul>
  );
  return (
    <div className={cn("relative flex overflow-hidden", className)}>
      <div className="pause-on-hover flex w-max animate-marquee">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
