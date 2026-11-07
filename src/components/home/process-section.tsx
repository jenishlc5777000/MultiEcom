import { RichTitle } from "@/components/content/rich-title";
import { Reveal } from "@/components/motion/reveal";
import { defaultSiteConfig, type SiteConfig } from "@/lib/site-config";
import { SectionHeading } from "./section-heading";

/** Steps of the making process; edited in Admin → Studio → Content. */
export function ProcessSection({ content = defaultSiteConfig.content.process }: { content?: SiteConfig["content"]["process"] }) {
  const steps = content.steps.filter((s) => s.title);
  if (!steps.length) return null;
  return (
    <section data-studio="process" className="bg-surface py-20 md:py-32">
      <div className="container space-y-14">
        <SectionHeading eyebrow={content.eyebrow} title={<RichTitle text={content.title} />} />
        <ol className={`grid gap-10 sm:grid-cols-2 lg:gap-8 ${steps.length >= 4 ? "lg:grid-cols-4" : steps.length === 3 ? "lg:grid-cols-3" : ""}`}>
          {steps.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 110} className="group">
              <div className="mb-6 h-px w-full bg-line">
                <div className="grow-x h-px bg-ink" />
              </div>
              <span className="font-display text-6xl italic leading-none text-accent/80 transition-colors duration-500 group-hover:text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-h3">{s.title}</h3>
              <p className="mt-2 max-w-xs text-muted">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
