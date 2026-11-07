import { z } from "zod";
import { AVAILABILITY, PRODUCT_STATUS, PRODUCT_TYPES } from "@/lib/constants";
import { attributesSchema, BUILTIN_KEYS, categoryFieldsSchema } from "@/lib/category-fields";
import { objectId } from "./index";

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only");
const optionalText = (max: number) => z.string().trim().max(max).optional().transform((v) => v || undefined);
const rupees = z.coerce.number().min(0, "Can't be negative").max(10_000_000);
const optionalId = z.union([objectId, z.literal(""), z.null()]).optional().transform((v) => v || null);

export const imageInput = z.object({
  url: z.string().min(1).max(1000),
  publicId: z.string().min(1).max(300),
  alt: z.string().trim().max(200).default(""),
});

/** Prices are entered in rupees in the form and stored as paise. */
export const variantInput = z.object({
  id: z.string().optional(), // existing embedded variant _id
  glaze: optionalId,
  size: optionalId,
  sku: z.string().trim().toUpperCase().min(2, "SKU required").max(40).regex(/^[A-Z0-9-]+$/, "Letters, numbers and hyphens"),
  price: rupees.refine((v) => v > 0, "Price must be more than 0"),
  compareAtPrice: z.union([rupees, z.literal("")]).optional().transform((v) => (v === "" || v === undefined || v === 0 ? undefined : v)),
  stock: z.coerce.number().int().min(0).max(100000),
  isActive: z.boolean().default(true),
  image: imageInput.nullable().optional(),
  fields: categoryFieldsSchema,
  hideFields: z.array(z.enum(BUILTIN_KEYS)).max(BUILTIN_KEYS.length).default([]),
});

export const productInput = z
  .object({
    name: z.string().trim().min(2, "Name required").max(120),
    slug,
    type: z.enum(PRODUCT_TYPES),
    status: z.enum(PRODUCT_STATUS),
    availability: z.enum(AVAILABILITY),
    category: objectId,
    isUnique: z.boolean().default(false),
    leadTimeDays: z.union([z.coerce.number().int().min(1).max(365), z.literal("")]).optional().transform((v) => (v === "" ? undefined : v)),
    patternName: optionalText(80),
    description: z.string().trim().max(5000).default(""),
    capacity: optionalText(60),
    dimensions: optionalText(80),
    care: optionalText(1000),
    kitContents: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
    images: z.array(imageInput).max(12).default([]),
    variants: z.array(variantInput).min(1, "Add at least one variant").max(60),
    attributes: attributesSchema,
  })
  .superRefine((p, ctx) => {
    const skus = p.variants.map((v) => v.sku);
    if (new Set(skus).size !== skus.length) ctx.addIssue({ code: "custom", path: ["variants"], message: "Each variant needs a different SKU" });
    const combos = p.variants.map((v) => `${v.glaze ?? ""}|${v.size ?? ""}`);
    if (new Set(combos).size !== combos.length) ctx.addIssue({ code: "custom", path: ["variants"], message: "Two variants have the same glaze and size" });
    if (p.availability === "MADE_TO_ORDER" && !p.leadTimeDays) ctx.addIssue({ code: "custom", path: ["leadTimeDays"], message: "Made-to-order pieces need a lead time" });
    if (p.isUnique && (p.variants.length !== 1 || (p.variants[0]?.stock ?? 0) > 1))
      ctx.addIssue({ code: "custom", path: ["isUnique"], message: "One-of-a-kind pieces have a single variant with stock 0 or 1" });
  });
export type ProductInput = z.infer<typeof productInput>;

export const categoryInput = z.object({
  name: z.string().trim().min(2).max(60),
  slug,
  description: optionalText(500),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
  image: imageInput.nullable().optional(),
  /** Parent category id for a subcategory; empty/null = top-level category. */
  parent: z.union([objectId, z.literal(""), z.null()]).optional().transform((v) => v || null),
  productsInChildrenOnly: z.boolean().default(false),
  options: z
    .object({
      glazeLabel: z.string().trim().max(30).default(""),
      sizeLabel: z.string().trim().max(30).default(""),
      glazeStyle: z.enum(["", "photo", "color", "chips"]).default(""),
      allowedGlazes: z.array(objectId).max(100).default([]),
      allowedSizes: z.array(objectId).max(100).default([]),
    })
    .default({}),
});

export const glazeInput = z.object({
  name: z.string().trim().min(2).max(40),
  slug,
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #9DBFA9"),
  finish: z.enum(["glossy", "matte", "satin", "raw"]),
});

export const sizeInput = z.object({
  label: z.string().trim().min(1).max(30),
  slug,
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const orderActionInput = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve"), note: optionalText(500) }),
  z.object({ action: z.literal("reject"), reason: z.string().trim().min(3, "Give the customer a reason").max(500) }),
  z.object({ action: z.literal("start_production"), note: optionalText(500) }),
  z.object({
    action: z.literal("dispatch"),
    courier: z.string().trim().min(2).max(60),
    trackingNumber: z.string().trim().min(3).max(60),
    trackingUrl: z.union([z.string().trim().url(), z.literal("")]).optional().transform((v) => v || undefined),
  }),
  z.object({ action: z.literal("ship_stage"), stageId: z.string().trim().regex(/^[a-z0-9-]{1,30}$/), note: optionalText(300) }),
  z.object({ action: z.literal("deliver") }),
  z.object({ action: z.literal("cancel"), reason: z.string().trim().min(3).max(500) }),
  z.object({ action: z.literal("note"), note: z.string().trim().min(1).max(1000) }),
]);
export type OrderActionInput = z.infer<typeof orderActionInput>;

export const reviewDecisionInput = z.object({
  reviewId: objectId,
  decision: z.enum(["APPROVED", "REJECTED", "PENDING"]),
  reason: optionalText(300),
});

export const reviewReplyInput = z.object({ reviewId: objectId, text: z.string().trim().max(1000) });

export const returnDecisionInput = z.object({
  returnId: objectId,
  status: z.enum(["APPROVED", "REJECTED", "RECEIVED", "REFUNDED"]),
  ownerNote: optionalText(500),
  refundAmount: z.union([rupees, z.literal("")]).optional().transform((v) => (v === "" ? undefined : v)),
});

export const userRoleInput = z.object({ userId: objectId, role: z.enum(["customer", "owner"]) });
export const userBlockInput = z.object({ userId: objectId, blocked: z.boolean(), reason: optionalText(300) });

export const settingsInput = z.object({
  shippingFlatFee: rupees,
  freeShippingThreshold: rupees,
  returnWindowDays: z.coerce.number().int().min(0).max(90),
  unpaidOrderTtlMinutes: z.coerce.number().int().min(5).max(1440),
  announcement: optionalText(160),
  contactEmail: z.union([z.string().trim().email(), z.literal("")]).optional().transform((v) => v || undefined),
  contactPhone: optionalText(20),
  instagram: z.union([z.string().trim().url(), z.literal("")]).optional().transform((v) => v || undefined),
});
