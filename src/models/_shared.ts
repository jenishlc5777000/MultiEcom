import mongoose, { Schema, type Model } from "mongoose";

/**
 * Compile a model once. In development, hot reload re-runs this module but
 * `mongoose.models` keeps the model compiled from the *old* schema, so new
 * fields get silently dropped by strict mode. Recompiling there keeps the
 * schema current; production compiles exactly once.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- typed by the caller; avoids Mongoose's deep inference
export function defineModel<T>(name: string, schema: Schema<any>, collection?: string): Model<T> {
  if (process.env.NODE_ENV !== "production" && mongoose.models[name]) mongoose.deleteModel(name);
  const existing = mongoose.models[name];
  return (existing ?? mongoose.model(name, schema, collection)) as unknown as Model<T>;
}

export const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true }, // Cloudinary public_id
    alt: { type: String, default: "" },
    width: Number,
    height: Number,
  },
  { _id: false },
);

export const addressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "IN" },
  },
  { _id: false },
);

export type Image = {
  url: string;
  publicId: string;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
};

export type Address = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
};
