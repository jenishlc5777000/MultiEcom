import { Schema, type InferSchemaType, type Model } from "mongoose";
import { defineModel } from "./_shared";

/** Singleton store settings document (key = "store"). Money in paise. */
const settingSchema = new Schema(
  {
    key: { type: String, required: true, default: "store" },
    shippingFlatFee: { type: Number, default: 0 },
    freeShippingThreshold: { type: Number, default: 0 }, // 0 = disabled
    unpaidOrderTtlMinutes: { type: Number, default: 30 },
    returnWindowDays: { type: Number, default: 7 },
    contactEmail: String,
    contactPhone: String,
    instagram: String,
    announcement: String,
    theme: { type: String, default: "stone" }, // storefront colour theme, see src/config/themes.ts
    // Admin → Studio (validated by src/lib/site-config.ts) and Admin → Integrations
    // (secret fields encrypted, see src/lib/secrets.ts).
    site: { type: Schema.Types.Mixed, default: {} },
    integrations: { type: Schema.Types.Mixed, default: {} },
    // Unsaved dashboard changes, shown only to the owner in preview mode.
    siteDraft: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

settingSchema.index({ key: 1 }, { unique: true });

export type SettingDoc = InferSchemaType<typeof settingSchema>;
export const Setting: Model<SettingDoc> = defineModel<SettingDoc>("Setting", settingSchema);
