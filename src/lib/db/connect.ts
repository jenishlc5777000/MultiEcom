import "server-only";
import mongoose from "mongoose";
import { env } from "@/config/env";

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

declare global {
  var __mongoose: Cache | undefined;
}

// Reuse one connection across hot reloads in dev and across invocations in serverless.
const cache: Cache = globalThis.__mongoose ?? { conn: null, promise: null };
globalThis.__mongoose = cache;

export async function connectDB() {
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    mongoose.set("strictQuery", true);
    cache.promise = mongoose.connect(env().MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      autoIndex: env().NODE_ENV !== "production",
    });
  }
  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }
  return cache.conn;
}

/** Native MongoClient for the Auth.js adapter — shares Mongoose's pool. */
export async function getMongoClient() {
  const conn = await connectDB();
  return conn.connection.getClient();
}

/**
 * Run work inside a Mongo transaction (requires a replica set, e.g. Atlas).
 * `withTransaction` retries on transient errors, so `fn` must be idempotent.
 */
export async function withTransaction<T>(fn: (session: mongoose.ClientSession) => Promise<T>) {
  await connectDB();
  const session = await mongoose.startSession();
  try {
    let result!: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}
