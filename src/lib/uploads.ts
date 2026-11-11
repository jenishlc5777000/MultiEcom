import "server-only";
import { DomainError } from "@/lib/errors";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { AwsClient } from "aws4fetch";
import { put as blobPut, del as blobDel } from "@vercel/blob";
import { v2 as cloudinary } from "cloudinary";
import { env } from "@/config/env";
import type { Image } from "@/models";
import { getIntegrations, type StorageSettings } from "@/services/integrations.service";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export class UploadError extends DomainError {}

type Folder = "products" | "categories" | "banners" | "brand" | "blog" | "reviews" | "returns";

/** Sub-folder names under the main folder, e.g. ["mugs", "tapered"] → categories/mugs/tapered. */
const SEGMENT = /^[a-z0-9][a-z0-9-]{0,59}$/;
export const cleanSubfolders = (parts: string[]) => parts.map((p) => p.trim().toLowerCase()).filter((p) => SEGMENT.test(p)).slice(0, 4);
type Active = "cloudinary" | "s3" | "vercel_blob" | "local";

const has = {
  cloudinary: (s: StorageSettings) => Boolean(s.cloudName && s.cloudKey && s.cloudSecret),
  s3: (s: StorageSettings) => Boolean(s.s3Bucket && s.s3KeyId && s.s3Secret),
  vercel_blob: (s: StorageSettings) => Boolean(s.blobToken),
};

/** Admin → Integrations → Image storage. "auto" picks the first provider with keys. */
export function activeStorage(s: StorageSettings): Active | null {
  if (s.provider !== "auto") return has[s.provider](s) ? s.provider : null;
  const found = (["cloudinary", "s3", "vercel_blob"] as const).find((p) => has[p](s));
  if (found) return found;
  return env().NODE_ENV === "production" ? null : "local";
}

export const storageLabel: Record<Active, string> = {
  cloudinary: "Cloudinary",
  s3: "S3 bucket",
  vercel_blob: "Vercel Blob",
  local: "this computer (public/uploads, development only)",
};

/* ── S3 and S3-compatible ── */

function s3Target(s: StorageSettings, key: string) {
  const k = key.split("/").map(encodeURIComponent).join("/");
  // Custom endpoint (R2, Spaces, Wasabi, B2, MinIO): path style. Amazon S3: virtual-hosted style.
  const object = s.s3Endpoint
    ? `${s.s3Endpoint.replace(/\/+$/, "")}/${s.s3Bucket}/${k}`
    : `https://${s.s3Bucket}.s3.${s.s3Region && s.s3Region !== "auto" ? s.s3Region : "us-east-1"}.amazonaws.com/${k}`;
  const publicUrl = s.s3PublicUrl ? `${s.s3PublicUrl.replace(/\/+$/, "")}/${k}` : object;
  return { object, publicUrl };
}

function s3Client(s: StorageSettings) {
  return new AwsClient({ accessKeyId: s.s3KeyId, secretAccessKey: s.s3Secret, service: "s3", region: s.s3Region || "auto" });
}

async function s3Put(s: StorageSettings, key: string, bytes: Buffer, type: string) {
  const { object, publicUrl } = s3Target(s, key);
  const res = await s3Client(s)
    .fetch(object, {
      method: "PUT",
      body: new Uint8Array(bytes),
      headers: { "content-type": type, "cache-control": "public, max-age=31536000, immutable" },
    })
    .catch(() => {
      throw new UploadError(`Couldn't reach the bucket at ${new URL(object).host}. Check the endpoint and region.`);
    });
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    const code = body.match(/<Code>([^<]+)<\/Code>/)?.[1];
    throw new UploadError(`The bucket refused the upload (${res.status}${code ? ` ${code}` : ""}). Check the bucket name, region, endpoint and key permissions.`);
  }
  return publicUrl;
}

async function s3Delete(s: StorageSettings, key: string) {
  await s3Client(s).fetch(s3Target(s, key).object, { method: "DELETE" });
}

/* ── Store / delete ── */

