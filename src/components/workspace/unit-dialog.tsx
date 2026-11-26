"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DatePickerInput, FormSelect } from "@/components/ui/form-controls";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { saveUnit, type UnitActionState } from "@/app/dashboard/units/actions";
import type { PropertyRecord, UnitRecord } from "@/lib/properties";
import { Field, FieldError, formatMeterReading, inputClass } from "@/components/workspace/shared";
import { expandUnitNumbers } from "@/lib/rental-import";

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
  const [unitInput, setUnitInput] = useState(unit?.unitNumber ?? "");
  const [bulkPending, setBulkPending] = useState(false);
  const bulkUnits = editing ? [] : expandUnitNumbers(unitInput);
  const isBulk = bulkUnits.length > 1;

  // "101-110" or "1, 2, 3" adds each unit with the same details, one request
  // at a time so plan limits and duplicate checks still apply per unit.
  async function addMany(event: React.FormEvent<HTMLFormElement>) {
    if (!isBulk) return;
    event.preventDefault();
    const template = new FormData(event.currentTarget);
    setBulkPending(true);
    let added = 0;
    const problems: string[] = [];
    for (const unitNumber of bulkUnits) {
      const data = new FormData();
      template.forEach((value, key) => data.set(key, value));
      data.set("unitNumber", unitNumber);
      try {
        const result = await saveUnit(initialUnitState, data);
        if (result.status === "success") added += 1;
        else {
          problems.push(`${unitNumber}: ${result.errors?.unitNumber ?? result.message}`);
          if (/limit|includes up to|read-only/i.test(result.message)) break;
        }
      } catch {
        problems.push(`${unitNumber}: couldn’t save`);
      }
    }
    setBulkPending(false);
    if (added) toast.success(`${added} unit${added === 1 ? "" : "s"} added to ${property.name}`);
    if (problems.length) toast.error(`${problems.length} not added`, { description: problems.slice(0, 4).join(" · ") });
    if (added && !problems.length) onOpenChange(false);
  }

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
        <form action={formAction} onSubmit={addMany} className="mt-6 space-y-4">
          <input type="hidden" name="id" value={unit?.id ?? ""} />
          <input type="hidden" name="propertyId" value={property.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Unit number">
              <input
                required
                className={inputClass}
                name="unitNumber"
                value={unitInput}
                onChange={(event) => setUnitInput(event.target.value)}
                aria-invalid={Boolean(state.errors?.unitNumber)}
                placeholder={editing ? "e.g. 2A" : "e.g. 2A, or 101-110 for many"}
              />
              {state.errors?.unitNumber && <FieldError message={state.errors.unitNumber} />}
              {!state.errors?.unitNumber && !editing && (
                <p className="mt-1.5 text-[10px] leading-4 text-white/35">
                  {isBulk ? `Adds ${bulkUnits.length} units: ${bulkUnits.slice(0, 4).join(", ")}${bulkUnits.length > 4 ? "…" : ""}` : "Adding many? Type 101-110 or 1, 2, 3."}
                </p>
              )}
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
            <Button type="submit" disabled={pending || bulkPending}>
              {pending || bulkPending ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
              {pending || bulkPending ? "Saving..." : editing ? "Save changes" : isBulk ? `Add ${bulkUnits.length} units` : "Add unit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
