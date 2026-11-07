"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { deleteBlogPostAction, saveBlogPostAction, setBlogPostStatusAction } from "@/actions/admin/blog.actions";
import { PostBody } from "@/components/blog/post-body";
import { Button } from "@/components/ui/button";
import type { SiteConfig } from "@/lib/site-config";
import type { PostForEdit } from "@/services/blog.service";
import { Choice, Panel, RangeField, SaveBar, SwitchRow, useSection } from "./appearance/shared";
import { Field, FormMessage, TextArea, TextInput } from "./form";
import { ImageUploader } from "./image-uploader";
import { Pill } from "./ui";

/* ───────────── List row actions ───────────── */

export function BlogRowActions({ id, slug, state }: { id: string; slug: string; state: "draft" | "published" | "scheduled" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) setErr(r.error ?? "Something went wrong.");
      else router.refresh();
    });
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button asChild size="sm" variant="quiet"><Link href={`/blog/${slug}`} target="_blank">{state === "published" ? "View" : "Preview"}</Link></Button>
      <Button asChild size="sm" variant="secondary"><Link href={`/admin/blog/${id}`}>Edit</Link></Button>
      {state === "draft" ? (
        <Button size="sm" disabled={pending} onClick={() => run(() => setBlogPostStatusAction(id, "PUBLISHED"))}>Publish</Button>
      ) : (
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => setBlogPostStatusAction(id, "DRAFT"))}>Unpublish</Button>
      )}
      <Button size="sm" variant="quiet" disabled={pending} onClick={() => confirm("Delete this post for good?") && run(() => deleteBlogPostAction(id))}>Delete</Button>
      {err && <span role="alert" className="text-xs text-danger">{err}</span>}
    </div>
  );
}

/* ───────────── Blog settings (site config section "blog") ───────────── */

