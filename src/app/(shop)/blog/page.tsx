import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/blog/post-card";
import { PageHero } from "@/components/content/page-hero";
import { listPublishedPosts } from "@/services/blog.service";
import { getSiteConfig } from "@/services/site-config.service";

export async function generateMetadata() {
  const { blog } = await getSiteConfig();
  return { title: blog.title, description: blog.intro };
}

/** /blog: published posts (Admin → Blog). */
export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string; tag?: string }> }) {
  const { blog } = await getSiteConfig();
  if (!blog.enabled) notFound();
  const sp = await searchParams;
  const page = Math.max(1, Math.min(500, Number(sp.page) || 1));
  const tag = (sp.tag ?? "").toLowerCase().slice(0, 30);
  const { posts, pages, tags } = await listPublishedPosts(page, blog.perPage, tag);
  const href = (p: number) => `/blog?${new URLSearchParams({ ...(tag ? { tag } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`;

  return (
    <div>
      <PageHero eyebrow="Blog" title={blog.title} lead={blog.intro} className="pb-8 md:pb-12" />
      <div className="container space-y-12 pb-20">
        {tags.length > 0 && (
          <nav aria-label="Topics" className="flex flex-wrap gap-2">
            <Link href="/blog" aria-current={!tag ? "page" : undefined} className={`rounded-pill border px-4 py-1.5 text-sm ${!tag ? "border-ink bg-ink text-canvas" : "border-line hover:border-ink"}`}>All</Link>
            {tags.map((t) => (
              <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`} aria-current={tag === t ? "page" : undefined} className={`rounded-pill border px-4 py-1.5 text-sm ${tag === t ? "border-ink bg-ink text-canvas" : "border-line hover:border-ink"}`}>
                {t}
              </Link>
            ))}
          </nav>
        )}

        {posts.length === 0 ? (
          <p className="text-muted">{tag ? "No posts on this topic yet." : "No posts yet. Check back soon."}</p>
        ) : blog.layout === "list" ? (
          <div className="space-y-12">{posts.map((p) => <PostCard key={p.id} post={p} cfg={blog} wide />)}</div>
        ) : (
          <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">{posts.map((p) => <PostCard key={p.id} post={p} cfg={blog} />)}</div>
        )}

        {pages > 1 && (
          <nav aria-label="Pages" className="flex items-center justify-center gap-4 text-sm">
            {page > 1 ? <Link href={href(page - 1)} className="underline underline-offset-4">← Newer</Link> : <span />}
            <span className="text-muted">Page {page} of {pages}</span>
            {page < pages ? <Link href={href(page + 1)} className="underline underline-offset-4">Older →</Link> : <span />}
          </nav>
        )}
      </div>
    </div>
  );
}
