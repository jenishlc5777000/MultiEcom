"use server";

import { z } from "zod";
import { objectId } from "@/lib/validations";
import { orderActionInput } from "@/lib/validations/admin";
import { applyOrderAction, markRefundProcessed } from "@/services/admin/order-admin.service";
import { ownerAction } from "./_helpers";

export async function orderActionAction(orderId: string, raw: unknown) {
  return ownerAction(
    z.object({ orderId: objectId, input: orderActionInput }),
    { orderId, input: raw },
    ({ orderId, input }, owner) => applyOrderAction(orderId, input, owner.id),
    ["/admin", "/admin/orders", `/admin/orders/${orderId}`, "/admin/approvals", "/profile", "/"],
  );
}

export async function markRefundProcessedAction(orderId: string) {
  return ownerAction(z.object({ orderId: objectId }), { orderId }, ({ orderId }) => markRefundProcessed(orderId), [`/admin/orders/${orderId}`]);
}
