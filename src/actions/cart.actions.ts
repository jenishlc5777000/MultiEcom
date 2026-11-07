"use server";

import { revalidatePath } from "next/cache";
import { addToCartSchema, updateCartItemSchema } from "@/lib/validations";
import { addItem, CartError, setItemQty } from "@/services/cart.service";
import type { ActionResult } from "@/types/dto";

export async function addToCartAction(input: unknown): Promise<ActionResult> {
  const parsed = addToCartSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please choose a glaze and size." };
  try {
    await addItem(parsed.data.productId, parsed.data.variantId, parsed.data.qty);
  } catch (e) {
    if (e instanceof CartError) return { ok: false, error: e.message };
    console.error("[cart] add", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  revalidatePath("/", "layout"); // cart badge lives in the layout
  return { ok: true, data: undefined };
}

export async function updateCartItemAction(input: unknown): Promise<ActionResult> {
  const parsed = updateCartItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid quantity." };
  await setItemQty(parsed.data.productId, parsed.data.variantId, parsed.data.qty);
  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}
