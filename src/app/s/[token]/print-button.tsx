"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Print / Save PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-10 items-center gap-2 border border-black/80 px-4 text-sm font-semibold text-black hover:bg-black hover:text-white"
    >
      <Printer className="size-4" /> {label}
    </button>
  );
}
