import Image from "next/image";
import Link from "next/link";
import { BlogRowActions, BlogSettings } from "@/components/admin/blog-admin";
import { EmptyState, PageHeader, Pill, dateOnly } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { listPostsAdmin } from "@/services/blog.service";
import { getSiteConfig } from "@/services/site-config.service";

export const metadata = { title: "Blog" };

const TONE = { draft: "muted", published: "good", scheduled: "warn" } as const;

export default async function AdminBlogPage() {
  const [posts, site] = await Promise.all([listPostsAdmin(), getSiteConfig()]);
  return (
    <>
      <PageHeader
        title="Blog"
        description="Write posts, save drafts, publish now or schedule for later. Published posts appear on /blog and the blog is linked in the footer."
        actions={<Button asChild><Link href="/admin/blog/new">New post</Link></Button>}
      />
      <div className="space-y-8">
        {posts.length === 0 ? (
          <EmptyState title="No posts yet">Write your first post: studio news, how a glaze is made, care tips…</EmptyState>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line bg-paper">
            {posts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-surface">{p.cover && <Image src={p.cover} alt="" fill sizes="56px" className="object-cover" />}</span>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/blog/${p.id}`} className="font-medium hover:underline">{p.title}</Link>
                  <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <Pill tone={TONE[p.state]}>{p.state}</Pill>
                    {p.featured && <Pill tone="neutral">featured</Pill>}
                    {p.publishedAt && <span>{p.state === "scheduled" ? "Goes live" : p.state === "published" ? "Published" : "Date"} {dateOnly(p.publishedAt)}</span>}
                    <span>· edited {dateOnly(p.updatedAt)}</span>
                    {p.tags.length > 0 && <span>· {p.tags.join(", ")}</span>}
                  </p>
                </div>
                <BlogRowActions id={p.id} slug={p.slug} state={p.state} />
              </li>
            ))}
          </ul>
        )}
        <BlogSettings initial={site.blog} />
      </div>
    </>
  );
}
