import "server-only";
import { connectDB } from "@/lib/db/connect";
import { sharedCache } from "@/lib/data-cache";
import { parseOrderFlow, type OrderFlow } from "@/lib/order-flow";
import { Setting } from "@/models";

/** Admin → Orders → Order steps (cached with the store settings). */
export const getOrderFlow = sharedCache(
  async (): Promise<OrderFlow> => {
    await connectDB();
    const s = await Setting.findOne({ key: "store" }).select("orderFlow").lean<{ orderFlow?: unknown }>();
    return parseOrderFlow(s?.orderFlow);
  },
  "order-flow",
  "settings",
);

export async function saveOrderFlow(flow: OrderFlow) {
  await connectDB();
  await Setting.updateOne({ key: "store" }, { $set: { orderFlow: flow } }, { upsert: true });
}
