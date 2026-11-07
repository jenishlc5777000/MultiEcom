"use client";

/** Bottom sheet (shadcn "drawer" pattern on vaul): swipe down to dismiss on mobile. */
import * as React from "react";
import { Drawer as Vaul } from "vaul";
import { cn } from "@/lib/utils";

export const Drawer = Vaul.Root;
export const DrawerTrigger = Vaul.Trigger;
export const DrawerClose = Vaul.Close;

export function DrawerContent({ className, children, ...props }: React.ComponentProps<typeof Vaul.Content>) {
  return (
    <Vaul.Portal>
      <Vaul.Overlay className="fixed inset-0 z-50 bg-ink/40" />
      <Vaul.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[85dvh] flex-col rounded-t-[20px] bg-canvas pb-safe shadow-float",
          className,
        )}
        {...props}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-surface-strong" aria-hidden />
        {children}
      </Vaul.Content>
    </Vaul.Portal>
  );
}

export function DrawerHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 pb-2 pt-4", className)} {...props} />;
}

export const DrawerTitle = ({ className, ...props }: React.ComponentProps<typeof Vaul.Title>) => (
  <Vaul.Title className={cn("font-display text-xl text-ink", className)} {...props} />
);
export const DrawerDescription = Vaul.Description;
