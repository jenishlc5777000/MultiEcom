import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostBody } from "@/components/blog/post-body";
import { PostCard, PostMeta } from "@/components/blog/post-card";
import { getCurrentUser } from "@/lib/auth/guards";
import { getPostBySlug } from "@/services/blog.service";
import { getSiteConfig } from "@/services/site-config.service";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug((await params).slug);
  if (!post) return {};
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    openGraph: { type: "article", publishedTime: post.publishedAt, images: post.cover ? [post.cover.url] : [] },
  };
}

/** One blog post. Drafts and scheduled posts are visible only to the owner (as a preview). */
export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const { blog } = await getSiteConfig();
  const user = await getCurrentUser();
  const owner = user?.role === "owner";
  if (!blog.enabled && !owner) notFound();
  const post = await getPostBySlug(slug, owner);
  if (!post) notFound();

  return (
    <article className="pb-20">
      {!post.isLive && (
        <p className="bg-mto/15 py-2 text-center text-sm text-mto">
          Preview: this post is {post.status === "DRAFT" ? "a draft" : "scheduled"} and only you can see it. <Link href={`/admin/blog/${post.id}`} className="underline">Edit</Link>
        </p>
      )}
      <header className="container max-w-3xl space-y-5 pb-10 pt-12 md:pt-20">
        <Link href="/blog" className="text-sm text-muted hover:text-ink">← {blog.title}</Link>
        <h1 className="text-h1">{post.title}</h1>
        {post.excerpt && <p className="text-lg text-muted">{post.excerpt}</p>}
        <PostMeta post={post} cfg={blog} />
      </header>
      {post.cover && (
        <div className="container max-w-5xl">
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-surface">
            <Image src={post.cover.url} alt={post.cover.alt} fill priority sizes="(min-width: 1024px) 1000px, 100vw" className="object-cover" />
          </div>
        </div>
      )}
      <div className="container max-w-3xl pt-12">
        <PostBody body={post.body} />
        {post.tags.length > 0 && (
          <p className="mt-12 flex flex-wrap gap-2 border-t border-line pt-6">
            {post.tags.map((t) => <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`} className="rounded-pill border border-line px-3 py-1 text-sm text-muted hover:text-ink">#{t}</Link>)}
          </p>
        )}
      </div>
      {post.related.length > 0 && (
        <section aria-labelledby="related-h" className="container mt-20 space-y-8">
          <h2 id="related-h" className="text-h3">More to read</h2>
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{post.related.map((p) => <PostCard key={p.id} post={p} cfg={blog} />)}</div>
        </section>
      )}
    </article>
  );
}
