import { Schema, type InferSchemaType, type Model, type Types } from "mongoose";
import { imageSchema, defineModel } from "./_shared";

import { AVAILABILITY, PRODUCT_STATUS, PRODUCT_TYPES } from "@/lib/constants";

export { AVAILABILITY, PRODUCT_STATUS, PRODUCT_TYPES };
export type { Availability, ProductStatus, ProductType } from "@/lib/constants";

/**
 * Variants are embedded: the product page needs all of them in one read, and
 * the positional operator lets one variant's stock be decremented atomically.
 */
const variantSchema = new Schema({
  glaze: { type: Schema.Types.ObjectId, ref: "Glaze", default: null },
  size: { type: Schema.Types.ObjectId, ref: "Size", default: null },
  sku: { type: String, required: true, trim: true, uppercase: true },
  price: { type: Number, required: true, min: 0 }, // paise
  compareAtPrice: { type: Number, min: 0 }, // paise
  stock: { type: Number, required: true, min: 0, default: 0 },
  images: {
    main: imageSchema,
    side: imageSchema,
    bottom: imageSchema,
  },
  isActive: { type: Boolean, default: true },
});

const productSchema = new Schema(
  {
    type: { type: String, enum: PRODUCT_TYPES, required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    status: { type: String, enum: PRODUCT_STATUS, default: "DRAFT" },
    availability: { type: String, enum: AVAILABILITY, default: "READY_STOCK" },
    leadTimeDays: { type: Number, min: 0 }, // for MADE_TO_ORDER
    isUnique: { type: Boolean, default: false }, // one-of-a-kind; flips to SOLD at 0 stock
    patternName: String,
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    collections: [{ type: Schema.Types.ObjectId, ref: "ProductCollection" }],
    images: [imageSchema],
    description: { type: String, default: "" },
    capacity: String, // "350 ml"
    dimensions: String, // "9 cm x 8 cm"
    care: String,
    kitContents: [String], // CRAFT kits
    variants: {
      type: [variantSchema],
      validate: [(v: unknown[]) => v.length > 0, "A product needs at least one variant"],
    },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    tags: [String],
    // Values for the category's own fields: { clay_body: "Stoneware", oven_safe: "yes" }.
    attributes: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ category: 1, status: 1, createdAt: -1 });
productSchema.index({ status: 1, availability: 1 });
productSchema.index({ collections: 1, status: 1 });
productSchema.index({ "variants.sku": 1 }, { unique: true });
productSchema.index(
  { name: "text", patternName: "text", tags: "text", description: "text" },
  { weights: { name: 10, patternName: 5, tags: 3, description: 1 } },
);

export type ProductDoc = InferSchemaType<typeof productSchema>;
export type VariantDoc = InferSchemaType<typeof variantSchema> & { _id: Types.ObjectId };
export const Product: Model<ProductDoc> = defineModel<ProductDoc>("Product", productSchema);
