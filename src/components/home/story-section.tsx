import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Button, ButtonArrow } from "@/components/ui/button";
import { RichTitle } from "@/components/content/rich-title";
import { defaultSiteConfig, type SiteConfig } from "@/lib/site-config";
import type { ImageDTO } from "@/types/dto";

export function StorySection({ image, content = defaultSiteConfig.content.story }: { image?: ImageDTO; content?: SiteConfig["content"]["story"] }) {
  return (
    <section data-studio="story" className="container grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
      <Reveal className="fx-photo relative aspect-[4/5] overflow-hidden rounded-lg bg-surface-strong lg:col-span-5">
        {image && <Image src={image.url} alt={image.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="parallax object-cover" />}
      </Reveal>

      <div className="space-y-8 lg:col-span-6 lg:col-start-7">
        <Reveal className="space-y-4">
          <p className="eyebrow section-eyebrow" data-edit="content:story.eyebrow" data-edit-raw={content.eyebrow}>{content.eyebrow}</p>
          <h2 className="text-h2" data-edit="content:story.title" data-edit-raw={content.title}><RichTitle text={content.title} /></h2>
        </Reveal>
        <Reveal delay={120} className="space-y-4 text-lg leading-relaxed text-muted">
          {content.body.split(/\n{2,}/).map((para, i) => <p key={i} className="whitespace-pre-line">{para}</p>)}
        </Reveal>
        <Reveal delay={220}>
          <Button asChild variant="secondary" size="lg">
            <Link href="/about">
              {content.ctaLabel} <ButtonArrow />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
