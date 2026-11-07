import Link from "next/link";
import { Star } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { getCurrentUser } from "@/lib/auth/guards";
import { getApprovedReviews, getReviewEligibility } from "@/services/review.service";
import { ReviewForm } from "./review-form";

/** Approved reviews + a form for verified buyers whose order was delivered. */
export async function ProductReviews({ productId, slug, ratingAvg, ratingCount }: { productId: string; slug: string; ratingAvg: number; ratingCount: number }) {
  const [reviews, user] = await Promise.all([getApprovedReviews(productId), getCurrentUser()]);
  const eligibility = user ? await getReviewEligibility(user.id, productId) : null;

  return (
    <section aria-labelledby="reviews" className="container mt-24 md:mt-32">
      <div className="grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <p className="eyebrow">Reviews</p>
          <h2 id="reviews" className="mt-3 text-h2">What buyers <em className="italic">say</em></h2>
          {ratingCount > 0 ? (
            <p className="mt-6 flex items-baseline gap-3">
              <span className="font-sans text-5xl font-semibold">{ratingAvg.toFixed(1)}</span>
              <span className="text-muted">out of 5 · {ratingCount} review{ratingCount === 1 ? "" : "s"}</span>
            </p>
          ) : (
            <p className="mt-6 text-muted">No reviews yet.</p>
          )}
          <div className="mt-8">
            {!user ? (
              <p className="text-sm text-muted">
                Bought this piece? <Link href={`/login?callbackUrl=/products/${slug}`} className="text-accent underline">Sign in</Link> to review it.
              </p>
            ) : eligibility?.canReview ? (
              <ReviewForm productId={productId} orderId={eligibility.orderId} />
            ) : eligibility?.reason === "pending" ? (
              <p className="text-sm text-muted">Thanks for your review. It&apos;s waiting for the studio to check it.</p>
            ) : eligibility?.reason === "reviewed" ? (
              <p className="text-sm text-muted">You&apos;ve reviewed this piece. Thank you!</p>
            ) : (
              <p className="text-sm text-muted">You can review a piece once your order has been delivered.</p>
            )}
          </div>
        </Reveal>

        <ul className="space-y-6 lg:col-span-7 lg:col-start-6">
          {reviews.map((r, i) => (
            <Reveal as="li" key={r.id} delay={Math.min(i, 3) * 80} className="border-b border-line pb-6">
              <div className="flex items-center justify-between gap-3">
                <p className="flex" aria-label={`${r.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`size-4 ${n <= r.rating ? "fill-ink text-ink" : "text-line"}`} aria-hidden />)}
                </p>
                <p className="text-sm text-muted">
                  {r.author} · {new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                </p>
              </div>
              {r.text && <p className="mt-3 whitespace-pre-line leading-relaxed">{r.text}</p>}
              {r.reply && (
                <div className="mt-4 border-l-2 border-accent/40 pl-4 text-sm">
                  <p className="font-medium">Reply from the studio</p>
                  <p className="text-muted">{r.reply}</p>
                </div>
              )}
            </Reveal>
          ))}
          {reviews.length === 0 && <li className="text-muted">Be the first to share how you use it.</li>}
        </ul>
      </div>
    </section>
  );
}
