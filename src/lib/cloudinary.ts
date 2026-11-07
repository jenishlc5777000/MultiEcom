import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { requireEnv } from "@/config/env";

let configured = false;

function client() {
  if (!configured) {
    cloudinary.config({
      cloud_name: requireEnv("CLOUDINARY_CLOUD_NAME"),
      api_key: requireEnv("CLOUDINARY_API_KEY"),
      api_secret: requireEnv("CLOUDINARY_API_SECRET"),
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

/**
 * Signed params for direct browser-to-Cloudinary uploads (owner dashboard),
 * so image bytes never pass through our server.
 */
export function signUpload(folder: "products" | "reviews" | "banners" | "returns") {
  const c = client();
  const timestamp = Math.round(Date.now() / 1000);
  const params = { timestamp, folder: `clay-and-glaze/${folder}` };
  const signature = c.utils.api_sign_request(params, requireEnv("CLOUDINARY_API_SECRET"));
  return { ...params, signature, apiKey: requireEnv("CLOUDINARY_API_KEY"), cloudName: requireEnv("CLOUDINARY_CLOUD_NAME") };
}

export async function deleteImage(publicId: string) {
  await client().uploader.destroy(publicId);
}