async function putBytes(provider: Active, s: StorageSettings, folder: string, name: string, bytes: Buffer, type: string): Promise<Image> {
  switch (provider) {
    case "cloudinary": {
      cloudinary.config({ cloud_name: s.cloudName, api_key: s.cloudKey, api_secret: s.cloudSecret, secure: true });
      const res = await new Promise<{ secure_url: string; public_id: string; width: number; height: number }>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: `nibbea/${folder}`, resource_type: "image" }, (err, result) =>
            err || !result ? reject(new UploadError(`Cloudinary refused the upload: ${err?.message ?? "unknown error"}`)) : resolve(result),
          )
          .end(bytes);
      });
      return { url: res.secure_url, publicId: res.public_id, width: res.width, height: res.height, alt: "" };
    }
    case "s3": {
      const key = `nibbea/${folder}/${name}`;
      return { url: await s3Put(s, key, bytes, type), publicId: `s3:${key}`, alt: "" };
    }
    case "vercel_blob": {
      try {
        const blob = await blobPut(`nibbea/${folder}/${name}`, bytes, { access: "public", token: s.blobToken, contentType: type, addRandomSuffix: false });
        return { url: blob.url, publicId: `blob:${blob.url}`, alt: "" };
      } catch (e) {
        const m = e instanceof Error ? e.message : "unknown error";
        // Shop pictures must be publicly readable; a private store can't serve them.
        if (/private/i.test(m)) {
          throw new UploadError("This Vercel Blob store is private. Shop pictures need a public store: in Vercel → Storage, create a new Blob store with access set to Public, connect it to the project (or paste its token here), then test again.");
        }
        throw new UploadError(`Vercel Blob refused the upload: ${m}`);
      }
    }
    case "local": {
      const dir = path.join(process.cwd(), "public", "uploads", folder);
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, name), bytes);
      return { url: `/uploads/${folder}/${name}`, publicId: `local/${folder}/${name}`, alt: "" };
    }
  }
}

/**
 * Store one image with the provider chosen in Admin → Integrations → Image storage,
 * in a folder for what it belongs to, e.g. nibbea/products/speckled-mug/… or
 * nibbea/categories/mugs/tapered/….
 */
export async function storeImage(file: File, folder: Folder, subfolders: string[] = []): Promise<Image> {
  const ext = TYPES[file.type];
  if (!ext) throw new UploadError("Use a JPG, PNG, WebP or AVIF image.");
  if (file.size > MAX_BYTES) throw new UploadError("Images must be 5 MB or smaller.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const { storage } = await getIntegrations();
  const provider = activeStorage(storage);
  if (!provider) {
    throw new UploadError(
      storage.provider === "auto"
        ? "Image uploads need a storage service. Add Cloudinary, an S3 bucket or Vercel Blob in Admin → Integrations."
        : `The keys for ${storageLabel[storage.provider as Active] ?? storage.provider} are incomplete. Finish them in Admin → Integrations.`,
    );
  }
  const dir = [folder, ...cleanSubfolders(subfolders)].join("/");
  return putBytes(provider, storage, dir, `${randomUUID()}.${ext}`, bytes, file.type);
}

/** Remove a stored image (best effort; unknown ids are ignored). */
export async function deleteStoredImage(publicId: string) {
  const { storage: s } = await getIntegrations();
  if (publicId.startsWith("s3:")) return s3Delete(s, publicId.slice(3));
  if (publicId.startsWith("blob:")) return blobDel(publicId.slice(5), { token: s.blobToken });
  if (publicId.startsWith("local/")) return;
  if (has.cloudinary(s)) {
    cloudinary.config({ cloud_name: s.cloudName, api_key: s.cloudKey, api_secret: s.cloudSecret, secure: true });
    await cloudinary.uploader.destroy(publicId);
  }
}

/** 1×1 PNG used by "Test storage". */
const TEST_PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

/** Upload a tiny test image, check it can be read back from its public address, then delete it. */
export async function testStorage() {
  const { storage } = await getIntegrations();
  const provider = activeStorage(storage);
  if (!provider) throw new UploadError("No storage service has complete keys yet. Save the keys first, then test.");
  if (provider === "local") return `Images are saved on ${storageLabel.local}. Add a storage service before going live.`;
  const img = await putBytes(provider, storage, "test", `test-${Date.now()}.png`, TEST_PNG, "image/png");
  const res = await fetch(img.url, { method: "GET", cache: "no-store" }).catch(() => null);
  await deleteStoredImage(img.publicId).catch(() => {});
  if (!res?.ok) {
    throw new UploadError(
      `Upload worked, but the image isn't publicly readable at ${new URL(img.url).origin} (${res ? res.status : "no response"}). Make the bucket public, or set its public URL (CDN / r2.dev / custom domain).`,
    );
  }
  return `${storageLabel[provider]} works: a test image was uploaded, read back and deleted.`;
}
