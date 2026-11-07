import "server-only";
import crypto from "node:crypto";
import { env } from "@/config/env";

/**
 * Encryption for credentials the owner saves in the dashboard (payment, SMS,
 * email keys). AES-256-GCM with a key derived from AUTH_SECRET, so a database
 * dump alone doesn't reveal them. Changing AUTH_SECRET makes saved secrets
 * unreadable; they then have to be entered again.
 */
const PREFIX = "enc:v1:";
const key = () => crypto.createHash("sha256").update(`${env().AUTH_SECRET}:store-integrations`).digest();

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return PREFIX + [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64")).join(":");
}

/** Returns "" for empty or unreadable values (never throws). */
export function decryptSecret(stored: unknown): string {
  if (typeof stored !== "string" || !stored.startsWith(PREFIX)) return "";
  try {
    const [iv, tag, data] = stored.slice(PREFIX.length).split(":").map((p) => Buffer.from(p, "base64"));
    const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv!);
    decipher.setAuthTag(tag!);
    return Buffer.concat([decipher.update(data!), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}

/** "rzp_test_abcd1234" → "••••1234" for showing that a secret is saved. */
export const maskSecret = (v: string) => (v ? `••••${v.slice(-4)}` : "");
