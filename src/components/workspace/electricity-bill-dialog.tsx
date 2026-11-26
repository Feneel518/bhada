"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, Gauge, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DatePickerInput, FormSelect } from "@/components/ui/form-controls";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { createElectricityBill, type ElectricityBillActionState } from "@/app/dashboard/electricity/actions";
import { formatElectricityReadingDate } from "@/lib/financial-year";
import type { PropertyRecord } from "@/lib/properties";
import { cn, formatCurrency } from "@/lib/utils";
import { Field, FieldError, formatMeterReading, inputClass } from "@/components/workspace/shared";

export const initialElectricityBillState: ElectricityBillActionState = {
  status: "idle",
  message: "",
};

export function ElectricityBillDialog({
  open,
  onOpenChange,
  properties,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: PropertyRecord[];
}) {
  const [state, formAction, pending] = useActionState(
    createElectricityBill,
    initialElectricityBillState,
  );
  const units = properties.flatMap((property) =>
    property.units.map((unit) => ({ property, unit })),
  );
  const today = new Date().toISOString().slice(0, 10);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [currentReading, setCurrentReading] = useState("");
  const [unitRate, setUnitRate] = useState("");
  const selectedUnit = units.find(({ unit }) => unit.id === selectedUnitId)?.unit;
  const previousReading = selectedUnit?.lastMeterReading ?? null;
  const unitsConsumed =
    previousReading === null || !currentReading
      ? 0
      : Math.max(0, Number(currentReading) - previousReading);
  const calculatedAmount = unitsConsumed * (Number(unitRate) || 0);
  const hasCurrentReading = currentReading !== "" && Number.isFinite(Number(currentReading));

  useEffect(() => {
    if (state.status !== "success") return;
    toast.success("Electricity bill added", { description: state.message });
    onOpenChange(false);
  }, [onOpenChange, state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px]">
        <DialogTitle>Add electricity bill</DialogTitle>
        <DialogDescription>
          Enter the meter reading for a specific day. Consumption and amount are calculated from the previous reading.
        </DialogDescription>
        <form action={formAction} className="mt-6 space-y-4">
          <Field label="Property and unit">
            <FormSelect
              required
              className={inputClass}
              name="unitId"
              value={selectedUnitId}
              onValueChange={(value) => {
                setSelectedUnitId(value);
                setCurrentReading("");
              }}
              invalid={Boolean(state.errors?.unitId)}
              placeholder="Select a unit"
              options={units.map(({ property, unit }) => ({
                value: unit.id,
                label: `${property.name} · Unit ${unit.unitNumber}${unit.tenant ? ` · ${unit.tenant.name}` : " · Vacant"}`,
              }))}
            />
            {state.errors?.unitId && <FieldError message={state.errors.unitId} />}
            {selectedUnit && previousReading === null && (
              <FieldError message="Edit this unit and set its opening meter reading first." />
            )}
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Meter reading date">
              <DatePickerInput
                name="billingPeriod"
                defaultValue={today}
                className={inputClass}
                invalid={Boolean(state.errors?.billingPeriod)}
                required
                placeholder="Pick the reading date"
              />
              {state.errors?.billingPeriod && <FieldError message={state.errors.billingPeriod} />}
            </Field>
            <Field label="Current meter reading">
              <div className="relative">
                <input
                  required
                  className={cn(inputClass, "pr-16 tabular-nums")}
                  name="currentReading"
                  type="number"
                  min={previousReading ?? 0}
                  step="0.001"
                  value={currentReading}
                  onChange={(event) => setCurrentReading(event.target.value)}
                  placeholder={previousReading === null ? "Set opening reading first" : `Previous: ${formatMeterReading(previousReading)}`}
                  aria-invalid={Boolean(state.errors?.currentReading)}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-[10px] font-bold uppercase tracking-[0.08em] text-white/30">
                  units
                </span>
              </div>
              {state.errors?.currentReading && <FieldError message={state.errors.currentReading} />}
            </Field>
            <Field label="Rate per unit (₹)">
              <input
                required
                className={inputClass}
                name="unitRate"
                type="number"
                min="0.0001"
                step="0.0001"
                value={unitRate}
                onChange={(event) => setUnitRate(event.target.value)}
                placeholder="e.g. 8.50"
                aria-invalid={Boolean(state.errors?.unitRate)}
              />
              {state.errors?.unitRate && <FieldError message={state.errors.unitRate} />}
            </Field>
            <Field label="Due date">
              <DatePickerInput
                name="dueDate"
                defaultValue={today}
                className={inputClass}
                invalid={Boolean(state.errors?.dueDate)}
                required
              />
              {state.errors?.dueDate && <FieldError message={state.errors.dueDate} />}
            </Field>
            <Field label="Note">
              <input className={inputClass} name="note" placeholder="Meter bill reference, optional" />
            </Field>
          </div>

          <div className="border border-white/[0.09] bg-white/[0.025]">
            <div className="flex items-center gap-2 border-b border-white/[0.08] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
              <Gauge className="size-3.5 text-[#e4c77a]" /> Meter calculation
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4 sm:px-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35">Previous reading</p>
                <p className="mt-1.5 font-display text-xl font-bold tabular-nums text-white/75">
                  {previousReading === null ? "—" : formatMeterReading(previousReading)}
                  {previousReading !== null && <span className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-white/30">units</span>}
                </p>
                {selectedUnit?.lastMeterReadingDate && (
                  <p className="mt-1 text-[9px] text-white/35">
                    {formatElectricityReadingDate(selectedUnit.lastMeterReadingDate)}
                  </p>
                )}
              </div>
              <div aria-hidden="true" className="flex items-center gap-1 text-white/20">
                <span className="h-px w-3 bg-white/15 sm:w-5" />
                <span className="text-sm">→</span>
                <span className="h-px w-3 bg-white/15 sm:w-5" />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35">Current reading</p>
                <p className="mt-1.5 font-display text-xl font-bold tabular-nums text-[#e4c77a]">
                  {hasCurrentReading ? formatMeterReading(currentReading) : "—"}
                  {hasCurrentReading && <span className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-[#e4c77a]/55">units</span>}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 border-t border-white/[0.08] bg-black/10">
              <div className="border-r border-white/[0.08] px-4 py-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35">Consumption</p>
                <p className="mt-1 text-base font-extrabold tabular-nums text-[#e4c77a]">
                  {formatMeterReading(unitsConsumed)} <span className="text-[10px] font-semibold uppercase text-[#e4c77a]/55">units</span>
                </p>
              </div>
              <div className="px-4 py-3.5 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35">Bill amount</p>
                <p className="mt-1 text-base font-extrabold tabular-nums text-[#e4c77a]">{formatCurrency(calculatedAmount)}</p>
              </div>
            </div>
          </div>

          <div aria-live="polite" className="min-h-5">
            {state.status === "error" && (
              <p className="text-xs font-medium text-[#c65c4d]">{state.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !units.length || previousReading === null}>
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
              {pending ? "Adding..." : "Add bill"}
            </Button>
          </div>
          {!units.length && (
            <p className="text-right text-xs text-[#c65c4d]">Add a property unit first.</p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
