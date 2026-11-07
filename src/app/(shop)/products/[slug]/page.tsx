import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSiteConfig } from "@/services/site-config.service";
import { AvailabilityBadge, UniqueBadge } from "@/components/product/availability-badge";
import { ProductPurchase, type OptionSettings } from "@/components/product/product-purchase";
import { RatingStars } from "@/components/product/rating-stars";
import { ProductReviews } from "@/components/reviews/product-reviews";
import { getCategoryBySlug, getProductBySlug } from "@/services/catalog.service";
import { ProductSpecs } from "@/components/product/product-specs";
import { FavouriteButton } from "@/components/shopping/favourite-button";
import { RecentlyViewed, RecentlyViewedTracker } from "@/components/shopping/recently-viewed";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: { images: product.image ? [product.image.url] : [] },
  };
}

function Detail({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-b border-line py-3">
      <dt className="text-ink/80">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

export default async function ProductPage({ params }: Props) {
  const [product, site] = await Promise.all([getProductBySlug((await params).slug), getSiteConfig()]);
  if (!product) notFound();
  // Page options from Admin → Studio → Pages.
  const opts = site.pages.product;
  // Option labels / glaze style come from the product's category (Admin → Categories).
  const category = product.category.slug ? await getCategoryBySlug(product.category.slug) : null;
  const showcase = opts.layout === "showcase";
  const rv = site.shopping.recentlyViewed;

  return (
    <div data-studio="product-page" className="container py-8 md:py-14">
      {opts.showBreadcrumb && <nav aria-label="Breadcrumb" className="mb-4 text-sm text-ink/80">
        <Link href="/" className="hover:underline">Home</Link>
        {product.category.slug && (
          <>
            {" / "}
            <Link href={`/category/${product.category.slug}`} className="hover:underline">{product.category.name}</Link>
          </>
        )}
      </nav>}

      <RecentlyViewedTracker productId={product.id} />
      <ProductPurchase product={product} imageSide={opts.imageSide} layout={opts.layout} options={category?.options as Partial<OptionSettings> | undefined}>
        <div className="flex flex-wrap items-center gap-2">
          <AvailabilityBadge availability={product.availability} />
          {product.isUnique && <UniqueBadge />}
          {!showcase && <RatingStars value={product.ratingAvg} count={product.ratingCount} />}
          <FavouriteButton productId={product.id} name={product.name} variant="button" className="ms-auto" />
        </div>

        {product.description && <p className="whitespace-pre-line leading-relaxed text-ink">{product.description}</p>}

        <ProductSpecs slug={product.slug} />

        <dl>
          <Detail label="Capacity" value={product.capacity} />
          <Detail label="Dimensions" value={product.dimensions} />
        </dl>

        {product.type === "CRAFT" && product.kitContents.length > 0 && (
          <section className="rounded-lg bg-surface p-4">
            <h2 className="mb-2 text-lg">What&apos;s in the kit</h2>
            <ul className="list-inside list-disc space-y-1 text-ink">
              {product.kitContents.map((k) => <li key={k}>{k}</li>)}
            </ul>
          </section>
        )}

        {product.care && (
          <details className="group rounded-lg bg-surface p-4">
            <summary className="flex min-h-touch cursor-pointer items-center font-display text-lg text-ink">Care</summary>
            <p className="whitespace-pre-line pt-2 text-ink">{product.care}</p>
          </details>
        )}

        {opts.handmadeNote && <p className="text-sm text-ink/80">{opts.handmadeNote}</p>}
      </ProductPurchase>
      {opts.showReviews && site.visibility.pages.reviews && <div id="reviews" className="-mx-5 md:-mx-10">
        <ProductReviews productId={product.id} slug={product.slug} ratingAvg={product.ratingAvg} ratingCount={product.ratingCount} />
      </div>}
      {rv.enabled && rv.onProductPage && (
        <div className="mt-20">
          <RecentlyViewed title={rv.title} count={rv.count} excludeId={product.id} />
        </div>
      )}
    </div>
  );
}
