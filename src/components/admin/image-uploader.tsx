"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { uploadImageAction } from "@/actions/admin/catalog.actions";
import { cn } from "@/lib/utils";

export type UploadedImage = { url: string; publicId: string; alt: string };

type Props = {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  folder: "products" | "categories" | "banners" | "brand";
  max?: number;
  label?: string;
};

/** Multi-image picker: upload, reorder (first = cover), alt text, remove. */
export function ImageUploader({ value, onChange, folder, max = 12, label = "Photos" }: Props) {
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
      const fd = new FormData();
      fd.set("file", file);
      fd.set("folder", folder);
      const res = await uploadImageAction(fd);
      if (res.ok) added.push({ url: res.data.url, publicId: res.data.publicId, alt: "" });
      else setError(res.error);
      setBusy((b) => b - 1);
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
              {i === 0 && <span className="absolute left-2 top-2 rounded-pill bg-ink px-2 py-0.5 text-[11px] text-canvas">Cover</span>}
              <div className="absolute inset-x-2 bottom-2 flex justify-between gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                <span className="flex gap-1">
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
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" tabIndex={-1} onChange={(e) => upload(e.target.files)} />
      <p className="text-xs text-muted">JPG, PNG, WebP or AVIF, up to 5 MB each. The first photo is the cover.</p>
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
