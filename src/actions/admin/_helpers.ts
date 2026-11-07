import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/data-cache";
import type { ZodType, ZodTypeDef } from "zod";
import { assertOwner } from "@/lib/auth/guards";
import { DomainError } from "@/lib/errors";
import type { ActionResult } from "@/types/dto";

/** Thrown inline by actions for messages meant for the owner. */
export class UserFacingError extends DomainError {}

type Owner = Awaited<ReturnType<typeof assertOwner>>;

/**
 * Every admin mutation goes through here: owner check → zod validation →
 * service call → cache revalidation. Unknown errors are logged, not leaked.
 */
export async function ownerAction<TIn, TOut>(
  schema: ZodType<TIn, ZodTypeDef, unknown>,
  raw: unknown,
  run: (input: TIn, owner: Owner) => Promise<TOut>,
  revalidate: string[] = [],
): Promise<ActionResult<TOut>> {
  let owner: Owner;
  try {
    owner = await assertOwner();
  } catch {
    return { ok: false, error: "You need owner access to do that." };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const first = parsed.error.issues[0];
    return {
      ok: false,
      error: first ? `${first.path.length ? `${first.path.join(" › ")}: ` : ""}${first.message}` : "Please check the form.",
      fieldErrors: flat.fieldErrors as Record<string, string[] | undefined>,
    };
  }

  try {
    const data = await run(parsed.data, owner);
    for (const p of revalidate) revalidatePath(p, p === "/" ? "layout" : "page");
    // Settings/catalogue reads are shared-cached; any admin change refreshes them.
    revalidateTag(CACHE_TAGS.settings);
    revalidateTag(CACHE_TAGS.catalog);
    return { ok: true, data };
  } catch (e) {
    if (e instanceof DomainError) return { ok: false, error: e.message };
    console.error("[admin action]", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
