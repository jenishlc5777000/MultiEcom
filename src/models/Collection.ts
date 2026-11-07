import { Schema, type InferSchemaType, type Model } from "mongoose";
import { imageSchema, defineModel } from "./_shared";

/**
 * Curated groupings ("Monsoon Blues", "Gift Sets") independent of category.
 * Named ProductCollection in code to avoid clashing with Mongoose's Collection.
 */
const collectionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: String,
    image: imageSchema,
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "collections" },
);

collectionSchema.index({ slug: 1 }, { unique: true });

export type CollectionDoc = InferSchemaType<typeof collectionSchema>;
export const ProductCollection: Model<CollectionDoc> = defineModel<CollectionDoc>("ProductCollection", collectionSchema);
