import { Schema, type InferSchemaType, type Model } from "mongoose";
import { imageSchema, defineModel } from "./_shared";

const homepageBannerSchema = new Schema(
  {
    title: { type: String, required: true },
    subtitle: String,
    ctaLabel: String,
    ctaHref: String,
    image: { type: imageSchema, required: true },
    mobileImage: imageSchema,
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startsAt: Date,
    endsAt: Date,
  },
  { timestamps: true },
);

homepageBannerSchema.index({ isActive: 1, sortOrder: 1 });

export type HomepageBannerDoc = InferSchemaType<typeof homepageBannerSchema>;
export const HomepageBanner: Model<HomepageBannerDoc> = defineModel<HomepageBannerDoc>("HomepageBanner", homepageBannerSchema);
