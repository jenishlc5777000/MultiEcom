import { Schema, type InferSchemaType, type Model } from "mongoose";
import { RETURN_REASONS, RETURN_STATUS } from "@/lib/constants";
import { imageSchema, defineModel } from "./_shared";

const returnRequestSchema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        orderItem: { type: Schema.Types.ObjectId, required: true },
        qty: { type: Number, min: 1, required: true },
        _id: false,
      },
    ],
    reason: {
      type: String,
      enum: RETURN_REASONS,
      required: true,
    },
    details: String,
    photos: [imageSchema],
    status: {
      type: String,
      enum: RETURN_STATUS,
      default: "REQUESTED",
    },
    ownerNote: String,
    refundAmount: Number, // paise
  },
  { timestamps: true },
);

returnRequestSchema.index({ order: 1 });
returnRequestSchema.index({ status: 1, createdAt: -1 });

export type ReturnRequestDoc = InferSchemaType<typeof returnRequestSchema>;
export const ReturnRequest: Model<ReturnRequestDoc> = defineModel<ReturnRequestDoc>("ReturnRequest", returnRequestSchema);
