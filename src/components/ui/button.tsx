import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Pill buttons, see DESIGN.md › Components. Every size keeps a >= 44px target. */
const buttonVariants = cva(
  "group/btn relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill font-medium transition-[background-color,color,border-color,transform] duration-300 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-[18px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // btn-primary: hook for the brand gradient (Admin → Studio)
        primary: "btn-primary bg-ink text-canvas hover:bg-ink/85",
        accent: "bg-accent text-on-accent hover:bg-accent/90",
        secondary: "border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-canvas",
        outline: "border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-canvas",
        light: "bg-canvas text-ink hover:bg-paper",
        quiet: "text-ink hover:bg-surface",
        ghost: "text-ink hover:bg-surface",
        link: "rounded-none px-0 text-ink underline-offset-4 hover:underline",
      },
      size: {
        sm: "min-h-touch px-4 text-sm",
        md: "min-h-12 px-6 text-[15px]",
        lg: "min-h-14 px-8 text-base",
        icon: "size-touch",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";

/** Arrow that nudges on button hover: <Button>Shop <ButtonArrow /></Button> */
export function ButtonArrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className="transition-transform duration-300 ease-out group-hover/btn:translate-x-1">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export { buttonVariants };
