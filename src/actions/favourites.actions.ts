"use server";

import { Types } from "mongoose";
import { getCurrentUser } from "@/lib/auth/guards";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";

const MAX = 48;
const isId = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{24}$/.test(v);

/** Favourites are saved on the signed-in customer's account (guests keep them in the browser only). */
async function me() {
  const user = await getCurrentUser();
  if (!user?.id) return null;
  await connectDB();
  return user.id;
}

/** The account's favourites, after adding any `guest` ones saved before signing in. Newest first. */
export async function syncFavouritesAction(guest: unknown): Promise<string[] | null> {
  const id = await me();
  if (!id) return null;
  const row = await User.findById(id).select("favourites").lean();
  const saved = (row?.favourites ?? []).map(String);
  const extra = (Array.isArray(guest) ? guest.filter(isId) : []).filter((x) => !saved.includes(x));
  const list = [...extra, ...saved].slice(0, MAX);
  if (extra.length) await User.updateOne({ _id: id }, { $set: { favourites: list.map((x) => new Types.ObjectId(x)) } });
  return list;
}

export async function setFavouriteAction(productId: unknown, on: unknown) {
  const id = await me();
  if (!id || !isId(productId)) return;
  const pid = new Types.ObjectId(productId);
  if (on) {
    await User.updateOne({ _id: id }, { $pull: { favourites: pid } });
    await User.updateOne({ _id: id }, { $push: { favourites: { $each: [pid], $position: 0, $slice: MAX } } });
  } else {
    await User.updateOne({ _id: id }, { $pull: { favourites: pid } });
  }
}

export async function clearFavouritesAction() {
  const id = await me();
  if (!id) return;
  await User.updateOne({ _id: id }, { $set: { favourites: [] } });
}
