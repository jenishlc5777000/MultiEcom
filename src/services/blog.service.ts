import "server-only";
import { Types } from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import { sharedCache } from "@/lib/data-cache";
import { DomainError } from "@/lib/errors";
import { BlogPost } from "@/models";

export class BlogError extends DomainError {}

const imageInput = z.object({ url: z.string().max(500), publicId: z.string().max(300), alt: z.string().max(200).default("") });

export const blogPostInput = z.object({
  title: z.string().trim().min(3, "Give the post a title").max(140),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "The web address uses lowercase letters, numbers and dashes")
    .or(z.literal("")),
  excerpt: z.string().trim().max(300).default(""),
  body: z.string().max(50_000).default(""),
  cover: imageInput.nullable().default(null),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
  author: z.string().trim().max(60).default(""),
  /** draft = hidden; publish = live now (or at publishedAt when that is in the future). */
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishedAt: z.union([z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Pick a valid date"), z.literal("")]).default(""),
  featured: z.boolean().default(false),
  seoTitle: z.string().trim().max(70).default(""),
  seoDescription: z.string().trim().max(170).default(""),
});
export type BlogPostInput = z.infer<typeof blogPostInput>;

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100) || "post";

export type BlogCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover: { url: string; alt: string } | null;
  tags: string[];
  author: string;
  publishedAt: string;
  featured: boolean;
  words: number;
};

type Lean = {
  _id: Types.ObjectId;
  slug: string;
  title: string;
  excerpt?: string;
  body?: string;
  cover?: { url: string; alt?: string | null } | null;
  tags?: string[];
  author?: string;
  publishedAt?: Date | null;
  featured?: boolean;
  status: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  updatedAt?: Date;
};

