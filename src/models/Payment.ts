import { Schema, type InferSchemaType, type Model } from "mongoose";
import { defineModel } from "./_shared";

export const PAYMENT_RECORD_STATUS = ["CREATED", "CAPTURED", "FAILED", "REFUNDED"] as const;

const paymentSchema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    provider: { type: String, required: true }, // "razorpay"
    providerOrderId: { type: String, required: true },
    providerPaymentId: String,
    amount: { type: Number, required: true }, // paise
    currency: { type: String, default: "INR" },
    status: { type: String, enum: PAYMENT_RECORD_STATUS, default: "CREATED" },
    method: String,
    failureReason: String,
    events: [{ name: String, at: { type: Date, default: Date.now }, _id: false }],
  },
  { timestamps: true },
);

paymentSchema.index({ provider: 1, providerOrderId: 1 }, { unique: true });
paymentSchema.index({ order: 1 });

export type PaymentDoc = InferSchemaType<typeof paymentSchema>;
export const Payment: Model<PaymentDoc> = defineModel<PaymentDoc>("Payment", paymentSchema);
