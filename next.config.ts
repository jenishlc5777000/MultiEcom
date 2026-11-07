import type { NextConfig } from "next";

/**
 * Image hosts the storefront may show (Admin → Integrations → Image storage).
 * A custom CDN / domain for a bucket goes in IMAGE_HOSTS (comma-separated), then redeploy.
 */
const IMAGE_HOSTS = [
  "res.cloudinary.com",
  "**.amazonaws.com", // Amazon S3 and CloudFront (*.cloudfront.net below)
  "**.cloudfront.net",
  "**.r2.dev", // Cloudflare R2 public bucket URLs
  "**.r2.cloudflarestorage.com",
  "**.digitaloceanspaces.com",
  "**.wasabisys.com",
  "**.backblazeb2.com",
  "**.public.blob.vercel-storage.com", // Vercel Blob
  ...(process.env.IMAGE_HOSTS ?? "").split(",").map((h) => h.trim()).filter(Boolean),
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: IMAGE_HOSTS.map((hostname) => ({ protocol: "https" as const, hostname })),
    // Allows the local demo SVGs in /public/demo; served sandboxed with scripts disabled.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Mongoose must stay on the Node.js runtime and not be bundled.
  serverExternalPackages: ["mongoose"],
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
