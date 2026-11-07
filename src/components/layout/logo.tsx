import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { defaultSiteConfig, type SiteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type Brand = SiteConfig["logo"];

/** The store logo from Admin → Studio → Header & logo: a text wordmark or an uploaded image. */
export function Logo({ className, onClick, brand = defaultSiteConfig.logo }: { className?: string; onClick?: () => void; brand?: Brand }) {
  return (
    <Link href="/" data-studio="logo" onClick={onClick} className={cn("inline-flex min-h-touch items-center", className)} aria-label={`${siteConfig.name} home`}>
      {brand.type === "image" && brand.image ? (
        <Image
          src={brand.image.url}
          alt={brand.image.alt || siteConfig.name}
          width={brand.height * 5}
          height={brand.height}
          priority
          className="w-auto object-contain"
          style={{ height: brand.height }}
        />
      ) : brand.style === "monogram" ? (
        <Monogram brand={brand} />
      ) : (
        <Wordmark brand={brand} className="text-[28px] md:text-[32px]" />
      )}
    </Link>
  );
}

/** Text logo: "Clay" + italic accent "&" + "Glaze". Also used for the big footer wordmark. */
export function Wordmark({ brand = defaultSiteConfig.logo, className, accentClassName = "text-accent" }: { brand?: Brand; className?: string; accentClassName?: string }) {
  return (
    <span className={cn("font-display leading-none tracking-tight", className)}>
      {brand.textBefore}
      {brand.textAccent && <> <span className={cn("italic", accentClassName)}>{brand.textAccent}</span></>}
      {brand.textAfter && <> {brand.textAfter}</>}
    </span>
  );
}

/** Monogram logo: initials in an outlined square above the name in spaced capitals (e.g. Nibbea). */
export function Monogram({ brand = defaultSiteConfig.logo, className }: { brand?: Brand; className?: string }) {
  const name = [brand.textBefore, brand.textAccent, brand.textAfter].filter(Boolean).join(" ").trim();
  const mark = (brand.mark || name.slice(0, 1)).toUpperCase();
  return (
    <span className={cn("inline-flex flex-col items-center gap-1 leading-none", className)}>
      <span className="flex size-10 items-center justify-center border-[2.5px] border-current font-display text-xl font-bold tracking-tight md:size-11">{mark}</span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.32em]">{name}</span>
    </span>
  );
}
