import "server-only";
import { connectDB } from "@/lib/db/connect";
import type { ThemeId } from "@/config/themes";
import type { StoreSettings } from "@/lib/theme-file";
import { Setting } from "@/models";

export async function getSettingsForEdit() {
  await connectDB();
  const s = await Setting.findOne({ key: "store" }).lean();
  return {
    shippingFlatFee: (s?.shippingFlatFee ?? 0) / 100,
    freeShippingThreshold: (s?.freeShippingThreshold ?? 0) / 100,
    returnWindowDays: s?.returnWindowDays ?? 7,
    unpaidOrderTtlMinutes: s?.unpaidOrderTtlMinutes ?? 30,
    announcement: s?.announcement ?? "",
    contactEmail: s?.contactEmail ?? "",
    contactPhone: s?.contactPhone ?? "",
    instagram: s?.instagram ?? "",
  };
}

export async function saveSettings(input: {
  shippingFlatFee: number;
  freeShippingThreshold: number;
  returnWindowDays: number;
  unpaidOrderTtlMinutes: number;
  announcement?: string;
  contactEmail?: string;
  contactPhone?: string;
  instagram?: string;
}) {
  await connectDB();
  await Setting.updateOne(
    { key: "store" },
    {
      $set: {
        shippingFlatFee: Math.round(input.shippingFlatFee * 100),
        freeShippingThreshold: Math.round(input.freeShippingThreshold * 100),
        returnWindowDays: input.returnWindowDays,
        unpaidOrderTtlMinutes: input.unpaidOrderTtlMinutes,
        announcement: input.announcement ?? "",
        contactEmail: input.contactEmail ?? "",
        contactPhone: input.contactPhone ?? "",
        instagram: input.instagram ?? "",
      },
    },
    { upsert: true },
  );
}

/** Switch the storefront theme only (used by theme import). */
export async function setStoreTheme(theme: ThemeId) {
  await connectDB();
  await Setting.updateOne({ key: "store" }, { $set: { theme }, $unset: { "siteDraft.theme": 1 } }, { upsert: true });
}

/** Store settings from a full export (already validated; money in paise). */
export async function importStoreSettings(store: StoreSettings) {
  await connectDB();
  await Setting.updateOne({ key: "store" }, { $set: store }, { upsert: true });
}
