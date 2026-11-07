import { Schema, type InferSchemaType, type Model } from "mongoose";
import { imageSchema, defineModel } from "./_shared";

const glazeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    hex: { type: String, match: /^#[0-9a-fA-F]{6}$/ }, // swatch colour
    swatch: imageSchema,
    finish: { type: String, enum: ["glossy", "matte", "satin", "raw"], default: "glossy" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

glazeSchema.index({ slug: 1 }, { unique: true });

export type GlazeDoc = InferSchemaType<typeof glazeSchema>;
export const Glaze: Model<GlazeDoc> = defineModel<GlazeDoc>("Glaze", glazeSchema);
