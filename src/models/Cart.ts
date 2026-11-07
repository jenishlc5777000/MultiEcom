import { Schema, type InferSchemaType, type Model } from "mongoose";
import { defineModel } from "./_shared";

const cartItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variant: { type: Schema.Types.ObjectId, required: true }, // embedded variant _id
    qty: { type: Number, required: true, min: 1, max: 20 },
  },
  { _id: false },
);

/** One cart per signed-in user, or per guest cookie id. */
const cartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    guestId: { type: String },
    items: [cartItemSchema],
  },
  { timestamps: true },
);

cartSchema.index({ user: 1 }, { unique: true, partialFilterExpression: { user: { $type: "objectId" } } });
cartSchema.index({ guestId: 1 }, { unique: true, partialFilterExpression: { guestId: { $type: "string" } } });

export type CartDoc = InferSchemaType<typeof cartSchema>;
export const Cart: Model<CartDoc> = defineModel<CartDoc>("Cart", cartSchema);
