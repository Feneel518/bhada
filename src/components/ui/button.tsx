import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex h-10 items-center justify-center gap-2 rounded-none px-4 text-sm font-semibold transition-[color,background-color,border-color,box-shadow,transform,opacity] outline-none focus-visible:ring-2 focus-visible:ring-[#e4c77a]/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border border-[#edede8] bg-[#edede8] text-[#111111] hover:border-white hover:bg-white",
        outline: "border border-[#d5d5d0] bg-white text-[#272724] hover:border-[#a7a79f] hover:bg-[#f5f5f0]",
        ghost: "text-[#666d7e] hover:bg-[#f0f1f6] hover:text-[#262c39]",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3",
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
