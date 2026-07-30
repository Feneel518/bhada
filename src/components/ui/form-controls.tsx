"use client";

import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Option = {
  value: string;
  label: string;
  disabled?: boolean;
};

export function FormSelect({
  name,
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select an option",
  className,
  required,
  invalid,
}: {
  name?: string;
  options: Option[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  invalid?: boolean;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const selectedValue = value ?? internalValue;

  function change(nextValue: string) {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  }

  return (
    <>
      {name && <input type="hidden" name={name} value={selectedValue} />}
      <Select value={selectedValue || undefined} onValueChange={change} required={required}>
        <SelectTrigger className={className} aria-invalid={invalid}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

function parseDate(value?: string | null) {
  if (!value) return undefined;
  const [year, month, day = 1] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

export function DatePickerInput({
  name,
  defaultValue,
  placeholder = "Pick a date",
  className,
  invalid,
  required,
  monthOnly = false,
}: {
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  className?: string;
  invalid?: boolean;
  required?: boolean;
  monthOnly?: boolean;
}) {
  const [date, setDate] = useState<Date | undefined>(() => parseDate(defaultValue));
  const serialized = date ? format(date, monthOnly ? "yyyy-MM" : "yyyy-MM-dd") : "";

  return (
    <>
      <input type="hidden" name={name} value={serialized} />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            aria-invalid={invalid}
            aria-required={required}
            className={cn(
              "h-11 w-full justify-start rounded-none border-white/[0.09] bg-white/[0.018] px-3.5 text-left text-sm font-normal text-[#edede8]/85 shadow-none hover:translate-y-0 hover:border-white/15 hover:bg-white/[0.025]",
              !date && "text-white/25",
              invalid && "border-[#c96a4e]/55",
              className,
            )}
          >
            <CalendarDays className="size-4 text-white/35" />
            {date ? format(date, monthOnly ? "MMMM yyyy" : "dd MMM yyyy") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start">
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={date}
            onSelect={(nextDate) => {
              if (!nextDate) {
                if (!required) setDate(undefined);
                return;
              }
              setDate(monthOnly ? new Date(nextDate.getFullYear(), nextDate.getMonth(), 1) : nextDate);
            }}
            initialFocus
          />
          {monthOnly && (
            <p className="border-t border-[#eceef3] px-3 py-2 text-center text-[11px] text-[#858b9a]">
              Pick any day in the billing month.
            </p>
          )}
        </PopoverContent>
      </Popover>
    </>
  );
}
