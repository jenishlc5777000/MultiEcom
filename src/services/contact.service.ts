import "server-only";
import { siteConfig } from "@/config/site";
import { connectDB } from "@/lib/db/connect";
import { DomainError } from "@/lib/errors";
import { sendPlainEmail } from "@/lib/email";
import { Message } from "@/models";
import { getSiteConfig } from "./site-config.service";
import { getStoreInfo } from "./store.service";

export class ContactError extends DomainError {}

export type ContactInput = { name: string; email: string; phone?: string; subject: string; message: string };

/** Fills {{name}}, {{email}}, {{phone}}, {{subject}}, {{message}}, {{store}} in an owner-written template. */
export function renderTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => vars[k] ?? "");
}

/**
 * Saves a contact-form message, emails the owner (template from Admin →
 * Appearance → Contact form) and sends the optional auto-reply. Email
 * failures are logged, never shown to the visitor: the message is saved anyway.
 */
export async function submitContactMessage(input: ContactInput) {
  const [site, store] = await Promise.all([getSiteConfig(), getStoreInfo()]);
  const cfg = site.contactForm;
  if (!cfg.enabled) throw new ContactError("The contact form is turned off.");

  await connectDB();
  // Light flood protection: at most 3 messages per email address per 10 minutes.
  const recent = await Message.countDocuments({ email: input.email, from: "customer", createdAt: { $gte: new Date(Date.now() - 10 * 60_000) } });
  if (recent >= 3) throw new ContactError("You've sent a few messages already. Please wait a few minutes and try again.");

  await Message.create({ name: input.name, email: input.email, subject: input.subject, body: input.phone ? `${input.message}\n\nPhone: ${input.phone}` : input.message, from: "customer" });

  const vars = { name: input.name, email: input.email, phone: input.phone || "not given", subject: input.subject, message: input.message, store: siteConfig.name };
  const to = cfg.notifyEmail || store.contactEmail;
  const jobs: Promise<unknown>[] = [];
  if (to) jobs.push(sendPlainEmail(to, renderTemplate(cfg.notifySubject, vars), renderTemplate(cfg.notifyBody, vars), input.email));
  if (cfg.autoReply) jobs.push(sendPlainEmail(input.email, renderTemplate(cfg.autoReplySubject, vars), renderTemplate(cfg.autoReplyBody, vars)));
  const results = await Promise.allSettled(jobs);
  for (const r of results) if (r.status === "rejected") console.error("[contact] email failed", r.reason);

  return cfg.successMessage;
}

/* ───────────── Admin inbox ───────────── */

export async function listContactMessages(filter: "unread" | "all" = "all") {
  await connectDB();
  const q = { from: "customer", thread: null, ...(filter === "unread" ? { readAt: null } : {}) };
  const [rows, unread] = await Promise.all([
    Message.find(q).sort({ createdAt: -1 }).limit(200).lean(),
    Message.countDocuments({ from: "customer", thread: null, readAt: null }),
  ]);
  return {
    unread,
    messages: rows.map((m) => ({
      id: String(m._id),
      name: m.name ?? "",
      email: m.email,
      subject: m.subject,
      body: m.body,
      read: Boolean(m.readAt),
      createdAt: (m as { createdAt?: Date }).createdAt?.toISOString() ?? "",
    })),
  };
}

export async function setMessageRead(id: string, read: boolean) {
  await connectDB();
  await Message.updateOne({ _id: id }, read ? { $set: { readAt: new Date() } } : { $unset: { readAt: 1 } });
}

export async function deleteMessage(id: string) {
  await connectDB();
  await Message.deleteOne({ _id: id });
}
