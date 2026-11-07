import { Schema, type InferSchemaType, type Model } from "mongoose";
import { defineModel } from "./_shared";

const sizeSchema = new Schema(
  {
    label: { type: String, required: true }, // "Small", "250 ml"
    slug: { type: String, required: true, lowercase: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

sizeSchema.index({ slug: 1 }, { unique: true });

export type SizeDoc = InferSchemaType<typeof sizeSchema>;
export const Size: Model<SizeDoc> = defineModel<SizeDoc>("Size", sizeSchema);
