"use client";

/** Side panel (shadcn "sheet" pattern on Radix Dialog). Used for the desktop category menu. */
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;
export const SheetTitle = Dialog.Title;

export function SheetContent({
  className,
  children,
  side = "left",
  ...props
}: React.ComponentProps<typeof Dialog.Content> & { side?: "left" | "right" }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <Dialog.Content
        className={cn(
          "fixed inset-y-0 z-50 flex w-[min(360px,90vw)] flex-col bg-canvas p-6 shadow-float data-[state=open]:animate-in data-[state=open]:duration-300",
          side === "left" ? "left-0 data-[state=open]:slide-in-from-left" : "right-0 data-[state=open]:slide-in-from-right",
          className,
        )}
        {...props}
      >
        {children}
        <Dialog.Close className="absolute right-3 top-3 inline-flex size-touch items-center justify-center rounded-lg text-ink hover:bg-surface">
          <X className="size-5" />
          <span className="sr-only">Close</span>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
