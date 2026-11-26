"use client";

import { useActionState, useEffect } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DatePickerInput, FormSelect } from "@/components/ui/form-controls";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { saveUnit, type UnitActionState } from "@/app/dashboard/units/actions";
import type { PropertyRecord, UnitRecord } from "@/lib/properties";
import { Field, FieldError, formatMeterReading, inputClass } from "@/components/workspace/shared";

export const initialUnitState: UnitActionState = {
  status: "idle",
  message: "",
};

export function UnitDialog({
  property,
  unit,
  open,
  onOpenChange,
}: {
  property: PropertyRecord;
  unit: UnitRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(saveUnit, initialUnitState);
  const editing = Boolean(unit);

  useEffect(() => {
    if (state.status !== "success") return;
    toast.success(state.message, {
      description: `${property.name} now has the latest unit details.`,
    });
    onOpenChange(false);
  }, [onOpenChange, property.name, state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[620px]">
        <DialogTitle>{editing ? `Edit unit ${unit?.unitNumber}` : "Add a unit"}</DialogTitle>
        <DialogDescription>
          {property.name} · Track availability, area, floor, and meter readings.
        </DialogDescription>
        <form action={formAction} className="mt-6 space-y-4">
          <input type="hidden" name="id" value={unit?.id ?? ""} />
          <input type="hidden" name="propertyId" value={property.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Unit number">
              <input
                required
                className={inputClass}
                name="unitNumber"
                defaultValue={unit?.unitNumber}
                aria-invalid={Boolean(state.errors?.unitNumber)}
                placeholder="e.g. 2A"
              />
              {state.errors?.unitNumber && <FieldError message={state.errors.unitNumber} />}
            </Field>
            <Field label="Status">
              <FormSelect
                key={`status-${unit?.id ?? "new"}`}
                className={inputClass}
                name="status"
                defaultValue={unit?.status ?? "vacant"}
                invalid={Boolean(state.errors?.status)}
                options={[
                  { value: "vacant", label: "Vacant" },
                  { value: "occupied", label: "Occupied" },
                  { value: "maintenance", label: "Maintenance" },
                ]}
              />
              {state.errors?.status && <FieldError message={state.errors.status} />}
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Floor">
              <input
                className={inputClass}
                name="floor"
                defaultValue={unit?.floor}
                placeholder="e.g. Ground or 2"
              />
            </Field>
            <Field label="Area (sq ft)">
              <input
                className={inputClass}
                name="areaSqft"
                type="number"
                min="0"
                step="any"
                defaultValue={unit?.areaSqft ?? ""}
                aria-invalid={Boolean(state.errors?.areaSqft)}
                placeholder="850"
              />
              {state.errors?.areaSqft && <FieldError message={state.errors.areaSqft} />}
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Opening meter reading">
              <input
                className={inputClass}
                name="openingMeterReading"
                type="number"
                min="0"
                step="0.001"
                defaultValue={unit?.openingMeterReading ?? ""}
                aria-invalid={Boolean(state.errors?.openingMeterReading)}
                placeholder="0"
              />
              {state.errors?.openingMeterReading && <FieldError message={state.errors.openingMeterReading} />}
            </Field>
            <Field label="Opening reading date">
              <DatePickerInput
                key={`opening-date-${unit?.id ?? "new"}`}
                name="openingMeterReadingDate"
                defaultValue={unit?.openingMeterReadingDate}
                className={inputClass}
                invalid={Boolean(state.errors?.openingMeterReadingDate)}
                monthYearNavigation
                placeholder="Pick an opening date"
              />
              {state.errors?.openingMeterReadingDate && <FieldError message={state.errors.openingMeterReadingDate} />}
            </Field>
          </div>
          {unit && unit.lastMeterReading !== null && (
            <p className="border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-xs text-white/45">
              Latest billed reading: <span className="font-bold text-white/70">{formatMeterReading(unit.lastMeterReading)} units</span>
              {unit.lastMeterReadingDate ? ` (${unit.lastMeterReadingDate})` : ""}
            </p>
          )}
          {unit?.tenant && (
            <div className="border border-[#7aa18b]/25 bg-[#7aa18b]/10 px-4 py-3 text-xs text-[#9bc4ab]">
              <span className="font-bold">Active tenant:</span> {unit.tenant.name} · {unit.tenant.email}
            </div>
          )}
          <div aria-live="polite" className="min-h-5">
            {state.status === "error" && (
              <p className="text-xs font-medium text-[#c65c4d]">{state.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
              {pending ? "Saving..." : editing ? "Save changes" : "Add unit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
