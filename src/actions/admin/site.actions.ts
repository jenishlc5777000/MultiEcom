"use server";

import { revalidatePath } from "next/cache";
import Razorpay from "razorpay";
import { z } from "zod";
import { sendPlainEmail } from "@/lib/email";
import { isThemeId, themeIds } from "@/config/themes";
import { TEMPLATES, templateContent } from "@/config/templates";
import { siteConfigSchema } from "@/lib/site-config";
import { importPartLabels, IMPORT_PARTS, partsInFile, themeFileSchema } from "@/lib/theme-file";
import { importStoreSettings, setStoreTheme } from "@/services/admin/settings-admin.service";
import { sendSms } from "@/lib/sms";
import { objectId } from "@/lib/validations";
import { setCategoryActive } from "@/services/admin/catalog-admin.service";
import { deleteMessage, setMessageRead } from "@/services/contact.service";
import { getIntegrations, LOGIN_METHODS, saveIntegrations, SECRET_FIELDS, SMS_PROVIDERS } from "@/services/integrations.service";
import { clearSiteDraft, getSiteConfig, resetSiteConfigSection, saveSiteConfigSection, saveSiteDraft } from "@/services/site-config.service";
import { applyTextEdit, publishSiteDraft } from "@/services/site-draft.service";
import { ownerAction, UserFacingError } from "./_helpers";

const section = z.enum(Object.keys(siteConfigSchema.shape) as [keyof typeof siteConfigSchema.shape, ...(keyof typeof siteConfigSchema.shape)[]]);

/* ───────────── Appearance ───────────── */

/** Save one Appearance section (validated against the site-config schema). */
export async function saveSiteSectionAction(name: string, value: unknown) {
  return ownerAction(z.object({ name: section, value: z.unknown() }), { name, value }, async ({ name, value }) => {
    const r = siteConfigSchema.shape[name].safeParse(value);
    if (!r.success) {
      const i = r.error.issues[0];
      throw new UserFacingError(i ? `${i.path.join(" › ")}: ${i.message}` : "Please check the form.");
    }
    await saveSiteConfigSection(name, r.data);
    revalidatePath("/", "layout");
  });
}

export async function resetSiteSectionAction(name: string) {
  return ownerAction(z.object({ name: section }), { name }, async ({ name }) => {
    await resetSiteConfigSection(name);
    revalidatePath("/", "layout");
  });
}

/* ───────────── Live preview drafts ───────────── */

/** Store unsaved changes for the owner's preview pane (never shown to visitors). */
export async function saveSiteDraftAction(name: string, value: unknown) {
  return ownerAction(z.object({ name: z.union([section, z.literal("theme")]), value: z.unknown() }), { name, value }, async ({ name, value }) => {
    try {
      await saveSiteDraft(name, value);
    } catch {
      // Half-typed values (e.g. a colour being edited) just don't update the preview yet.
      throw new UserFacingError("Preview not updated: finish editing the highlighted field.");
    }
  });
}

export async function clearSiteDraftAction() {
  return ownerAction(z.object({}), {}, () => clearSiteDraft());
}

/* ───────────── Inline editing & publish ───────────── */

/** A line of text edited directly in the Studio preview (saved to the draft). */
export async function applyTextEditAction(path: string, value: string) {
  return ownerAction(z.object({ path: z.string().max(120), value: z.string().max(4000) }), { path, value }, async ({ path, value }) => {
    try {
      return await applyTextEdit(path, value);
    } catch (e) {
      throw new UserFacingError(e instanceof z.ZodError ? (e.issues[0]?.message ?? "That text isn't valid.") : e instanceof Error ? e.message : "Couldn't apply that edit.");
    }
  });
}

/** Make every preview change live. */
export async function publishDraftAction() {
  return ownerAction(z.object({}), {}, async () => {
    const n = await publishSiteDraft();
    revalidatePath("/", "layout");
    return n;
  });
}

/* ───────────── Theme ───────────── */

export async function saveThemeAction(theme: string) {
  return ownerAction(z.object({ theme: z.enum(themeIds, { errorMap: () => ({ message: "Unknown theme" }) }) }), { theme }, async ({ theme }) => {
    await setStoreTheme(theme);
    revalidatePath("/", "layout");
  });
}

/* ───────────── Templates ───────────── */

/**
 * Apply a template: its theme, starter home-page sections and texts.
 * "preview" puts it all in the draft (see it in the live preview, then Publish
 * all); "live" makes it live straight away. Products and settings are untouched.
 */
