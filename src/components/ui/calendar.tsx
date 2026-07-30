"use client";

import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "relative flex flex-col gap-4 sm:flex-row",
        month: "space-y-4",
        month_caption: "relative flex h-9 items-center justify-center",
        caption_label: "text-sm font-bold text-[#353b4a]",
        dropdowns: "flex items-center justify-center gap-1",
        dropdown:
          "absolute inset-0 cursor-pointer opacity-0",
        dropdown_root:
          "relative rounded-none border border-white/15 px-2 py-1 pr-6 text-sm font-semibold",
        nav: "absolute inset-x-0 top-3 flex items-center justify-between px-3",
        button_previous:
          "grid size-8 place-items-center rounded-none text-white/45 outline-none hover:bg-[#e4c77a]/10 hover:text-[#e4c77a] focus-visible:ring-2 focus-visible:ring-[#e4c77a]/30",
        button_next:
          "grid size-8 place-items-center rounded-none text-white/45 outline-none hover:bg-[#e4c77a]/10 hover:text-[#e4c77a] focus-visible:ring-2 focus-visible:ring-[#e4c77a]/30",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "w-9 rounded-none text-center text-[0.72rem] font-semibold text-white/35",
        week: "mt-1 flex w-full",
        day: "relative size-9 p-0 text-center text-sm",
        day_button:
          "grid size-9 place-items-center rounded-none text-sm outline-none transition hover:bg-[#e4c77a]/10 hover:text-[#e4c77a] focus-visible:ring-2 focus-visible:ring-[#e4c77a]/30",
        selected:
          "[&>button]:bg-[#e4c77a] [&>button]:font-semibold [&>button]:text-[#111111] [&>button:hover]:bg-[#f0da9d] [&>button:hover]:text-[#111111]",
        today:
          "[&>button]:border [&>button]:border-[#b9b9ef] [&>button]:font-semibold [&>button]:text-[#4f4fc3]",
        outside: "text-[#c2c6d0] opacity-50",
        disabled: "text-[#c2c6d0] opacity-40",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: iconClassName }) => {
          const Icon =
            orientation === "left"
              ? ChevronLeft
              : orientation === "right"
                ? ChevronRight
                : ChevronDown;
          return <Icon className={cn("size-4", iconClassName)} />;
        },
      }}
      {...props}
    />
  );
}
