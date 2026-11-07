"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Form controls for the dashboard. Every control has a visible label and a >= 44px target. */

const control =
  "w-full rounded-md border border-line bg-paper/80 px-3 text-[15px] text-ink placeholder:text-muted/70 transition-colors focus:border-ink focus:outline-none aria-[invalid=true]:border-danger disabled:opacity-50";

type FieldProps = { label: string; hint?: React.ReactNode; error?: string; className?: string; children: React.ReactNode; htmlFor?: string };

export function Field({ label, hint, error, className, children, htmlFor }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? <p className="text-sm text-danger">{error}</p> : hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cn(control, "min-h-touch", className)} {...p} />
));
TextInput.displayName = "TextInput";

export const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, ref) => (
  <textarea ref={ref} className={cn(control, "min-h-28 py-2.5 leading-relaxed", className)} {...p} />
));
TextArea.displayName = "TextArea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...p }, ref) => (
  <select ref={ref} className={cn(control, "min-h-touch cursor-pointer pr-8", className)} {...p} />
));
Select.displayName = "Select";

export function Toggle({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  const id = React.useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-sm font-medium">{label}</label>
        {description && <p className="text-xs text-muted">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300 disabled:opacity-50",
          checked ? "bg-ink" : "bg-line",
        )}
      >
        <span className={cn("inline-block size-5 rounded-full bg-white shadow transition-transform duration-300", checked ? "translate-x-6" : "translate-x-1")} />
      </button>
    </div>
  );
}

/** Inline result message after a save. */
export function FormMessage({ result }: { result: { ok: boolean; message: string } | null }) {
  if (!result) return null;
  return (
    <p role={result.ok ? "status" : "alert"} className={cn("text-sm", result.ok ? "text-ready" : "text-danger")}>
      {result.message}
    </p>
  );
}

/** Submits its parent GET form when changed (filters). */
export function AutoSubmitSelect(props: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const { label, className, ...rest } = props;
  return (
    <label className="min-w-[160px]">
      <span className="sr-only">{label}</span>
      <Select {...rest} aria-label={label} className={cn("rounded-pill", className)} onChange={(e) => e.currentTarget.form?.requestSubmit()} />
    </label>
  );
}
