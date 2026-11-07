import { Schema, type InferSchemaType, type Model } from "mongoose";
import { imageSchema, defineModel } from "./_shared";

/**
 * Blog post (Admin → Blog). Visible on /blog only when status is PUBLISHED and
 * publishedAt is in the past (a future date = scheduled).
 */
const blogPostSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true },
    excerpt: { type: String, default: "" },
    /** Simple formatting: ## headings, - lists, **bold**, *italic*, [links](url), ![pictures](url). */
    body: { type: String, default: "" },
    cover: imageSchema,
    tags: { type: [String], default: [] },
    author: { type: String, default: "" },
    status: { type: String, enum: ["DRAFT", "PUBLISHED"], default: "DRAFT" },
    publishedAt: Date,
    featured: { type: Boolean, default: false },
    seoTitle: String,
    seoDescription: String,
  },
  { timestamps: true },
);

blogPostSchema.index({ slug: 1 }, { unique: true });
blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ tags: 1 });

export type BlogPostDoc = InferSchemaType<typeof blogPostSchema>;
export const BlogPost: Model<BlogPostDoc> = defineModel<BlogPostDoc>("BlogPost", blogPostSchema);
