import { RichTitle } from "@/components/content/rich-title";
import { CategoryShowcase } from "@/components/home/category-showcase";
import { ClosingCta } from "@/components/home/closing-cta";
import { Hero } from "@/components/home/hero";
import { ProcessSection } from "@/components/home/process-section";
import { PromiseStrip } from "@/components/home/promise-strip";
import { SectionHeading } from "@/components/home/section-heading";
import { StorySection } from "@/components/home/story-section";
import { Marquee } from "@/components/motion/marquee";
import { ProductCarousel } from "@/components/product/product-carousel";
import { ProductGrid } from "@/components/product/product-card";
import type { HomeData } from "./types";

/** The marketing landing page: hero, categories, story, process, products. */
export function LandingHome(d: HomeData) {
  const { layout } = d.theme;
  const { sections: on } = d.site.design;
  const t = d.site.content.sections;

  const readyCarousel = on.readyToShip && (
    <div data-studio="ready-to-ship" className="container">
      <ProductCarousel eyebrow={t.readyEyebrow} title={t.readyTitle.replace(/\*/g, "")} products={d.readyStock} href="/category" />
    </div>
  );
  const newArrivals = on.newArrivals && d.newest.length > 0 && (
    <section data-studio="new-arrivals" className="container space-y-10">
      <SectionHeading eyebrow={t.newEyebrow} title={<RichTitle text={t.newTitle} />} href="/category" />
      <ProductGrid products={d.newest.slice(0, 8)} />
    </section>
  );
  const story = on.story && <StorySection image={d.storyImage} content={d.site.content.story} />;
  const process = on.process && <ProcessSection content={d.site.content.process} />;

  return (
    <div className="space-y-24 md:space-y-36">
      <div>
        <Hero layout={layout.hero} banner={d.banner} image={d.heroImage} gallery={d.gallery} featured={d.featured} featuredLabel={d.site.content.hero.featuredLabel} slides={d.heroSlides} stats={d.stats} content={d.site.content.hero} search={{ placeholder: d.site.search.placeholder, instant: d.site.search.instant, popular: d.site.search.popular }} />
        {on.marquee && d.tickerItems.length > 0 && <div data-studio="marquee"><Marquee items={d.tickerItems} className="mt-10 border-y border-line py-6 md:mt-0 md:py-8" /></div>}
      </div>

      {on.categories && (
        <CategoryShowcase categories={d.categories} layout={layout.categories} eyebrow={t.categoriesEyebrow} title={t.categoriesTitle} />
      )}

      {layout.sections === "shop-first" ? (
        <>
          {newArrivals}
          {readyCarousel}
          {story}
          {process}
        </>
      ) : (
        <>
          {readyCarousel}
          {story}
          {process}
          {newArrivals}
        </>
      )}

      {on.promise && <PromiseStrip {...d.store} />}
      {on.closingCta && <ClosingCta content={d.site.content.closing} />}
    </div>
  );
}
