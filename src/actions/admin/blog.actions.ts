"use server";

import { z } from "zod";
import { objectId } from "@/lib/validations";
import { blogPostInput, deletePost, savePost, setPostStatus } from "@/services/blog.service";
import { ownerAction } from "./_helpers";

const PATHS = ["/admin/blog", "/blog", "/"];

/** Admin → Blog: create or update a post (draft or published). */
export async function saveBlogPostAction(id: string | null, raw: unknown) {
  return ownerAction(z.object({ id: objectId.nullable(), input: blogPostInput }), { id, input: raw }, ({ id, input }) => savePost(id, input), PATHS);
}

/** Publish / unpublish from the list. */
export async function setBlogPostStatusAction(id: string, status: "DRAFT" | "PUBLISHED") {
  return ownerAction(z.object({ id: objectId, status: z.enum(["DRAFT", "PUBLISHED"]) }), { id, status }, ({ id, status }) => setPostStatus(id, status), PATHS);
}

export async function deleteBlogPostAction(id: string) {
  return ownerAction(z.object({ id: objectId }), { id }, ({ id }) => deletePost(id), PATHS);
}
