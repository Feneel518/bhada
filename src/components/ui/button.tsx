import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-[color,background-color,border-color,box-shadow,transform,opacity] outline-none focus-visible:ring-4 focus-visible:ring-[#5b5bd6]/15 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#5b5bd6] text-white shadow-sm shadow-indigo-200 hover:bg-[#4d4dc4] hover:-translate-y-0.5",
        outline: "border border-[#e1e3eb] bg-white text-[#343a49] shadow-sm hover:border-[#cfd2dd] hover:bg-[#fafafd]",
        ghost: "text-[#666d7e] hover:bg-[#f0f1f6] hover:text-[#262c39]",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 rounded-lg px-3",
        icon: "size-10 px-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