export function BlogSettings({ initial }: { initial: SiteConfig["blog"] }) {
  const s = useSection("blog", initial);
  const v = s.v;
  return (
    <Panel title="Blog settings" description="The /blog page and where it is linked.">
      <div className="grid gap-2 sm:grid-cols-3">
        <SwitchRow label="Blog is on" hint="Off: /blog is hidden" checked={v.enabled} onChange={(x) => s.set("enabled", x)} />
        <SwitchRow label="Link in the footer" hint="Shown once a post is published" checked={v.showInFooter} onChange={(x) => s.set("showInFooter", x)} />
        <SwitchRow label="Link in the header menu" checked={v.showInNav} onChange={(x) => s.set("showInNav", x)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Page title" htmlFor="bt"><TextInput id="bt" maxLength={60} value={v.title} onChange={(e) => s.set("title", e.target.value)} /></Field>
        <Field label="Link label (footer / menu)" htmlFor="bl"><TextInput id="bl" maxLength={40} value={v.footerLabel} onChange={(e) => s.set("footerLabel", e.target.value)} /></Field>
        <Field label="Intro text" htmlFor="bi" className="sm:col-span-2"><TextArea id="bi" maxLength={300} rows={2} value={v.intro} onChange={(e) => s.set("intro", e.target.value)} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Choice label="Layout" value={v.layout} onChange={(x) => s.set("layout", x)} columns={2} options={[{ value: "grid", label: "Grid", hint: "Cards in columns" }, { value: "list", label: "List", hint: "One wide row per post" }]} />
        <RangeField label="Posts per page" value={v.perPage} min={3} max={24} unit="" onChange={(x) => s.set("perPage", x)} />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <SwitchRow label="Show date" checked={v.showDate} onChange={(x) => s.set("showDate", x)} />
        <SwitchRow label="Show author" checked={v.showAuthor} onChange={(x) => s.set("showAuthor", x)} />
        <SwitchRow label="Show reading time" checked={v.showReadingTime} onChange={(x) => s.set("showReadingTime", x)} />
      </div>
      <SaveBar {...s} label="Save blog settings" />
    </Panel>
  );
}

/* ───────────── Post editor ───────────── */

const EMPTY: Omit<PostForEdit, "id"> = { title: "", slug: "", excerpt: "", body: "", cover: null, tags: [], author: "", status: "DRAFT", publishedAt: "", featured: false, seoTitle: "", seoDescription: "" };
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
/** ISO → value for <input type="datetime-local"> in the browser's time zone. */
const toLocal = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export function BlogEditor({ post, defaultAuthor }: { post: PostForEdit | null; defaultAuthor: string }) {
  const router = useRouter();
  const [v, setV] = useState(() => (post ? { ...post, publishedAt: toLocal(post.publishedAt) } : { ...EMPTY, author: defaultAuthor }));
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [tagText, setTagText] = useState((post?.tags ?? []).join(", "));
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const set = <K extends keyof typeof v>(k: K, x: (typeof v)[K]) => setV((s) => ({ ...s, [k]: x }));
  const words = useMemo(() => v.body.split(/\s+/).filter(Boolean).length, [v.body]);
  const scheduled = v.status === "PUBLISHED" && v.publishedAt && new Date(v.publishedAt) > new Date();

  /** Insert formatting at the cursor in the body. */
  const insert = (before: string, after = "", placeholder = "") => {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    const sel = value.slice(a, b) || placeholder;
    const next = value.slice(0, a) + before + sel + after + value.slice(b);
    set("body", next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + before.length, a + before.length + sel.length);
    });
  };

  const save = (status: "DRAFT" | "PUBLISHED") =>
    start(async () => {
      setMsg(null);
      const input = {
        ...v,
        status,
        slug: v.slug || slugify(v.title),
        tags: tagText.split(",").map((t) => t.trim()).filter(Boolean),
        publishedAt: v.publishedAt ? new Date(v.publishedAt).toISOString() : "",
      };
      const r = await saveBlogPostAction(post?.id ?? null, input);
      if (!r.ok) return setMsg({ ok: false, message: r.error });
      setV((s) => ({ ...s, status, slug: r.data.slug }));
      setMsg({ ok: true, message: status === "DRAFT" ? "Saved as a draft." : scheduled ? "Scheduled." : "Published." });
      if (!post) router.replace(`/admin/blog/${r.data.id}`);
      else router.refresh();
    });

  const tool = "rounded-md border border-line px-2.5 py-1 text-xs hover:bg-surface";
  return (
    <div className="grid gap-6 pb-24 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <Field label="Title" htmlFor="pt">
          <TextInput id="pt" maxLength={140} value={v.title} className="text-lg" onChange={(e) => { set("title", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} />
        </Field>
        <Field label="Web address" htmlFor="ps" hint={`/blog/${v.slug || slugify(v.title) || "…"}`}>
          <TextInput id="ps" maxLength={100} value={v.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} />
        </Field>
        <Field label="Short summary" htmlFor="pe" hint="Shown on the blog list and in search results">
          <TextArea id="pe" maxLength={300} rows={2} value={v.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
        </Field>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">Post</span>
            <span className="flex gap-1" role="tablist">
              {(["write", "preview"] as const).map((t) => (
                <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-pill px-3 py-1 text-xs capitalize ${tab === t ? "bg-ink text-canvas" : "hover:bg-surface"}`}>{t}</button>
              ))}
            </span>
          </div>
          {tab === "write" ? (
            <>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" className={tool} onClick={() => insert("\n## ", "\n", "Heading")}>Heading</button>
                <button type="button" className={tool} onClick={() => insert("**", "**", "bold")}><b>B</b></button>
                <button type="button" className={tool} onClick={() => insert("*", "*", "italic")}><i>I</i></button>
                <button type="button" className={tool} onClick={() => insert("[", "](https://)", "link text")}>Link</button>
                <button type="button" className={tool} onClick={() => insert("\n- ", "", "List item")}>List</button>
                <button type="button" className={tool} onClick={() => insert("\n> ", "\n", "Quote")}>Quote</button>
              </div>
              <TextArea ref={bodyRef} id="pb" aria-label="Post text" value={v.body} onChange={(e) => set("body", e.target.value)} className="min-h-[420px] font-mono text-sm leading-relaxed" placeholder={"Write your post…\n\n## A heading\nA paragraph. Leave an empty line between paragraphs.\n\n- A list item\n\n![Picture description](picture address)"} />
              <p className="text-xs text-muted">{words} words · about {Math.max(1, Math.round(words / 200))} min read. Formatting: ## heading, **bold**, *italic*, - list, &gt; quote, [link](https://…), ![picture](address).</p>
              <InsertPicture slug={v.slug || slugify(v.title)} onInsert={(url) => insert(`\n![`, `](${url})\n`, "Picture description")} />
            </>
          ) : (
            <div className="min-h-[420px] rounded-md border border-line bg-paper p-6">{v.body ? <PostBody body={v.body} /> : <p className="text-muted">Nothing written yet.</p>}</div>
          )}
        </div>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-4 lg:self-start">
        <Panel title="Publish">
          <p className="flex items-center gap-2 text-sm">
            Status: {v.status === "DRAFT" ? <Pill tone="muted">Draft</Pill> : scheduled ? <Pill tone="warn">Scheduled</Pill> : <Pill tone="good">Published</Pill>}
          </p>
          <Field label="Publish date" htmlFor="pd" hint="Empty = now. A future date schedules the post.">
            <TextInput id="pd" type="datetime-local" value={v.publishedAt} onChange={(e) => set("publishedAt", e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.featured} onChange={(e) => set("featured", e.target.checked)} /> Feature at the top of the blog</label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={pending || !v.title.trim()} onClick={() => save("PUBLISHED")}>{pending ? "Saving…" : v.status === "PUBLISHED" ? "Update" : scheduled ? "Schedule" : "Publish"}</Button>
            <Button type="button" variant="secondary" disabled={pending || !v.title.trim()} onClick={() => save("DRAFT")}>{v.status === "PUBLISHED" ? "Unpublish (draft)" : "Save draft"}</Button>
          </div>
          {post && <Link href={`/blog/${v.slug}`} target="_blank" className="block text-sm underline">Open {v.status === "PUBLISHED" && !scheduled ? "post" : "preview"} ↗</Link>}
          <FormMessage result={msg} />
        </Panel>

        <Panel title="Cover picture">
          <ImageUploader folder="blog" path={[v.slug || slugify(v.title) || "new-post", "cover"]} max={1} label="Cover" value={v.cover ? [v.cover] : []} onChange={(imgs) => set("cover", imgs[0] ?? null)} />
        </Panel>

        <Panel title="Details">
          <Field label="Author" htmlFor="pa"><TextInput id="pa" maxLength={60} value={v.author} onChange={(e) => set("author", e.target.value)} /></Field>
          <Field label="Topics" htmlFor="ptg" hint="Comma-separated, e.g. glazes, care tips"><TextInput id="ptg" value={tagText} onChange={(e) => setTagText(e.target.value)} /></Field>
          <Field label="Search title (optional)" htmlFor="pst" hint={`${v.seoTitle.length}/70`}><TextInput id="pst" maxLength={70} value={v.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} /></Field>
          <Field label="Search description (optional)" htmlFor="psd" hint={`${v.seoDescription.length}/170`}><TextArea id="psd" rows={2} maxLength={170} value={v.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} /></Field>
        </Panel>
      </aside>
    </div>
  );
}

/** Upload a picture and drop it into the post. */
function InsertPicture({ onInsert, slug }: { onInsert: (url: string) => void; slug: string }) {
  const [imgs, setImgs] = useState<{ url: string; publicId: string; alt: string }[]>([]);
  return (
    <details className="rounded-md border border-line p-3">
      <summary className="cursor-pointer text-sm font-medium">Add a picture to the post</summary>
      <div className="mt-3 space-y-3">
        <ImageUploader folder="blog" path={[slug || "new-post"]} max={8} label="Upload, then click Insert" value={imgs} onChange={setImgs} />
        {imgs.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {imgs.map((i) => (
              <button key={i.url} type="button" onClick={() => onInsert(i.url)} className="flex items-center gap-2 rounded-md border border-line p-1.5 pr-3 text-xs hover:bg-surface">
                <span className="relative size-10 overflow-hidden rounded-sm bg-surface"><Image src={i.url} alt="" fill sizes="40px" className="object-cover" /></span>
                Insert
              </button>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
