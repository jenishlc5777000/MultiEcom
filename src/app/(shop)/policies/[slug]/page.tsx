import { getSiteConfig } from "@/services/site-config.service";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/content/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { policyPages, type PolicySlug } from "@/config/site";
import { getPolicy } from "@/content/policies";
import { cn } from "@/lib/utils";
import { getStoreInfo } from "@/services/store.service";

type Props = { params: Promise<{ slug: string }> };

const isPolicy = (slug: string): slug is PolicySlug => policyPages.some((p) => p.slug === slug);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = policyPages.find((p) => p.slug === slug);
  return page ? { title: page.label } : {};
}

export default async function PolicyPage({ params }: Props) {
  // Studio → Visibility.
  if (!(await getSiteConfig()).visibility.pages.policies) notFound();
  const { slug } = await params;
  if (!isPolicy(slug)) notFound();
  const policy = getPolicy(slug, await getStoreInfo());

  return (
    <div>
      <PageHero eyebrow="Policies" title={policy.title} lead={policy.lead} />

      <div className="container grid gap-12 lg:grid-cols-12">
        <aside className="min-w-0 lg:col-span-3">
          <nav aria-label="Policies" className="lg:sticky lg:top-28">
            <ul className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0">
              {policyPages.map((p) => {
                const active = p.slug === slug;
                return (
                  <li key={p.slug} className="shrink-0">
                    <Link
                      href={`/policies/${p.slug}`}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-touch items-center rounded-pill px-4 text-[15px] transition-colors duration-300 lg:rounded-md",
                        active ? "bg-ink text-canvas" : "text-muted hover:bg-surface hover:text-ink",
                      )}
                    >
                      {p.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-10 hidden lg:block">
              <p className="eyebrow mb-3">On this page</p>
              <ul className="space-y-1 border-l border-line">
                {policy.sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="-ml-px block border-l border-transparent py-1.5 pl-4 text-sm text-muted transition-colors hover:border-ink hover:text-ink">
                      {s.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </aside>

        <article className="prose-shop min-w-0 lg:col-span-8 lg:col-start-5">
          {policy.sections.map((s, i) => (
            <Reveal key={s.id} delay={Math.min(i, 3) * 60}>
              <section aria-labelledby={s.id}>
                <h2 id={s.id}>{s.heading}</h2>
                {s.body}
              </section>
            </Reveal>
          ))}
          <p className="mt-16 border-t border-line pt-6 text-sm text-muted">
            Bracketed items are placeholders. Fill them in and have this page reviewed before launch.
          </p>
        </article>
      </div>
    </div>
  );
}
