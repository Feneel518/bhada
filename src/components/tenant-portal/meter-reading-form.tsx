"use client";

import { useActionState, useState } from "react";
import { Check, Gauge, LoaderCircle } from "lucide-react";
import { submitMeterReading, type MeterState } from "@/app/t/actions";
import { formatCurrency } from "@/lib/utils";

const initial: MeterState = { status: "idle", message: "" };
const inputClass = "mt-1.5 h-12 w-full border border-black/25 bg-white px-3 text-base text-black outline-none focus:border-black";

function todayInIndia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

export function MeterReadingForm({
  token,
  lastReading,
  rate,
  landlordName,
}: {
  token: string;
  lastReading: number;
  rate: number | null;
  landlordName: string;
}) {
  const [state, action, pending] = useActionState(submitMeterReading, initial);
  const [open, setOpen] = useState(false);
  const [reading, setReading] = useState("");
  const value = Number(reading);
  const units = reading && Number.isFinite(value) && value >= lastReading ? value - lastReading : null;

  if (state.status === "success") {
    return (
      <p role="status" className="flex items-start gap-2 border border-[#2f7d5b]/40 bg-[#e9f5ee] p-4 text-sm text-[#1f5a40]">
        <Check className="mt-0.5 size-4 shrink-0" /> {state.message}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-full items-center justify-center gap-2 border-2 border-black bg-white text-base font-semibold"
      >
        <Gauge className="size-5" /> Enter meter reading
      </button>
    );
  }

  return (
    <form action={action} className="space-y-4 border border-black/20 bg-white p-4">
      <input type="hidden" name="token" value={token} />
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium">
          Meter reading now
          <input
            name="reading"
            inputMode="decimal"
            required
            autoFocus
            value={reading}
            onChange={(event) => setReading(event.target.value)}
            placeholder={`More than ${lastReading}`}
            aria-invalid={Boolean(state.errors?.reading)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          Read on
          <input name="readingDate" type="date" required defaultValue={todayInIndia()} max={todayInIndia()} aria-invalid={Boolean(state.errors?.readingDate)} className={inputClass} />
        </label>
      </div>
      {state.errors?.reading && <p className="text-xs text-[#b3402a]">{state.errors.reading}</p>}
      {state.errors?.readingDate && <p className="text-xs text-[#b3402a]">{state.errors.readingDate}</p>}
      {units !== null && (
        <p className="border border-black/15 bg-[#f7f7f3] p-3 text-sm" aria-live="polite">
          {units.toLocaleString("en-IN", { maximumFractionDigits: 3 })} units used
          {rate ? <> × {formatCurrency(rate)} = <strong>{formatCurrency(units * rate)}</strong></> : ""}
        </p>
      )}
      <label className="block text-sm font-medium">
        Note <span className="font-normal text-black/50">(optional)</span>
        <input name="note" maxLength={200} className={inputClass} placeholder="e.g. Meter photo sent on WhatsApp" />
      </label>
      {state.status === "error" && !state.errors && <p className="text-sm text-[#b3402a]">{state.message}</p>}
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <button type="button" onClick={() => setOpen(false)} className="h-12 px-4 text-sm text-black/60">Cancel</button>
        <button type="submit" disabled={pending} className="flex h-12 items-center justify-center gap-2 bg-black text-base font-semibold text-white disabled:opacity-60">
          {pending && <LoaderCircle className="size-4 animate-spin" />} Send to {landlordName}
        </button>
      </div>
    </form>
  );
}
