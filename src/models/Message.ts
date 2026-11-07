import { Schema, type InferSchemaType, type Model } from "mongoose";
import { defineModel } from "./_shared";

/** Customer and owner messages: contact form, order questions, custom-order requests. */
const messageSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", default: null },
    name: String,
    email: { type: String, required: true },
    order: { type: Schema.Types.ObjectId, ref: "Order", default: null },
    subject: { type: String, required: true },
    body: { type: String, required: true, maxlength: 5000 },
    from: { type: String, enum: ["customer", "owner"], default: "customer" },
    thread: { type: Schema.Types.ObjectId, ref: "Message", default: null }, // root message
    readAt: Date,
  },
  { timestamps: true },
);

messageSchema.index({ thread: 1, createdAt: 1 });
messageSchema.index({ readAt: 1, createdAt: -1 });

export type MessageDoc = InferSchemaType<typeof messageSchema>;
export const Message: Model<MessageDoc> = defineModel<MessageDoc>("Message", messageSchema);
