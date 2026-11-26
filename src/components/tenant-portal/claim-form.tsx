"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { submitPaymentClaim, type ClaimState } from "@/app/t/actions";

const methods = [
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cash", label: "Cash" },
  { value: "check", label: "Cheque" },
] as const;

const initial: ClaimState = { status: "idle", message: "" };

function todayInIndia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

const inputClass = "mt-1.5 h-12 w-full border border-black/25 bg-white px-3 text-base text-black outline-none focus:border-black";

export function ClaimForm({ token, suggestedAmount, landlordName }: { token: string; suggestedAmount: number; landlordName: string }) {
  const [state, action, pending] = useActionState(submitPaymentClaim, initial);
  const [method, setMethod] = useState<(typeof methods)[number]["value"]>("upi");
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  if (!open && state.status !== "success") {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-full items-center justify-center gap-2 border-2 border-black bg-white text-base font-semibold text-black"
      >
        <Check className="size-5" /> I’ve paid
      </button>
    );
  }

  if (state.status === "success") {
    return (
      <p role="status" className="flex items-start gap-2 border border-[#2f7d5b]/40 bg-[#e9f5ee] p-4 text-sm text-[#1f5a40]">
        <Check className="mt-0.5 size-4 shrink-0" /> {state.message}
      </p>
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-4 border border-black/20 bg-white p-4">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="method" value={method} />
      <p className="text-sm text-black/70">Tell {landlordName} what you paid. They’ll check and confirm it.</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium">
          Amount (₹)
          <input
            name="amount"
            inputMode="decimal"
            required
            defaultValue={suggestedAmount > 0 ? String(Math.round(suggestedAmount * 100) / 100) : ""}
            aria-invalid={Boolean(state.errors?.amount)}
            className={inputClass}
          />
          {state.errors?.amount && <span className="mt-1 block text-xs text-[#b3402a]">{state.errors.amount}</span>}
        </label>
        <label className="block text-sm font-medium">
          Paid on
          <input name="paidOn" type="date" required defaultValue={todayInIndia()} max={todayInIndia()} aria-invalid={Boolean(state.errors?.paidOn)} className={inputClass} />
          {state.errors?.paidOn && <span className="mt-1 block text-xs text-[#b3402a]">{state.errors.paidOn}</span>}
        </label>
      </div>
      <fieldset>
        <legend className="text-sm font-medium">How did you pay?</legend>
        <div className="mt-1.5 grid grid-cols-4 gap-1.5">
          {methods.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={method === item.value}
              onClick={() => setMethod(item.value)}
              className={method === item.value ? "h-10 border-2 border-black bg-black text-xs font-semibold text-white" : "h-10 border border-black/25 text-xs text-black/70"}
            >
              {item.label}
            </button>
          ))}
        </div>
      </fieldset>
      {method !== "cash" && (
        <label className="block text-sm font-medium">
          {method === "check" ? "Cheque number" : "UPI / UTR reference"} <span className="font-normal text-black/50">(helps them find it)</span>
          <input
            name="reference"
            autoComplete="off"
            inputMode={method === "upi" ? "numeric" : "text"}
            placeholder={method === "upi" ? "12-digit UPI ref no." : ""}
            aria-invalid={Boolean(state.errors?.reference)}
            className={inputClass}
          />
          {state.errors?.reference && <span className="mt-1 block text-xs text-[#b3402a]">{state.errors.reference}</span>}
        </label>
      )}
      <label className="block text-sm font-medium">
        Note <span className="font-normal text-black/50">(optional)</span>
        <input name="note" maxLength={300} className={inputClass} placeholder="e.g. November rent" />
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
