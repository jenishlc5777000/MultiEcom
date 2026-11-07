import { notFound } from "next/navigation";
import { PageHero } from "@/components/content/page-hero";
import { FavouritesList } from "@/components/shopping/favourites-list";
import { getSiteConfig } from "@/services/site-config.service";

export const metadata = { title: "Favourites", robots: { index: false } };

/** Favourites saved in this browser (Studio → Shopping → Favourites). */
export default async function FavouritesPage() {
  const { shopping } = await getSiteConfig();
  if (!shopping.favourites.enabled) notFound();
  return (
    <div>
      <PageHero eyebrow="Saved" title={shopping.favourites.title} className="pb-8 md:pb-12" />
      <div className="container">
        <FavouritesList />
      </div>
    </div>
  );
}
