"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

type DialogContentProps = React.ComponentProps<typeof DialogPrimitive.Content> & {
  tone?: "dark" | "light";
};

export function DialogContent({
  className,
  children,
  tone = "dark",
  ...props
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="bhada-dialog-overlay fixed inset-0 z-50 bg-black/75" />
      <DialogPrimitive.Content
        data-bhada-dialog={tone}
        className={cn(
          "bhada-dialog-content scrollbar-none fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-[500px] overflow-y-auto overscroll-contain rounded-none border border-white/15 bg-[#171717] p-5 text-[#edede8] shadow-[0_24px_72px_rgba(0,0,0,.48)] outline-none sm:w-[calc(100%-2rem)] sm:p-6",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 grid size-9 place-items-center border border-transparent text-white/40 transition-colors hover:border-white/10 hover:bg-white/5 hover:text-[#e4c77a] sm:right-5 sm:top-5">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle(props: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className="font-display text-xl font-bold tracking-[-0.03em]" {...props} />;
}

export function DialogDescription(props: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className="mt-1 text-sm leading-6 text-white/45" {...props} />;
}