const toCard = (p: Lean): BlogCard => ({
  id: String(p._id),
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt || (p.body ?? "").replace(/[#>*_[\]()!-]/g, "").replace(/\s+/g, " ").trim().slice(0, 180),
  cover: p.cover?.url ? { url: p.cover.url, alt: p.cover.alt ?? "" } : null,
  tags: p.tags ?? [],
  author: p.author ?? "",
  publishedAt: (p.publishedAt ?? new Date()).toISOString(),
  featured: Boolean(p.featured),
  words: (p.body ?? "").split(/\s+/).filter(Boolean).length,
});

const live = () => ({ status: "PUBLISHED", publishedAt: { $lte: new Date() } });

/* ───────────── Public ───────────── */

export const listPublishedPosts = sharedCache(
  async (page: number, perPage: number, tag: string) => {
    await connectDB();
    const filter = { ...live(), ...(tag ? { tags: tag } : {}) };
    const [rows, total, tags] = await Promise.all([
      BlogPost.find(filter).select("-body").sort({ featured: -1, publishedAt: -1 }).skip((page - 1) * perPage).limit(perPage).lean<Lean[]>(),
      BlogPost.countDocuments(filter),
      BlogPost.distinct("tags", live()),
    ]);
    // Words are needed for reading time; fetch only the counts.
    const bodies = await BlogPost.find({ _id: { $in: rows.map((r) => r._id) } }).select("body").lean<{ _id: Types.ObjectId; body?: string }[]>();
    const words = new Map(bodies.map((b) => [String(b._id), b.body ?? ""]));
    return {
      posts: rows.map((r) => toCard({ ...r, body: words.get(String(r._id)) })),
      total,
      pages: Math.max(1, Math.ceil(total / perPage)),
      tags: (tags as string[]).sort(),
    };
  },
  "blog-list",
  "catalog",
);

export async function getPostBySlug(slug: string, allowDraft = false) {
  await connectDB();
  const p = await BlogPost.findOne(allowDraft ? { slug } : { slug, ...live() }).lean<Lean>();
  if (!p) return null;
  const related = await BlogPost.find({ ...live(), _id: { $ne: p._id }, ...(p.tags?.length ? { tags: { $in: p.tags } } : {}) })
    .select("slug title excerpt cover tags author publishedAt featured body")
    .sort({ publishedAt: -1 })
    .limit(3)
    .lean<Lean[]>();
  const isLive = p.status === "PUBLISHED" && Boolean(p.publishedAt) && p.publishedAt! <= new Date();
  return { ...toCard(p), body: p.body ?? "", seoTitle: p.seoTitle ?? "", seoDescription: p.seoDescription ?? "", isLive, status: p.status, related: related.map(toCard) };
}

/** Whether any post is live (the footer link only shows when there is something to read). */
export const hasPublishedPosts = sharedCache(
  async () => {
    await connectDB();
    return Boolean(await BlogPost.exists(live()));
  },
  "blog-has-posts",
  "catalog",
);

/* ───────────── Admin ───────────── */

export async function listPostsAdmin() {
  await connectDB();
  const rows = await BlogPost.find().select("title slug status publishedAt updatedAt featured cover tags").sort({ updatedAt: -1 }).limit(500).lean<Lean[]>();
  const now = new Date();
  return rows.map((r) => ({
    id: String(r._id),
    title: r.title,
    slug: r.slug,
    featured: Boolean(r.featured),
    cover: r.cover?.url ?? "",
    tags: r.tags ?? [],
    state: r.status !== "PUBLISHED" ? ("draft" as const) : r.publishedAt && r.publishedAt > now ? ("scheduled" as const) : ("published" as const),
    publishedAt: r.publishedAt?.toISOString() ?? "",
    updatedAt: (r.updatedAt ?? now).toISOString(),
  }));
}

export async function getPostForEdit(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectDB();
  const p = await BlogPost.findById(id).lean<Lean>();
  if (!p) return null;
  return {
    id: String(p._id),
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt ?? "",
    body: p.body ?? "",
    cover: p.cover?.url ? { url: p.cover.url, publicId: (p.cover as { publicId?: string }).publicId ?? "", alt: p.cover.alt ?? "" } : null,
    tags: p.tags ?? [],
    author: p.author ?? "",
    status: p.status as "DRAFT" | "PUBLISHED",
    publishedAt: p.publishedAt?.toISOString() ?? "",
    featured: Boolean(p.featured),
    seoTitle: p.seoTitle ?? "",
    seoDescription: p.seoDescription ?? "",
  };
}
export type PostForEdit = NonNullable<Awaited<ReturnType<typeof getPostForEdit>>>;

export async function savePost(id: string | null, input: BlogPostInput) {
  await connectDB();
  const slug = input.slug || slugify(input.title);
  const clash = await BlogPost.exists({ slug, ...(id ? { _id: { $ne: id } } : {}) });
  if (clash) throw new BlogError(`Another post already uses the address /blog/${slug}. Change the web address.`);
  const existing = id ? await BlogPost.findById(id).select("publishedAt status").lean<{ publishedAt?: Date | null; status: string }>() : null;
  if (id && !existing) throw new BlogError("Post not found.");
  // Publishing without a date = now (keeps the original date when re-saving a published post).
  const publishedAt =
    input.status === "PUBLISHED" ? (input.publishedAt ? new Date(input.publishedAt) : existing?.publishedAt ?? new Date()) : input.publishedAt ? new Date(input.publishedAt) : null;
  const doc = { ...input, slug, tags: [...new Set(input.tags.map((t) => t.toLowerCase()))], publishedAt, cover: input.cover ?? undefined };
  if (id) {
    await BlogPost.updateOne({ _id: id }, { $set: doc, ...(input.cover ? {} : { $unset: { cover: 1 } }) });
    return { id, slug };
  }
  const created = await BlogPost.create(doc);
  return { id: String(created._id), slug };
}

export async function setPostStatus(id: string, status: "DRAFT" | "PUBLISHED") {
  await connectDB();
  const p = await BlogPost.findById(id).select("publishedAt").lean<{ publishedAt?: Date | null }>();
  if (!p) throw new BlogError("Post not found.");
  await BlogPost.updateOne({ _id: id }, { $set: { status, ...(status === "PUBLISHED" && !p.publishedAt ? { publishedAt: new Date() } : {}) } });
}

export async function deletePost(id: string) {
  await connectDB();
  await BlogPost.deleteOne({ _id: id });
}
