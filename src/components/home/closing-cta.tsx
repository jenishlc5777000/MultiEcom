import Link from "next/link";
import { RichTitle } from "@/components/content/rich-title";
import { Reveal } from "@/components/motion/reveal";
import { defaultSiteConfig, type SiteConfig } from "@/lib/site-config";
import { Button, ButtonArrow } from "@/components/ui/button";

export function ClosingCta({ content = defaultSiteConfig.content.closing }: { content?: SiteConfig["content"]["closing"] }) {
  return (
    <section data-studio="closing" className="container">
      <Reveal className="brand-panel relative overflow-hidden rounded-lg bg-ink px-6 py-20 text-canvas md:px-16 md:py-28">
        <div aria-hidden className="absolute -right-24 -top-24 size-96 rounded-full border border-canvas/10" />
        <div aria-hidden className="absolute -right-8 -top-8 size-64 rounded-full border border-canvas/10" />
        <div className="relative grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-end">
          <h2 className="text-h1 text-canvas" data-edit="content:closing.title" data-edit-raw={content.title}><RichTitle text={content.title} emClassName="italic text-accent-soft" /></h2>
          <div className="space-y-6 md:justify-self-end">
            <p className="max-w-sm text-canvas/75" data-edit="content:closing.body" data-edit-raw={content.body}>{content.body}</p>
            <Button asChild variant="light" size="lg">
              <Link href={content.ctaHref || "/category"}>
                {content.ctaLabel} <ButtonArrow />
              </Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
