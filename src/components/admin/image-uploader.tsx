"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, X } from "lucide-react";
import { useRef, useState } from "react";
import { uploadImageAction } from "@/actions/admin/catalog.actions";
import { cn } from "@/lib/utils";

export type UploadedImage = { url: string; publicId: string; alt: string };

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
/** Aim for photos around 500 KB: sharp on screen, quick on phones. */
const TARGET_BYTES = 500 * 1024;
const MAX_EDGE = 1800;
const MIN_EDGE = 900;

type Source = { draw: CanvasImageSource; width: number; height: number; close: () => void };

/** Decode any image the browser can read (incl. iPhone HEIC in Safari), upright per its EXIF orientation. */
async function decode(file: File): Promise<Source> {
  try {
    const b = await createImageBitmap(file, { imageOrientation: "from-image" });
    return { draw: b, width: b.width, height: b.height, close: () => b.close() };
  } catch {
    // Fallback: some browsers decode more formats through <img> than createImageBitmap.
    const url = URL.createObjectURL(file);
    try {
      const img = new window.Image();
      img.decoding = "async";
      img.src = url;
      await img.decode();
      return { draw: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
    } catch {
      URL.revokeObjectURL(url);
      throw new Error(`Couldn't read ${file.name}. Try saving it as JPG, PNG or WebP and uploading again.`);
    }
  }
}

/** WebP when the browser can make it (Chrome, Edge, Firefox), otherwise JPEG (older Safari / iPhone). */
let outputType: "image/webp" | "image/jpeg" | null = null;
async function pickOutputType(): Promise<"image/webp" | "image/jpeg"> {
  if (outputType) return outputType;
  const c = document.createElement("canvas");
  c.width = c.height = 2;
  const b = await new Promise<Blob | null>((r) => c.toBlob(r, "image/webp", 0.8));
  outputType = b?.type === "image/webp" ? "image/webp" : "image/jpeg";
  return outputType;
}

/** Resize and re-encode every upload (target ~500 KB, longest side ≤ 1800 px) before it is sent. */
async function compressImage(file: File): Promise<File> {
  const src = await decode(file);
  try {
    const type = await pickOutputType();
    let edge = Math.min(MAX_EDGE, Math.max(src.width, src.height));
    let quality = 0.82;
    let blob: Blob;
    for (;;) {
      const scale = edge / Math.max(src.width, src.height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(src.width * scale));
      canvas.height = Math.max(1, Math.round(src.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Image compression isn't available in this browser.");
      if (type === "image/jpeg") {
        // JPEG has no transparency: put see-through areas (e.g. PNG logos) on white, not black.
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(src.draw, 0, 0, canvas.width, canvas.height);

      blob = await canvasBlob(canvas, type, quality);
      while (blob.size > TARGET_BYTES && quality > 0.6) {
        quality = Math.max(0.6, quality - 0.08);
        blob = await canvasBlob(canvas, type, quality);
      }
      // Still heavy (very detailed photo): make it a bit smaller and try again.
      if (blob.size <= TARGET_BYTES || edge <= MIN_EDGE) break;
      edge = Math.max(MIN_EDGE, Math.round(edge * 0.8));
    }

    // Already small and not bigger than needed: keep the original if it is lighter.
    const keepOriginal = ["image/jpeg", "image/webp"].includes(file.type) && file.size <= blob.size && Math.max(src.width, src.height) <= MAX_EDGE;
    if (keepOriginal) return file;
    if (blob.size > MAX_UPLOAD_BYTES) throw new Error(`${file.name} is still over 5 MB after compression. Try a smaller image.`);
    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "image"}.${ext}`, { type: blob.type || type, lastModified: Date.now() });
  } finally {
    src.close();
  }
}

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Image compression failed. Please try another image."))), type, quality);
  });
}

type Props = {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  folder: "products" | "categories" | "banners" | "brand" | "blog";
  /** Sub-folders under `folder`, e.g. ["mugs", "tapered"] or ["speckled-mug"]. Empty parts are skipped. */
  path?: string[];
  max?: number;
  label?: string;
};

/** Multi-image picker: upload, reorder (first = cover), alt text, remove. */
export function ImageUploader({ value, onChange, folder, path = [], max = 12, label = "Photos" }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const room = max - value.length;
    const list = Array.from(files).slice(0, room);
    setBusy(list.length);
    const added: UploadedImage[] = [];
    for (const file of list) {
      try {
        const compressed = await compressImage(file);
        const fd = new FormData();
        fd.set("file", compressed);
        fd.set("folder", folder);
        fd.set("path", path.map((p) => p.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60)).filter(Boolean).join("/"));
        const res = await uploadImageAction(fd);
        if (res.ok) added.push({ url: res.data.url, publicId: res.data.publicId, alt: "" });
        else setError(res.error);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Image upload failed.");
      } finally {
        setBusy((b) => b - 1);
      }
    }
    onChange([...value, ...added]);
    if (input.current) input.current.value = "";
  }

  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    const [item] = next.splice(i, 1);
    next.splice(i + d, 0, item!);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {value.map((img, i) => (
          <li key={img.publicId + i} className="group space-y-2">
            <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-line bg-surface">
              <Image src={img.url} alt={img.alt || `${label} ${i + 1}`} fill sizes="200px" className="object-cover" />
              {i === 0 && value.length > 1 && <span className="absolute left-2 top-2 rounded-pill bg-ink px-2 py-0.5 text-[11px] text-canvas">Shown first</span>}
              <div className="absolute inset-x-2 bottom-2 flex justify-between gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                <span className="flex gap-1">
                  {i > 0 && <IconBtn label="Show this photo first" onClick={() => onChange([img, ...value.filter((_, j) => j !== i)])}><Star /></IconBtn>}
                  <IconBtn label="Move left" disabled={i === 0} onClick={() => move(i, -1)}><ArrowLeft /></IconBtn>
                  <IconBtn label="Move right" disabled={i === value.length - 1} onClick={() => move(i, 1)}><ArrowRight /></IconBtn>
                </span>
                <IconBtn label="Remove image" onClick={() => onChange(value.filter((_, j) => j !== i))}><X /></IconBtn>
              </div>
            </div>
            <input
              aria-label={`Alt text for image ${i + 1}`}
              placeholder="Describe the photo"
              value={img.alt}
              onChange={(e) => onChange(value.map((v, j) => (j === i ? { ...v, alt: e.target.value } : v)))}
              className="min-h-9 w-full rounded-md border border-line bg-paper/80 px-2 text-xs focus:border-ink focus:outline-none"
            />
          </li>
        ))}

        {value.length < max && (
          <li>
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={busy > 0}
              className={cn(
                "flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-ink/25 text-sm text-muted transition-colors hover:border-ink hover:bg-surface hover:text-ink",
                busy > 0 && "cursor-wait",
              )}
            >
              {busy > 0 ? <Loader2 className="size-6 animate-spin" aria-hidden /> : <ImagePlus className="size-6" strokeWidth={1.5} aria-hidden />}
              {busy > 0 ? `Uploading ${busy}…` : "Add photos"}
            </button>
          </li>
        )}
      </ul>
      <input ref={input} type="file" accept="image/*" multiple className="sr-only" tabIndex={-1} onChange={(e) => upload(e.target.files)} />
      <p className="text-xs text-muted">JPG, PNG, WebP, AVIF or iPhone photos. Each image is automatically resized and compressed (usually under 500 KB) before upload. The photo marked “Shown first” is the one customers see first; tap ★ on another photo to show it first.</p>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}

function IconBtn({ children, label, onClick, disabled }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-8 items-center justify-center rounded-full bg-canvas/95 text-ink shadow-sm transition-opacity disabled:opacity-30 [&_svg]:size-4"
    >
      {children}
    </button>
  );
}
