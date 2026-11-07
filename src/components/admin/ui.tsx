import { ScrollRow } from "./scroll-row";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ORDER_STATUS_LABEL, type OrderStatus, type ReturnStatus, type ReviewStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

/* ───────────── Layout ───────────── */

export function PageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 space-y-2">
        {back && (
          <Link href={back.href} className="inline-flex min-h-9 items-center gap-1 text-sm text-muted hover:text-ink">
            <ChevronLeft className="size-4" aria-hidden /> {back.label}
          </Link>
        )}
        <h1 className="text-[clamp(2rem,3vw,2.75rem)] leading-none">{title}</h1>
        {description && <p className="max-w-2xl text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Card({ title, action, children, className, padded = true }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={cn("rounded-lg border border-line bg-paper/60", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          {title && <h2 className="font-sans text-[15px] font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      <div className={cn(padded && "p-5")}>{children}</div>
    </section>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line px-6 py-14 text-center">
      <p className="font-display text-2xl">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-muted">{children}</div>}
    </div>
  );
}

/* ───────────── Status pills (always text + colour, never colour alone) ───────────── */

type Tone = "neutral" | "warn" | "good" | "bad" | "info" | "muted";
const TONES: Record<Tone, string> = {
  neutral: "bg-ink/[0.07] text-ink",
  warn: "bg-mto/10 text-mto",
  good: "bg-ready/10 text-ready",
  bad: "bg-danger/10 text-danger",
  info: "bg-accent/10 text-accent",
  muted: "bg-sold/10 text-sold",
};

export function Pill({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 py-0.5 text-xs font-medium", TONES[tone], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}

const ORDER_TONE: Record<OrderStatus, Tone> = {
  PENDING_PAYMENT: "muted",
  AWAITING_APPROVAL: "warn",
  CONFIRMED: "neutral",
  IN_PRODUCTION: "neutral",
  DISPATCHED: "info",
  DELIVERED: "good",
  CANCELLED: "bad",
  RETURNED: "muted",
};
export const OrderStatusPill = ({ status }: { status: OrderStatus }) => <Pill tone={ORDER_TONE[status]}>{ORDER_STATUS_LABEL[status]}</Pill>;

const PAYMENT_TONE: Record<string, Tone> = { PAID: "good", PENDING: "muted", FAILED: "bad", REFUNDED: "muted", PARTIALLY_REFUNDED: "warn" };
export const PaymentPill = ({ status }: { status: string }) => (
  <Pill tone={PAYMENT_TONE[status] ?? "muted"}>{status.charAt(0) + status.slice(1).toLowerCase().replace("_", " ")}</Pill>
);

const REVIEW_TONE: Record<ReviewStatus, Tone> = { PENDING: "warn", APPROVED: "good", REJECTED: "bad" };
export const ReviewStatusPill = ({ status }: { status: ReviewStatus }) => <Pill tone={REVIEW_TONE[status]}>{status.charAt(0) + status.slice(1).toLowerCase()}</Pill>;

const RETURN_TONE: Record<ReturnStatus, Tone> = { REQUESTED: "warn", APPROVED: "info", RECEIVED: "neutral", REJECTED: "bad", REFUNDED: "good" };
export const ReturnStatusPill = ({ status }: { status: ReturnStatus }) => <Pill tone={RETURN_TONE[status]}>{status.charAt(0) + status.slice(1).toLowerCase()}</Pill>;

const PRODUCT_TONE: Record<string, Tone> = { ACTIVE: "good", DRAFT: "muted", ARCHIVED: "bad" };
export const ProductStatusPill = ({ status }: { status: string }) => <Pill tone={PRODUCT_TONE[status] ?? "muted"}>{status.charAt(0) + status.slice(1).toLowerCase()}</Pill>;

/* ───────────── Tables ───────────── */

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-lg border border-line bg-paper/60", className)}>
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">{children}</table>
    </div>
  );
}
export const Th = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <th scope="col" className={cn("border-b border-line px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted", className)}>
    {children}
  </th>
);
export const Td = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <td className={cn("border-b border-line/70 px-4 py-3 align-middle", className)}>{children}</td>
);

/* ───────────── Filters (plain GET forms, work without JS) ───────────── */

export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <form method="get" className="mb-6 flex flex-wrap items-end gap-3" role="search">
      {children}
    </form>
  );
}

export function SearchInput({ name = "q", defaultValue, placeholder }: { name?: string; defaultValue?: string; placeholder: string }) {
  return (
    <label className="min-w-[220px] flex-1">
      <span className="sr-only">{placeholder}</span>
      <input
        type="search"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="min-h-touch w-full rounded-pill border border-line bg-paper/70 px-4 text-sm placeholder:text-muted focus:border-ink focus:outline-none"
      />
    </label>
  );
}

export function Tabs({ items, current }: { items: { href: string; label: string; count?: number; value: string }[]; current: string }) {
  return (
    <ScrollRow label="Sections" className="-mx-1">
      {items.map((t) => {
        const active = t.value === current;
        return (
          <Link
            key={t.value}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm transition-colors",
              active ? "bg-ink text-canvas" : "text-muted hover:bg-surface hover:text-ink",
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={cn("rounded-pill px-1.5 text-xs tabular-nums", active ? "bg-canvas/20" : "bg-surface")}>{t.count}</span>
            )}
          </Link>
        );
      })}
    </ScrollRow>
  );
}

export function Pagination({ page, pageCount, href }: { page: number; pageCount: number; href: (p: number) => string }) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
      <span className="text-muted">
        Page {page} of {pageCount}
      </span>
      <div className="flex gap-2">
        {page > 1 && <Link className="inline-flex min-h-touch items-center rounded-pill border border-line px-4 hover:bg-surface" href={href(page - 1)}>Previous</Link>}
        {page < pageCount && <Link className="inline-flex min-h-touch items-center rounded-pill border border-line px-4 hover:bg-surface" href={href(page + 1)}>Next</Link>}
      </div>
    </nav>
  );
}

export const dateTime = (iso: string | Date) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
export const dateOnly = (iso: string | Date) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
