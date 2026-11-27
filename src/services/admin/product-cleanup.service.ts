import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { deleteStoredImage } from "@/lib/uploads";
import { Cart, Order, Product, Review } from "@/models";
import { User } from "@/models/User";

/** Archived products are deleted this many days after they were archived. */
export const ARCHIVE_DELETE_DAYS = 30;

type Img = { publicId?: string | null } | null | undefined;

/**
 * Runs daily (cron). Deletes products archived 30+ days ago, together with
 * their photos in cloud storage, cart lines, favourites and reviews. Past
 * orders keep the line (name, price, quantity: the purchase record) but lose
 * the photo and the link to the deleted product.
 */
export async function purgeArchivedProducts(now = new Date()) {
  await connectDB();
  // Products archived before this feature existed start their 30 days today.
  await Product.updateMany({ status: "ARCHIVED", archivedAt: null }, { $set: { archivedAt: now } });

  const cutoff = new Date(now.getTime() - ARCHIVE_DELETE_DAYS * 864e5);
  const due = await Product.find({ status: "ARCHIVED", archivedAt: { $lte: cutoff } })
    .select("name images variants.images")
    .lean<{ _id: Types.ObjectId; name: string; images?: Img[]; variants?: { images?: { main?: Img; side?: Img; bottom?: Img } }[] }[]>();

  let deleted = 0;
  for (const p of due) {
    const id = p._id;
    await Promise.all([
      Order.updateMany({ "items.product": id }, { $set: { "items.$[i].productDeleted": true }, $unset: { "items.$[i].imageUrl": 1 } }, { arrayFilters: [{ "i.product": id }] }),
      Cart.updateMany({ "items.product": id }, { $pull: { items: { product: id } } }),
      User.updateMany({ favourites: id }, { $pull: { favourites: id } }),
      Review.deleteMany({ productId: id }),
    ]);
    await Product.deleteOne({ _id: id });
    deleted++;

    // Photos: only those no other product still uses.
    const ids = new Set(
      [...(p.images ?? []), ...(p.variants ?? []).flatMap((v) => [v.images?.main, v.images?.side, v.images?.bottom])]
        .map((i) => i?.publicId)
        .filter((x): x is string => Boolean(x)),
    );
    for (const publicId of ids) {
      const used = await Product.exists({
        $or: [{ "images.publicId": publicId }, { "variants.images.main.publicId": publicId }, { "variants.images.side.publicId": publicId }, { "variants.images.bottom.publicId": publicId }],
      });
      if (!used) await deleteStoredImage(publicId).catch((e) => console.error("[cleanup] image", publicId, e));
    }
    console.log(`[cleanup] deleted archived product "${p.name}" (${String(id)})`);
  }
  return deleted;
}
