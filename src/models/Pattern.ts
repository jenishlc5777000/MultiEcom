import { Schema, type InferSchemaType, type Model } from "mongoose";
import { defineModel } from "./_shared";

/**
 * A product pattern / style (e.g. Tapered, Round, Classic), managed in
 * Admin → Categories like colours and sizes. Products pick one (stored as
 * `patternName`) and category pages offer it as the Pattern filter.
 * Replaces the old "sub-subcategory per pattern" setup.
 */
const patternSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

patternSchema.index({ slug: 1 }, { unique: true });

export type PatternDoc = InferSchemaType<typeof patternSchema>;
export const Pattern: Model<PatternDoc> = defineModel<PatternDoc>("Pattern", patternSchema);
