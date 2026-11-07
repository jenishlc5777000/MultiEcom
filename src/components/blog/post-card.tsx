import Image from "next/image";
import Link from "next/link";
import type { BlogConfig } from "@/lib/site-config";
import type { BlogCard } from "@/services/blog.service";

export const postDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

function Meta({ post, cfg }: { post: BlogCard; cfg: BlogConfig }) {
  const bits = [cfg.showDate && postDate(post.publishedAt), cfg.showAuthor && post.author, cfg.showReadingTime && `${Math.max(1, Math.round(post.words / 200))} min read`].filter(Boolean);
  return bits.length ? <p className="text-xs uppercase tracking-wide text-muted">{bits.join(" · ")}</p> : null;
}

/** One post in the blog list (grid card or wide list row). */
export function PostCard({ post, cfg, wide = false }: { post: BlogCard; cfg: BlogConfig; wide?: boolean }) {
  return (
    <article className={wide ? "group grid gap-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:items-center" : "group space-y-4"}>
      <Link href={`/blog/${post.slug}`} className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-surface" tabIndex={-1} aria-hidden>
        {post.cover ? (
          <Image src={post.cover.url} alt="" fill sizes={wide ? "(min-width: 640px) 40vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"} className="object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <span className="flex h-full items-center justify-center p-6 text-center font-display text-2xl text-muted">{post.title}</span>
        )}
        {post.featured && <span className="absolute left-3 top-3 rounded-pill bg-canvas/90 px-3 py-1 text-xs font-medium">Featured</span>}
      </Link>
      <div className="space-y-2">
        <Meta post={post} cfg={cfg} />
        <h2 className={wide ? "text-h3" : "text-xl font-medium leading-snug"}>
          <Link href={`/blog/${post.slug}`} className="hover:underline">{post.title}</Link>
        </h2>
        {post.excerpt && <p className="line-clamp-3 text-muted">{post.excerpt}</p>}
        {post.tags.length > 0 && (
          <p className="flex flex-wrap gap-2 pt-1">
            {post.tags.map((t) => <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`} className="rounded-pill border border-line px-2.5 py-0.5 text-xs text-muted hover:text-ink">#{t}</Link>)}
          </p>
        )}
      </div>
    </article>
  );
}

export { Meta as PostMeta };
