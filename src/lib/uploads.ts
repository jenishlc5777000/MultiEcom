import "server-only";
import { DomainError } from "@/lib/errors";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { env } from "@/config/env";
import type { Image } from "@/models";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export class UploadError extends DomainError {}

function cloudinaryConfigured() {
  const e = env();
  return Boolean(e.CLOUDINARY_CLOUD_NAME && e.CLOUDINARY_API_KEY && e.CLOUDINARY_API_SECRET);
}

/**
 * Store one image. Uses Cloudinary when configured; in development without
 * Cloudinary keys it falls back to /public/uploads so the dashboard still works.
 */
export async function storeImage(file: File, folder: "products" | "categories" | "banners" | "brand" | "reviews" | "returns"): Promise<Image> {
  const ext = TYPES[file.type];
  if (!ext) throw new UploadError("Use a JPG, PNG, WebP or AVIF image.");
  if (file.size > MAX_BYTES) throw new UploadError("Images must be 5 MB or smaller.");
  const bytes = Buffer.from(await file.arrayBuffer());

  if (cloudinaryConfigured()) {
    const e = env();
    cloudinary.config({ cloud_name: e.CLOUDINARY_CLOUD_NAME, api_key: e.CLOUDINARY_API_KEY, api_secret: e.CLOUDINARY_API_SECRET, secure: true });
    const res = await new Promise<{ secure_url: string; public_id: string; width: number; height: number }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: `clay-and-glaze/${folder}`, resource_type: "image" }, (err, result) =>
          err || !result ? reject(err ?? new Error("Upload failed")) : resolve(result),
        )
        .end(bytes);
    });
    return { url: res.secure_url, publicId: res.public_id, width: res.width, height: res.height, alt: "" };
  }

  if (env().NODE_ENV === "production") throw new UploadError("Image uploads need Cloudinary keys in production.");
  const name = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);
  return { url: `/uploads/${folder}/${name}`, publicId: `local/${folder}/${name}`, alt: "" };
}
