import { Schema, type InferSchemaType, type Model } from "mongoose";
import { imageSchema, defineModel } from "./_shared";

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: String,
    image: imageSchema,
    parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    sortOrder: { type: Number, default: 0 },
    /** With sub-subcategories (e.g. Mugs → Tapered/Round): list products only after one is chosen. */
    productsInChildrenOnly: { type: Boolean, default: false },
    /** Product options for products in this category (empty = inherit from the parent category). */
    options: {
      glazeLabel: { type: String, default: "" },
      sizeLabel: { type: String, default: "" },
      glazeStyle: { type: String, enum: ["", "photo", "color", "chips"], default: "" },
      allowedGlazes: [{ type: Schema.Types.ObjectId, ref: "Glaze" }],
      allowedSizes: [{ type: Schema.Types.ObjectId, ref: "Size" }],
    },
    isActive: { type: Boolean, default: true },
    // Extra product-form inputs for this category (see src/lib/category-fields.ts).
    fields: { type: Schema.Types.Mixed, default: [] },
    // Built-in product inputs hidden for this category, e.g. ["capacity", "glaze"].
    hideFields: { type: [String], default: [] },
  },
  { timestamps: true },
);

categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parent: 1, sortOrder: 1 });

export type CategoryDoc = InferSchemaType<typeof categorySchema>;
export const Category: Model<CategoryDoc> = defineModel<CategoryDoc>("Category", categorySchema);
