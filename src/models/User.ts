import { Schema, type InferSchemaType, type Model } from "mongoose";
import { addressSchema, defineModel } from "./_shared";

export const USER_ROLES = ["customer", "owner"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * Shares the `users` collection with the Auth.js MongoDB adapter. The adapter
 * inserts documents without `role`, so always read it as `role ?? "customer"`.
 */
const userSchema = new Schema(
  {
    name: String,
    email: { type: String, required: true, lowercase: true, trim: true },
    emailVerified: Date,
    image: String,
    phone: String,
    role: { type: String, enum: USER_ROLES, default: "customer" },
    addresses: [addressSchema],
    /** Blocked users cannot sign in or check out. */
    isBlocked: { type: Boolean, default: false },
    blockedReason: String,
  },
  { timestamps: true, collection: "users" },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, createdAt: -1 });

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User: Model<UserDoc> = defineModel<UserDoc>("User", userSchema);
