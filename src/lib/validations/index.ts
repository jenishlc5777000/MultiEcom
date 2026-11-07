import { z } from "zod";

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const addToCartSchema = z.object({
  productId: objectId,
  variantId: objectId,
  qty: z.coerce.number().int().min(1).max(20).default(1),
});

export const updateCartItemSchema = z.object({
  productId: objectId,
  variantId: objectId,
  qty: z.coerce.number().int().min(0).max(20), // 0 removes
});

export const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^(\+91)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  line1: z.string().trim().min(3).max(120),
  line2: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().min(2).max(60),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
});

export const checkoutSchema = z.object({ address: addressSchema });

export const verifyPaymentSchema = z.object({
  orderId: objectId,
  providerOrderId: z.string().min(1),
  providerPaymentId: z.string().min(1),
  signature: z.string().min(1),
});

export const otpRequestSchema = z.object({ email: z.string().trim().toLowerCase().email() });
export const otpVerifySchema = otpRequestSchema.extend({
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export const reviewSchema = z.object({
  productId: objectId,
  orderId: objectId,
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().max(2000).default(""),
});

export const messageSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email(),
  subject: z.string().trim().min(2).max(120),
  body: z.string().trim().min(5).max(5000),
  orderId: objectId.optional(),
});

export const searchSchema = z.object({
  q: z.string().trim().max(80).default(""),
  page: z.coerce.number().int().min(1).default(1),
});

export type AddressInput = z.infer<typeof addressSchema>;
