import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Button, ButtonArrow } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = { eyebrow: string; title: React.ReactNode; href?: string; linkLabel?: string; className?: string };

export function SectionHeading({ eyebrow, title, href, linkLabel = "View all", className }: Props) {
  return (
    <Reveal className={cn("flex flex-wrap items-end justify-between gap-6", className)}>
      <div className="space-y-3">
        <p className="eyebrow section-eyebrow">{eyebrow}</p>
        <h2 className="text-h2">{title}</h2>
      </div>
      {href && (
        <Button asChild variant="link">
          <Link href={href}>
            {linkLabel} <ButtonArrow />
          </Link>
        </Button>
      )}
    </Reveal>
  );
}
