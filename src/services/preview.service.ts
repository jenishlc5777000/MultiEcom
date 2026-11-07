import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { getCurrentUser } from "@/lib/auth/guards";

/**
 * Live preview of unsaved Appearance / theme changes.
 *
 * While the owner edits, the dashboard writes a draft to Setting.siteDraft.
 * Pages render that draft only when BOTH are true: the preview cookie is set
 * (by /api/preview) and the signed-in user is an owner. Everyone else always
 * gets the saved settings.
 */
export const PREVIEW_COOKIE = "cg_preview";

export const isPreviewMode = cache(async (): Promise<boolean> => {
  try {
    const jar = await cookies();
    if (jar.get(PREVIEW_COOKIE)?.value !== "1") return false;
    const user = await getCurrentUser();
    return user?.role === "owner";
  } catch {
    // cookies() is unavailable outside a request (e.g. static rendering).
    return false;
  }
});
