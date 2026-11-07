import { cn } from "@/lib/utils";

type Props = { eyebrow: string; title: React.ReactNode; lead?: React.ReactNode; className?: string };

/** Title block for inner pages, with the same line-rise entrance as the home hero. */
export function PageHero({ eyebrow, title, lead, className }: Props) {
  return (
    <header className={cn("container pb-12 pt-12 md:pb-20 md:pt-20", className)}>
      <p className="eyebrow animate-fade-up">{eyebrow}</p>
      <h1 className="mt-5 max-w-4xl text-h1">
        <span className="line-mask">
          <span className="animate-rise-in [animation-delay:120ms]">{title}</span>
        </span>
      </h1>
      {lead && <div className="mt-6 max-w-2xl animate-fade-up text-lg leading-relaxed text-muted [animation-delay:350ms]">{lead}</div>}
    </header>
  );
}
