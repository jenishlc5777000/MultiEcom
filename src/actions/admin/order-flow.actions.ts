"use server";

import { orderFlowSchema } from "@/lib/order-flow";
import { saveOrderFlow } from "@/services/order-flow.service";
import { ownerAction, UserFacingError } from "./_helpers";

/** Admin → Orders → Order steps. */
export async function saveOrderFlowAction(raw: unknown) {
  return ownerAction(
    orderFlowSchema,
    raw,
    async (flow) => {
      const ids = flow.shipping.stages.map((s) => s.id);
      if (new Set(ids).size !== ids.length) throw new UserFacingError("Two shipping steps have the same name. Rename one of them.");
      const names = flow.shipping.couriers.map((c) => c.name.toLowerCase());
      if (new Set(names).size !== names.length) throw new UserFacingError("Two couriers have the same name.");
      await saveOrderFlow(flow);
    },
    ["/admin/orders/flow", "/profile"],
  );
}
