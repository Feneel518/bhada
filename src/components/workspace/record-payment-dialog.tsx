"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DatePickerInput, FormSelect } from "@/components/ui/form-controls";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { recordPayment, type PaymentActionState } from "@/app/dashboard/payments/actions";
import type { TenantRecord } from "@/lib/tenants";
import { cn, formatCurrency } from "@/lib/utils";
import { Field, FieldError, inputClass } from "@/components/workspace/shared";

type AllocationDraft = {
  id: string;
  chargeType: "rent" | "light_bill" | "other";
  description: string;
  billReference: string;
  amount: string;
  gstRate: string;
};

export const initialPaymentState: PaymentActionState = { status: "idle", message: "" };

export function emptyAllocation(id = "initial"): AllocationDraft {
  return { id, chargeType: "rent", description: "", billReference: "", amount: "", gstRate: "0" };
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  tenants,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenants: TenantRecord[];
}) {
  const [state, formAction, pending] = useActionState(recordPayment, initialPaymentState);
  const [mode, setMode] = useState<"lump_sum" | "bill_wise">("lump_sum");
  const [allocations, setAllocations] = useState<AllocationDraft[]>([
    { ...emptyAllocation(), chargeType: "rent", description: "Monthly rent" },
  ]);

  useEffect(() => {
    if (state.status !== "success") return;
    toast.success("Payment recorded", { description: state.message });
    onOpenChange(false);
  }, [onOpenChange, state]);

  function changeMode(nextMode: "lump_sum" | "bill_wise") {
    setMode(nextMode);
    setAllocations(
      nextMode === "lump_sum"
        ? [{ ...emptyAllocation(), chargeType: "rent", description: "Monthly rent" }]
        : [emptyAllocation()],
    );
  }

  function updateAllocation(id: string, values: Partial<AllocationDraft>) {
    setAllocations((current) =>
      current.map((allocation) => allocation.id === id ? { ...allocation, ...values } : allocation),
    );
  }

  const total = allocations.reduce((sum, allocation) => {
    const amount = Number(allocation.amount) || 0;
    return sum + amount + (amount * (Number(allocation.gstRate) || 0)) / 100;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[780px] overflow-y-auto">
        <DialogTitle>Record a payment</DialogTitle>
        <DialogDescription>
          Record a lump-sum receipt or allocate it bill by bill, including GST where applicable.
        </DialogDescription>
        <form action={formAction} className="mt-6 space-y-5">
          <input type="hidden" name="allocationMode" value={mode} />
          <input
            type="hidden"
            name="allocations"
            value={JSON.stringify(allocations.map((allocation) => ({
              chargeType: allocation.chargeType,
              description: allocation.description,
              billReference: allocation.billReference,
              amount: allocation.amount,
              gstRate: allocation.gstRate,
            })))}
          />
          <Field label="Tenant">
            <FormSelect
              required
              className={inputClass}
              name="tenantId"
              defaultValue=""
              invalid={Boolean(state.errors?.tenantId)}
              placeholder="Select a tenant"
              options={tenants.map((item) => ({
                value: item.id,
                label: `${item.name} — ${item.propertyName} · Unit ${item.unitNumber}`,
              }))}
            />
            {state.errors?.tenantId && <FieldError message={state.errors.tenantId} />}
          </Field>

          <div>
            <p className="mb-2 text-xs font-semibold text-white/65">Allocation</p>
            <div className="grid grid-cols-2 border border-white/[0.08] bg-white/[0.02] p-1">
              {([
                ["lump_sum", "Lump sum"],
                ["bill_wise", "Bill wise"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => changeMode(value)}
                  className={cn(
                    "h-9 text-xs font-bold transition-colors",
                    mode === value ? "bg-[#e4c77a] text-[#111111]" : "text-white/40 hover:text-white/65",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {mode === "lump_sum" ? (
            <PaymentAmountFields
              allocation={allocations[0]}
              onChange={(values) => updateAllocation(allocations[0].id, values)}
            />
          ) : (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white/65">Bills paid</p>
                  <p className="mt-1 text-[11px] text-[#8b91a0]">Add rent, light bill, or any other charge.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAllocations((current) => [...current, emptyAllocation(crypto.randomUUID())])}
                >
                  <Plus className="size-3.5" /> Add bill
                </Button>
              </div>
              {allocations.map((allocation, index) => (
                <div key={allocation.id} className="border border-white/[0.09] bg-white/[0.018] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">Bill {index + 1}</p>
                    {allocations.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Remove bill ${index + 1}`}
                        onClick={() => setAllocations((current) => current.filter((item) => item.id !== allocation.id))}
                        className="grid size-8 place-items-center text-[#df8a70] hover:bg-[#c96a4e]/10"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Charge type">
                      <FormSelect
                        className={inputClass}
                        value={allocation.chargeType}
                        onValueChange={(value) => updateAllocation(allocation.id, {
                          chargeType: value as AllocationDraft["chargeType"],
                        })}
                        options={[
                          { value: "rent", label: "Rent" },
                          { value: "light_bill", label: "Light bill" },
                          { value: "other", label: "Other" },
                        ]}
                      />
                    </Field>
                    <Field label="Bill number / month">
                      <input
                        className={inputClass}
                        value={allocation.billReference}
                        onChange={(event) => updateAllocation(allocation.id, { billReference: event.target.value })}
                        placeholder="e.g. July 2026 or LB-104"
                      />
                    </Field>
                    {allocation.chargeType === "other" && (
                      <Field label="Description">
                        <input
                          className={inputClass}
                          value={allocation.description}
                          onChange={(event) => updateAllocation(allocation.id, { description: event.target.value })}
                          placeholder="Maintenance, parking, etc."
                        />
                      </Field>
                    )}
                    <PaymentAmountFields
                      allocation={allocation}
                      onChange={(values) => updateAllocation(allocation.id, values)}
                      compact
                    />
                  </div>
                </div>
              ))}
            </section>
          )}

          {state.errors?.allocations && <FieldError message={state.errors.allocations} />}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Payment date">
              <DatePickerInput
                name="paidAt"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className={inputClass}
                invalid={Boolean(state.errors?.paidAt)}
                required
              />
              {state.errors?.paidAt && <FieldError message={state.errors.paidAt} />}
            </Field>
            <Field label="Payment method">
              <FormSelect
                className={inputClass}
                name="method"
                defaultValue="bank_transfer"
                options={[
                  { value: "bank_transfer", label: "Bank transfer / UPI" },
                  { value: "cash", label: "Cash" },
                  { value: "check", label: "Cheque" },
                  { value: "card", label: "Card" },
                ]}
              />
            </Field>
            <Field label="Transaction reference">
              <input className={inputClass} name="reference" placeholder="UTR, cheque no., etc." />
            </Field>
            <Field label="Note">
              <input className={inputClass} name="note" placeholder="Optional note" />
            </Field>
          </div>

          <div className="flex items-center justify-between border border-[#e4c77a]/20 bg-[#e4c77a]/[0.055] px-4 py-3.5">
            <span className="text-xs font-bold text-white/55">Total received</span>
            <span className="font-display text-xl font-extrabold text-[#e4c77a]">{formatCurrency(total)}</span>
          </div>

          <div aria-live="polite" className="min-h-5">
            {state.status === "error" && <p className="text-xs font-medium text-[#c65c4d]">{state.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
            <Button type="submit" disabled={pending || !tenants.length || total <= 0}>
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
              {pending ? "Saving..." : "Save payment"}
            </Button>
          </div>
          {!tenants.length && <p className="text-right text-xs text-[#c65c4d]">Add a tenant before recording a payment.</p>}
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PaymentAmountFields({
  allocation,
  onChange,
  compact = false,
}: {
  allocation: AllocationDraft;
  onChange: (values: Partial<AllocationDraft>) => void;
  compact?: boolean;
}) {
  const hasGst = Number(allocation.gstRate) > 0;
  return (
    <>
      <Field label={compact ? "Amount before GST (₹)" : "Amount received before GST (₹)"}>
        <input
          required
          className={inputClass}
          type="number"
          min="0.01"
          step="0.01"
          value={allocation.amount}
          onChange={(event) => onChange({ amount: event.target.value })}
          placeholder="0.00"
        />
      </Field>
      <div className={compact ? "" : "grid gap-3 sm:grid-cols-2"}>
        <label className="flex h-11 items-center gap-3 rounded-none border border-white/[0.09] bg-white/[0.018] px-3.5 text-xs font-semibold text-white/65">
          <input
            className="size-4 accent-[#e4c77a]"
            type="checkbox"
            checked={hasGst}
            onChange={(event) => onChange({ gstRate: event.target.checked ? "18" : "0" })}
          />
          Include GST
        </label>
        {hasGst && (
          <Field label="GST rate (%)">
            <input
              required
              className={inputClass}
              type="number"
              min="0.01"
              max="100"
              step="0.01"
              value={allocation.gstRate}
              onChange={(event) => onChange({ gstRate: event.target.value })}
            />
          </Field>
        )}
      </div>
    </>
  );
}
