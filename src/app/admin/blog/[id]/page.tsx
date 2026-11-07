import { notFound } from "next/navigation";
import { BlogEditor } from "@/components/admin/blog-admin";
import { PageHeader } from "@/components/admin/ui";
import { getCurrentUser } from "@/lib/auth/guards";
import { getPostForEdit } from "@/services/blog.service";

export const metadata = { title: "Blog post" };

/** /admin/blog/new or /admin/blog/<id>. */
export default async function BlogPostEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const post = isNew ? null : await getPostForEdit(id);
  if (!isNew && !post) notFound();
  const user = await getCurrentUser();
  return (
    <>
      <PageHeader back={{ href: "/admin/blog", label: "Blog" }} title={isNew ? "New post" : post!.title} />
      <BlogEditor post={post} defaultAuthor={user?.name ?? ""} />
    </>
  );
}
