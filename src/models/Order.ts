import { Schema, type InferSchemaType, type Model } from "mongoose";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants";
import { addressSchema, defineModel } from "./_shared";

/**
 * PENDING_PAYMENT → (paid) AWAITING_APPROVAL → (owner approves) CONFIRMED
 *   → IN_PRODUCTION (optional, made-to-order) → DISPATCHED → DELIVERED
 * Owner rejection or cancellation → CANCELLED (stock released, refund recorded).
 * Allowed moves live in services/admin/order-admin.service.ts.
 */
export { ORDER_STATUS, PAYMENT_STATUS };
export type { OrderStatus, PaymentStatus } from "@/lib/constants";

/**
 * Snapshot of what was bought. Never re-read price or name from Product for an
 * existing order: later catalogue edits must not change past orders.
 */
const orderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  variant: { type: Schema.Types.ObjectId, required: true },
  productName: { type: String, required: true },
  productSlug: { type: String, required: true },
  productType: { type: String, required: true },
  availability: { type: String, required: true },
  sku: { type: String, required: true },
  glazeName: String,
  sizeLabel: String,
  imageUrl: String,
  unitPrice: { type: Number, required: true }, // paise
  qty: { type: Number, required: true, min: 1 },
  lineTotal: { type: Number, required: true }, // paise
  stockReserved: { type: Boolean, default: true }, // false for made-to-order lines
});

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    shippingAddress: { type: addressSchema, required: true },
    status: { type: String, enum: ORDER_STATUS, default: "PENDING_PAYMENT" },
    paymentStatus: { type: String, enum: PAYMENT_STATUS, default: "PENDING" },
    payment: { type: Schema.Types.ObjectId, ref: "Payment" },
    dispatch: {
      courier: String,
      trackingNumber: String,
      trackingUrl: String,
      dispatchedAt: Date,
      deliveredAt: Date,
    },
    stockReleased: { type: Boolean, default: false }, // set once reserved stock is put back
    notes: String,
    /** Owner decision on a paid order. */
    approval: {
      decision: { type: String, enum: ["APPROVED", "REJECTED"] },
      reason: String,
      decidedAt: Date,
      decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    refund: {
      status: { type: String, enum: ["PENDING", "PROCESSED", "FAILED"] },
      amount: Number, // paise
      providerRefundId: String,
      note: String,
      at: Date,
    },
    /** Audit trail shown on the admin order page and to the customer. */
    timeline: [
      {
        status: { type: String, enum: ORDER_STATUS },
        note: String,
        by: { type: String, enum: ["system", "customer", "owner"], default: "system" },
        internal: { type: Boolean, default: false }, // owner-only notes, never shown to customers
        at: { type: Date, default: Date.now },
        _id: false,
      },
    ],
  },
  { timestamps: true },
);

orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: 1 }); // sweeping expired unpaid orders

export type OrderDoc = InferSchemaType<typeof orderSchema>;
export const Order: Model<OrderDoc> = defineModel<OrderDoc>("Order", orderSchema);
