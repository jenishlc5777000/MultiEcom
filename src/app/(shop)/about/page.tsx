import { getSiteConfig } from "@/services/site-config.service";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { PageHero } from "@/components/content/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { getCategories, getHomepageData } from "@/services/catalog.service";

export const metadata: Metadata = {
  title: "About Nibbea",
  description: "Crafted with passion. Created for joy. Discover the story behind Nibbea ceramics and creative kits.",
};

export default async function AboutPage() {
  if (!(await getSiteConfig()).visibility.pages.about) notFound();
  const categories = await getCategories();

  return (
    <div className="space-y-24 md:space-y-36">
      <div>
        <PageHero
          eyebrow="About Nibbea"
          title={<>Crafted with Passion. <em className="italic text-accent">Created for Joy.</em></>}
          lead="At Nibbea, we believe that creativity has the power to make everyday moments extraordinary."
        />
        <div className="container">
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-surface-strong md:aspect-[21/9]">
            <Image src="/about-hero.jpg" alt="Handmade ceramic mugs, bowls and vases beside paint-your-own figurines and colourful paints in a sunny studio" fill priority sizes="100vw" className="object-cover object-[center_60%]" />
          </div>
        </div>
      </div>

      <section className="container grid gap-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <p className="eyebrow">Two worlds, one creative spirit</p>
          <h2 className="mt-4 text-h2">The art of <em className="italic">everyday joy</em></h2>
        </Reveal>
        <Reveal delay={100} className="space-y-5 text-muted lg:col-span-7 lg:col-start-6">
          <p>Born from a passion for craftsmanship, imagination, and meaningful creations, Nibbea brings together two beautiful worlds — the timeless elegance of ceramics and the colorful joy of arts &amp; crafts. We believe every creation should tell a story, inspire a smile, and bring something special into your life.</p>
          <h3 className="pt-3 font-display text-3xl text-ink">The Art of Everyday Elegance</h3>
          <p>Our ceramics collection celebrates thoughtful design and craftsmanship. From elegant mugs and beautiful planters to distinctive decorative pieces, we create products that bring warmth, character, and sophistication to everyday living. Each design reflects our appreciation for detail, individuality, and the simple beauty of art.</p>
          <h3 className="pt-3 font-display text-3xl text-ink">Little Hands. Big Imaginations.</h3>
          <p>Creativity knows no age. Through our arts &amp; crafts collection, we bring imagination to life with engaging DIY painting kits, creative activities, and delightful artistic experiences. Our goal is to encourage children to explore, create, learn, and experience the happiness of making something with their own hands. Sometimes, the most beautiful creations begin with a little imagination.</p>
        </Reveal>
      </section>

      {/* Category image row hidden on request.
      {(ceramics || crafts) && (
        <section className="container grid grid-cols-2 gap-4 md:gap-8" aria-label="Ceramics and arts and crafts">
          {[
            { label: "Ceramics", item: ceramics },
            { label: "Arts & crafts", item: crafts },
          ].map(({ label, item }) => item ? (
            <Reveal key={label} className="space-y-3">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-strong">
                <Image src={item.url} alt={item.alt || label} fill sizes="(min-width: 768px) 42vw, 48vw" className="object-cover" />
              </div>
              <p className="eyebrow">{label}</p>
            </Reveal>
          ) : <div key={label} aria-hidden />)}
        </section>
      )} */}

      <section className="container grid gap-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <p className="eyebrow">Our promise</p>
          <h2 className="mt-4 text-h2">Made to inspire. <em className="italic">Designed to delight.</em></h2>
        </Reveal>
        <Reveal delay={100} className="space-y-5 text-muted lg:col-span-7 lg:col-start-6">
          <p>Great products are more than just things you own. They become part of your home, your memories, and your happiest moments. Whether you&apos;re choosing a beautifully designed ceramic piece or discovering a creative activity for your little one, we want every Nibbea experience to feel thoughtful, inspiring, and special.</p>
          <p className="font-display text-2xl text-ink">Nibbea — Where Craftsmanship Meets Creativity.</p>
        </Reveal>
      </section>

      <section className="container grid gap-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <p className="eyebrow">Our story</p>
          <h2 className="mt-4 text-h2">How it <em className="italic">started</em></h2>
        </Reveal>
        <Reveal delay={100} className="space-y-5 text-muted lg:col-span-7 lg:col-start-6">
          <p>Every great creation begins with a passion. Ours began with clay. Nibbea&apos;s journey began with a love for ceramics — the beauty of transforming simple clay into something elegant, meaningful, and timeless. What started as a passion for creating distinctive ceramic pieces gradually grew into a vision of building a brand that celebrates craftsmanship, creativity, and thoughtful design.</p>
          <p>As our creative journey evolved, so did our imagination. We expanded beyond ceramics into the colorful world of arts &amp; crafts, introducing creative painting kits and activities that inspire children to explore, learn, and express themselves.</p>
          <p>Today, Nibbea brings together two worlds — the elegance of ceramics and the joy of creativity — united by one belief: beautiful things are created with passion.</p>
          <h3 className="pt-3 font-display text-3xl text-ink">Rooted in Craftsmanship. Growing Through Creativity.</h3>
          <p>Our story began with ceramics, where every curve, texture, and design reflects our appreciation for artistry and detail. From thoughtfully designed ceramic collections to imaginative DIY craft kits, we continue to explore new ways to bring beauty, creativity, and happiness into everyday life.</p>
          <p className="font-display text-2xl text-ink">Nibbea — Where Craftsmanship Meets Creativity.</p>
        </Reveal>
      </section>

      {/* <ProcessSection /> */}
    </div>
  );
}
