"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ContactError, submitContactMessage } from "@/services/contact.service";
import type { ActionResult } from "@/types/dto";

const contactInput = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Please enter a valid email"),
  phone: z.string().trim().max(20).optional().transform((v) => v || undefined),
  subject: z.string().trim().min(1, "Choose a subject").max(80),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(4000),
  /** Honeypot: hidden from people; bots tend to fill it. */
  website: z.string().max(0).optional(),
});

/** Public contact form. Returns the owner's success message. */
export async function sendContactMessageAction(raw: unknown): Promise<ActionResult<string>> {
  const parsed = contactInput.safeParse(raw);
  if (!parsed.success) {
    // A filled honeypot gets a quiet "success" so bots learn nothing.
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return { ok: true, data: "Thanks!" };
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  try {
    const { name, email, phone, subject, message: body } = parsed.data;
    const message = await submitContactMessage({ name, email, phone, subject, message: body });
    revalidatePath("/admin/messages");
    return { ok: true, data: message };
  } catch (e) {
    if (e instanceof ContactError) return { ok: false, error: e.message };
    console.error("[contact]", e);
    return { ok: false, error: "Couldn't send your message. Please try again or email us directly." };
  }
}
