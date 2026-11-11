import { getSiteConfig } from "@/services/site-config.service";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { Hand, Leaf, Sparkles } from "lucide-react";
import { PageHero } from "@/components/content/page-hero";
import { Placeholder } from "@/components/content/placeholder";
import { ClosingCta } from "@/components/home/closing-cta";
import { ProcessSection } from "@/components/home/process-section";
import { Reveal } from "@/components/motion/reveal";
import { getCategories, getHomepageData } from "@/services/catalog.service";
import { getStoreInfo } from "@/services/store.service";

export const metadata: Metadata = {
  title: "About",
  description: "The people and the process behind Nibbea handmade ceramics.",
};

const values = [
  { icon: Hand, title: "Made by hand", body: "Every piece is shaped, trimmed and glazed by hand, so each one is slightly different from the last." },
  { icon: Leaf, title: "Made to be used", body: "We make pieces for daily use, for your morning coffee and your weeknight dinners, not just for the shelf." },
  { icon: Sparkles, title: "Honest imperfection", body: "Glaze pools, speckles and small marks are part of the character of handmade work. We see them as features, not flaws." },
];

export default async function AboutPage() {
  // Studio → Visibility.
  if (!(await getSiteConfig()).visibility.pages.about) notFound();
  const [{ newest }, categories, store] = await Promise.all([getHomepageData(), getCategories(), getStoreInfo()]);
  const image = newest[0]?.image ?? categories[0]?.image;

  return (
    <div className="space-y-24 md:space-y-36">
      <div>
        <PageHero
          eyebrow="About us"
          title={<>Made by hand, <em className="italic text-accent">one piece</em> at a time</>}
          lead={<Placeholder>One-line introduction: who you are and what you make, e.g. “We’re a small ceramics studio in [city] making …”</Placeholder>}
        />
        <div className="container">
          <div className="relative aspect-[16/9] animate-clip-up overflow-hidden rounded-lg bg-surface-strong [animation-delay:300ms] md:aspect-[21/9]">
            {image && <Image src={image.url} alt={image.alt} fill priority sizes="100vw" className="parallax object-cover" />}
          </div>
        </div>
      </div>

      <section className="container grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <p className="eyebrow">Our story</p>
          <h2 className="mt-4 text-h2">How it <em className="italic">started</em></h2>
        </Reveal>
        <Reveal delay={120} className="space-y-5 lg:col-span-7 lg:col-start-6">
          <Placeholder>
            The founder story, 2 to 4 short paragraphs. Cover how you started working with clay, when the studio began, who is on the team, and what you want people to feel when they use your pieces.
          </Placeholder>
          <Placeholder>
            Where you work: the studio, the city, the kiln, and any local materials or makers you work with. Add a studio photo here too.
          </Placeholder>
        </Reveal>
      </section>

      <section className="container">
        <ul className="grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3">
          {values.map((v, i) => (
            <Reveal as="li" key={v.title} delay={i * 100} className="group bg-canvas p-8 transition-colors duration-500 hover:bg-surface md:p-10">
              <v.icon className="size-7 text-accent transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110" strokeWidth={1.4} aria-hidden />
              <h3 className="mt-8 text-h3">{v.title}</h3>
              <p className="mt-3 text-muted">{v.body}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      <ProcessSection />

      <section className="container grid gap-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <p className="eyebrow">Say hello</p>
          <h2 className="mt-4 text-h2">Custom orders &amp; <em className="italic">questions</em></h2>
        </Reveal>
        <Reveal delay={120} className="space-y-4 text-lg lg:col-span-7 lg:col-start-6">
          <p className="text-muted">
            Looking for a set in a particular glaze, a gift, or something made to order? Get in touch and we&apos;ll tell you what&apos;s possible.
          </p>
          {store.contactEmail || store.contactPhone ? (
            <ul className="space-y-2">
              {store.contactEmail && <li><a className="link-underline font-display text-3xl" href={`mailto:${store.contactEmail}`}>{store.contactEmail}</a></li>}
              {store.contactPhone && <li><a className="link-underline text-xl" href={`tel:${store.contactPhone}`}>{store.contactPhone}</a></li>}
            </ul>
          ) : (
            <Placeholder>Add a contact email and phone in store settings (Setting.contactEmail / contactPhone) and they appear here and in the footer.</Placeholder>
          )}
        </Reveal>
      </section>

      <ClosingCta />
    </div>
  );
}