export async function applyTemplateAction(themeId: string, mode: "preview" | "live") {
  return ownerAction(z.object({ themeId: z.string().max(40), mode: z.enum(["preview", "live"]) }), { themeId, mode }, async ({ themeId, mode }) => {
    const t = TEMPLATES[themeId];
    if (!t || !isThemeId(themeId)) throw new UserFacingError("That template doesn't exist.");
    const site = await getSiteConfig();
    const content = siteConfigSchema.shape.content.parse(templateContent(site.content, t));
    const builder = siteConfigSchema.shape.builder.parse({ enabled: true, sections: t.sections() });
    // The template's look wins: layout, colour and card overrides go back to "use the theme".
    // Header, footer, logo, pages, search and contact settings are kept.
    const design = siteConfigSchema.shape.design.parse({});
    const cards = siteConfigSchema.shape.cards.parse({});
    // Templates like Nibbea also bring their header, logo and product-page look.
    const look = t.look
      ? {
          header: siteConfigSchema.shape.header.parse({ ...site.header, ...(t.look.header ?? {}) }),
          logo: siteConfigSchema.shape.logo.parse({ ...site.logo, ...(t.look.logo ?? {}) }),
          pages: siteConfigSchema.shape.pages.parse({
            ...site.pages,
            ...(t.look.listing ? { listing: t.look.listing } : {}),
            product: { ...site.pages.product, ...(t.look.product ?? {}) },
            category: { ...site.pages.category, ...(t.look.category ?? {}) },
            categoriesIndex: { ...site.pages.categoriesIndex, ...(t.look.categoriesIndex ?? {}) },
          }),
          search: siteConfigSchema.shape.search.parse({ ...site.search, ...(t.look.search ?? {}) }),
        }
      : null;
    if (mode === "preview") {
      if (look) {
        await saveSiteDraft("header", look.header);
        await saveSiteDraft("logo", look.logo);
        await saveSiteDraft("pages", look.pages);
        await saveSiteDraft("search", look.search);
      }
      await saveSiteDraft("design", design);
      await saveSiteDraft("cards", cards);
      await saveSiteDraft("theme", themeId);
      await saveSiteDraft("content", content);
      await saveSiteDraft("builder", builder);
      return "Template loaded into the preview. Check it, then press Publish all changes.";
    }
    await setStoreTheme(themeId);
    await saveSiteConfigSection("design", design, themeId);
    await saveSiteConfigSection("cards", cards, themeId);
    await saveSiteConfigSection("content", content);
    await saveSiteConfigSection("builder", builder);
    if (look) {
      await saveSiteConfigSection("header", look.header);
      await saveSiteConfigSection("logo", look.logo);
      await saveSiteConfigSection("search", look.search);
      await saveSiteConfigSection("pages", look.pages);
    }
    await clearSiteDraft();
    revalidatePath("/", "layout");
    return "Template applied. Edit anything in Studio → Sections and Content.";
  });
}

/* ───────────── Theme import ───────────── */

/**
 * Apply parts of an exported file (theme or full export). Every section is
 * re-validated with the same rules as the dashboard; invalid sections are
 * skipped and reported, valid ones are applied.
 */
export async function importThemeAction(fileText: string, parts: string[]) {
  return ownerAction(
    z.object({ fileText: z.string().max(2_000_000, "That file is too big to be an export file."), parts: z.array(z.enum(IMPORT_PARTS)).min(1, "Choose at least one part to import") }),
    { fileText, parts },
    async ({ fileText, parts }) => {
      let json: unknown;
      try {
        json = JSON.parse(fileText);
      } catch {
        throw new UserFacingError("That file isn't valid JSON.");
      }
      const r = themeFileSchema.safeParse(json);
      if (!r.success) {
        const i = r.error.issues[0];
        throw new UserFacingError(i ? (i.path.length ? `${i.path.join(" › ")}: ${i.message}` : i.message) : "That file isn't valid.");
      }
      const file = r.data;
      const available = partsInFile(file);
      const done: string[] = [];
      const skipped: string[] = [];

      for (const part of parts) {
        if (!available.includes(part)) {
          skipped.push(`${importPartLabels[part]} (not in this file)`);
          continue;
        }
        if (part === "theme") {
          await setStoreTheme(file.theme);
        } else if (part === "store") {
          await importStoreSettings(file.store!);
        } else if (part === "perTheme") {
          const pt = siteConfigSchema.shape.perTheme.safeParse(file.site.perTheme);
          if (!pt.success) { skipped.push(`${importPartLabels[part]} (invalid)`); continue; }
          for (const [themeId, look] of Object.entries(pt.data)) {
            if (!isThemeId(themeId)) continue;
            if (look.design) await saveSiteConfigSection("design", look.design, themeId);
            if (look.cards) await saveSiteConfigSection("cards", look.cards, themeId);
          }
        } else {
          // design/cards belong to the file's theme; prefer that theme's own entry in a full export.
          const own = part === "design" || part === "cards" ? (file.site.perTheme as Record<string, Record<string, unknown>> | undefined)?.[file.theme]?.[part] : undefined;
          const value = own ?? file.site[part];
          const ok = siteConfigSchema.shape[part].safeParse(value);
          if (!ok.success) { skipped.push(`${importPartLabels[part]} (${ok.error.issues[0]?.message ?? "invalid"})`); continue; }
          await saveSiteConfigSection(part, ok.data, file.theme);
        }
        done.push(importPartLabels[part]);
      }
      await clearSiteDraft();
      revalidatePath("/", "layout");
      if (!done.length) throw new UserFacingError(`Nothing was imported. ${skipped.join("; ")}`);
      return `Imported ${done.length} part${done.length === 1 ? "" : "s"}${parts.includes("theme") ? ` (theme: ${file.theme})` : ""}.${skipped.length ? ` Skipped: ${skipped.join("; ")}.` : ""}`;
    },
  );
}

