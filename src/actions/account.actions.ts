"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import { RETURN_REASONS } from "@/lib/constants";
import { objectId, reviewSchema } from "@/lib/validations";
import { createReturnRequest, ReturnError } from "@/services/return.service";
import { createReview, ReviewError } from "@/services/review.service";
import type { ActionResult } from "@/types/dto";

/** Customer: review a delivered piece. Goes to the owner's approval queue. */
export async function submitReviewAction(raw: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user?.id) return { ok: false, error: "Please sign in to leave a review." };
  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your review." };
  try {
    await createReview(user.id, parsed.data);
  } catch (e) {
    if (e instanceof ReviewError) return { ok: false, error: e.message };
    console.error("[review]", e);
    return { ok: false, error: "Couldn't send your review. Please try again." };
  }
  revalidatePath("/admin/approvals");
  return { ok: true, data: undefined };
}

const returnInput = z.object({
  orderId: objectId,
  reason: z.enum(RETURN_REASONS),
  details: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(2000),
  items: z.array(z.object({ orderItem: objectId, qty: z.coerce.number().int().min(1) })).min(1, "Choose at least one item"),
});

/** Customer: request a return on a delivered order. Goes to the owner's approval queue. */
export async function requestReturnAction(raw: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user?.id) return { ok: false, error: "Please sign in." };
  const parsed = returnInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  try {
    await createReturnRequest(user.id, parsed.data);
  } catch (e) {
    if (e instanceof ReturnError) return { ok: false, error: e.message };
    console.error("[return]", e);
    return { ok: false, error: "Couldn't send your request. Please try again." };
  }
  revalidatePath(`/profile/orders/${parsed.data.orderId}`);
  revalidatePath("/admin/approvals");
  return { ok: true, data: undefined };
}
