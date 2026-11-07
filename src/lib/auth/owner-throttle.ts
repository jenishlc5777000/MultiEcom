import "server-only";
import { connectDB } from "@/lib/db/connect";

/**
 * Lock the owner sign-in (password or fixed code) after repeated failures:
 * 5 wrong tries within 15 minutes locks it for 15 minutes. Stored in the
 * database so it holds across serverless instances.
 */
const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60_000;
const LOCK_MS = 15 * 60_000;

type Row = { _id: string; fails: number; windowStart: Date; lockedUntil?: Date | null };

async function collection() {
  const conn = await connectDB();
  return conn.connection.db!.collection<Row>("login_throttle");
}

export async function ownerLoginLocked(): Promise<boolean> {
  const row = await (await collection()).findOne({ _id: "owner" });
  return Boolean(row?.lockedUntil && row.lockedUntil.getTime() > Date.now());
}

export async function recordOwnerLoginFailure() {
  const col = await collection();
  const now = new Date();
  const row = await col.findOne({ _id: "owner" });
  const fresh = !row || now.getTime() - row.windowStart.getTime() > WINDOW_MS;
  const fails = fresh ? 1 : row.fails + 1;
  await col.updateOne(
    { _id: "owner" },
    { $set: { fails, windowStart: fresh ? now : row!.windowStart, lockedUntil: fails >= MAX_FAILS ? new Date(now.getTime() + LOCK_MS) : null } },
    { upsert: true },
  );
}

export async function clearOwnerLoginFailures() {
  await (await collection()).deleteOne({ _id: "owner" });
}
