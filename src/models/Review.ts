import { Schema, type InferSchemaType, type Model } from "mongoose";
import { REVIEW_STATUS } from "@/lib/constants";
import { imageSchema, defineModel } from "./_shared";

export { REVIEW_STATUS };
export type { ReviewStatus } from "@/lib/constants";

const reviewSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true }, // verified purchase
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, maxlength: 2000, default: "" },
    images: [imageSchema],
    /** New reviews wait for the owner; only APPROVED ones are public and counted in ratings. */
    status: { type: String, enum: REVIEW_STATUS, default: "PENDING" },
    hideReason: String, // owner's note when rejecting
    ownerReply: { text: String, repliedAt: Date },
  },
  { timestamps: true },
);

reviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, productId: 1, orderId: 1 }, { unique: true });

export type ReviewDoc = InferSchemaType<typeof reviewSchema>;
export const Review: Model<ReviewDoc> = defineModel<ReviewDoc>("Review", reviewSchema);