/* ───────────── Categories ───────────── */

export async function setCategoryActiveAction(id: string, active: boolean) {
  return ownerAction(z.object({ id: objectId, active: z.boolean() }), { id, active }, ({ id, active }) => setCategoryActive(id, active), [
    "/admin/categories",
    "/",
  ]);
}

/* ───────────── Integrations ───────────── */

const secret = z.string().trim().max(500).optional().transform((v) => v || undefined);
const integrationsInput = z.object({
  razorpay: z.object({
    keyId: z.union([z.string().trim().regex(/^rzp_(test|live)_\w+$/, "Razorpay key IDs start with rzp_test_ or rzp_live_"), z.literal("")]),
    keySecret: secret,
    webhookSecret: secret,
  }),
  email: z.object({
    from: z.union([z.string().trim().max(200).regex(/^(.+<[^<>\s]+@[^<>\s]+>|[^<>\s]+@[^<>\s]+)$/, 'Use name@domain.com or "Store <name@domain.com>"'), z.literal("")]),
    apiKey: secret,
  }),
  sms: z.object({
    provider: z.enum(SMS_PROVIDERS),
    accountSid: z.string().trim().max(100),
    senderId: z.string().trim().max(40),
    templateId: z.string().trim().max(100),
    orderUpdates: z.boolean(),
    apiKey: secret,
  }),
  google: z.object({
    clientId: z.union([z.string().trim().max(200).regex(/^[\w.-]+\.apps\.googleusercontent\.com$/, "Google client IDs end with .apps.googleusercontent.com"), z.literal("")]),
    clientSecret: secret,
  }),
  login: z.object({ methods: z.enum(LOGIN_METHODS) }),
  clear: z.array(z.enum(SECRET_FIELDS)).default([]),
});

export async function saveIntegrationsAction(raw: unknown) {
  return ownerAction(integrationsInput, raw, (input) => saveIntegrations(input), ["/admin/integrations"]);
}

/** Send a test email with the saved settings. */
export async function testEmailAction(to: string) {
  return ownerAction(z.object({ to: z.string().trim().email("Enter an email address to send the test to") }), { to }, async ({ to }) => {
    await sendPlainEmail(to, "Test email from your store", "This is a test from Admin → Integrations. If you can read it, email is working.").catch((e: Error) => {
      throw new UserFacingError(e.message);
    });
    return `Test email sent to ${to}.`;
  });
}

/** Send a test SMS with the saved settings. */
export async function testSmsAction(to: string) {
  return ownerAction(z.object({ to: z.string().trim().min(10, "Enter a phone number").max(20) }), { to }, async ({ to }) => {
    const { sms } = await getIntegrations();
    if (sms.provider === "none") throw new UserFacingError("Choose an SMS provider and save first.");
    await sendSms(to, "Test SMS from your store. SMS is working.").catch((e: Error) => {
      throw new UserFacingError(e.message);
    });
    return `Test SMS sent to ${to}.`;
  });
}

/** Check the saved Razorpay keys by listing one order. */
export async function testRazorpayAction() {
  return ownerAction(z.object({}), {}, async () => {
    const { razorpay } = await getIntegrations();
    if (!razorpay.keyId || !razorpay.keySecret) throw new UserFacingError("Add the key ID and key secret, then save.");
    try {
      await new Razorpay({ key_id: razorpay.keyId, key_secret: razorpay.keySecret }).orders.all({ count: 1 });
    } catch {
      throw new UserFacingError("Razorpay rejected these keys. Check the key ID and secret (test and live keys are different).");
    }
    return `Razorpay keys work (${razorpay.keyId.startsWith("rzp_live_") ? "live" : "test"} mode).`;
  });
}

/* ───────────── Messages ───────────── */

export async function setMessageReadAction(id: string, read: boolean) {
  return ownerAction(z.object({ id: objectId, read: z.boolean() }), { id, read }, ({ id, read }) => setMessageRead(id, read), ["/admin/messages"]);
}

export async function deleteMessageAction(id: string) {
  return ownerAction(z.object({ id: objectId }), { id }, ({ id }) => deleteMessage(id), ["/admin/messages"]);
}
