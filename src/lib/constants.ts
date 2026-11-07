/**
 * Domain enums shared by models, validation and client components.
 * No imports here, so client bundles never pull in Mongoose.
 */
export const PRODUCT_TYPES = ["CERAMIC", "CRAFT"] as const;
export const PRODUCT_STATUS = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export const AVAILABILITY = ["READY_STOCK", "MADE_TO_ORDER", "SOLD"] as const;

export const ORDER_STATUS = [
  "PENDING_PAYMENT",
  "AWAITING_APPROVAL",
  "CONFIRMED",
  "IN_PRODUCTION",
  "DISPATCHED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;
export const PAYMENT_STATUS = ["PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"] as const;
export const REVIEW_STATUS = ["PENDING", "APPROVED", "REJECTED"] as const;
export const RETURN_STATUS = ["REQUESTED", "APPROVED", "REJECTED", "RECEIVED", "REFUNDED"] as const;
export const RETURN_REASONS = ["DAMAGED", "WRONG_ITEM", "NOT_AS_DESCRIBED", "OTHER"] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];
export type ProductStatus = (typeof PRODUCT_STATUS)[number];
export type Availability = (typeof AVAILABILITY)[number];
export type OrderStatus = (typeof ORDER_STATUS)[number];
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];
export type ReviewStatus = (typeof REVIEW_STATUS)[number];
export type ReturnStatus = (typeof RETURN_STATUS)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  AWAITING_APPROVAL: "Awaiting approval",
  CONFIRMED: "Confirmed",
  IN_PRODUCTION: "Being made",
  DISPATCHED: "Dispatched",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export const RETURN_REASON_LABEL: Record<(typeof RETURN_REASONS)[number], string> = {
  DAMAGED: "Arrived damaged",
  WRONG_ITEM: "Wrong item",
  NOT_AS_DESCRIBED: "Not as described",
  OTHER: "Other",
};
