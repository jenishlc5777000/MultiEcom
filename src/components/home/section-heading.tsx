import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Button, ButtonArrow } from "@/components/ui/button";
import { makeT } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { getSiteConfig } from "@/services/site-config.service";

type Props = { eyebrow: string; title: React.ReactNode; href?: string; linkLabel?: string; className?: string };

export async function SectionHeading({ eyebrow, title, href, linkLabel, className }: Props) {
  // "View all" by default; the owner can rename it in Studio → Text & labels.
  const label = linkLabel ?? (href ? makeT((await getSiteConfig()).labels)("home.viewAll") : "");
  return (
    <Reveal className={cn("flex flex-wrap items-end justify-between gap-6", className)}>
      <div className="space-y-3">
        <p className="eyebrow section-eyebrow">{eyebrow}</p>
        <h2 className="text-h2">{title}</h2>
      </div>
      {href && (
        <Button asChild variant="link">
          <Link href={href}>
            {label} <ButtonArrow />
          </Link>
        </Button>
      )}
    </Reveal>
  );
}
