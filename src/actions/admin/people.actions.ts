"use server";

import { reviewDecisionInput, reviewReplyInput, returnDecisionInput, settingsInput, userBlockInput, userRoleInput } from "@/lib/validations/admin";
import { decideReturn, decideReview, replyToReview } from "@/services/admin/approvals.service";
import { saveSettings } from "@/services/admin/settings-admin.service";
import { setUserBlocked, setUserRole } from "@/services/admin/user-admin.service";
import { ownerAction } from "./_helpers";

/* Users */

export async function setUserRoleAction(raw: unknown) {
  return ownerAction(userRoleInput, raw, ({ userId, role }, owner) => setUserRole(owner.id, userId, role), ["/admin/users"]);
}

export async function setUserBlockedAction(raw: unknown) {
  return ownerAction(userBlockInput, raw, ({ userId, blocked, reason }, owner) => setUserBlocked(owner.id, userId, blocked, reason), ["/admin/users"]);
}

/* Approvals */

export async function reviewDecisionAction(raw: unknown) {
  return ownerAction(reviewDecisionInput, raw, ({ reviewId, decision, reason }) => decideReview(reviewId, decision, reason), [
    "/admin/approvals",
    "/admin",
    "/",
  ]);
}

export async function reviewReplyAction(raw: unknown) {
  return ownerAction(reviewReplyInput, raw, ({ reviewId, text }) => replyToReview(reviewId, text), ["/admin/approvals"]);
}

export async function returnDecisionAction(raw: unknown) {
  return ownerAction(returnDecisionInput, raw, ({ returnId, status, ownerNote, refundAmount }) => decideReturn(returnId, status, ownerNote, refundAmount), [
    "/admin/approvals",
    "/admin",
    "/profile",
  ]);
}

/* Settings */

export async function saveSettingsAction(raw: unknown) {
  return ownerAction(settingsInput, raw, (input) => saveSettings(input), ["/admin/settings", "/"]);
}
