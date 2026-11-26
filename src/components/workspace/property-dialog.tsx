"use client";

import { useActionState, useEffect } from "react";
import { Building2, Check, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { saveProperty, type PropertyActionState } from "@/app/dashboard/properties/actions";
import type { PropertyRecord } from "@/lib/properties";
import { Field, FieldError, inputClass } from "@/components/workspace/shared";

export const initialPropertyState: PropertyActionState = {
  status: "idle",
  message: "",
};

export function PropertyDialog({
  property,
  open,
  onOpenChange,
}: {
  property: PropertyRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(saveProperty, initialPropertyState);
  const editing = Boolean(property);

  useEffect(() => {
    if (state.status !== "success") return;
    toast.success(state.message, {
      description: editing
        ? "Your property details are now up to date."
        : "Your new property is ready for units and tenants.",
    });
    onOpenChange(false);
  }, [editing, onOpenChange, state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{editing ? "Edit property" : "Add a property"}</DialogTitle>
        <DialogDescription>
          {editing
            ? "Update the address and location details for this property."
            : "Start with the property basics. You can add units and leases next."}
        </DialogDescription>
        <form action={formAction} className="mt-6 space-y-4">
          <input type="hidden" name="id" value={property?.id ?? ""} />
          <Field label="Property name">
            <input
              required
              className={inputClass}
              name="name"
              defaultValue={property?.name}
              aria-invalid={Boolean(state.errors?.name)}
              placeholder="e.g. Willow Apartments"
            />
            {state.errors?.name && <FieldError message={state.errors.name} />}
          </Field>
          <Field label="Street address">
            <input
              className={inputClass}
              name="address"
              defaultValue={property?.address}
              aria-invalid={Boolean(state.errors?.address)}
              autoComplete="street-address"
              placeholder="123 Main Street"
            />
            {state.errors?.address && <FieldError message={state.errors.address} />}
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="City">
              <input
                className={inputClass}
                name="city"
                defaultValue={property?.city}
                aria-invalid={Boolean(state.errors?.city)}
                autoComplete="address-level2"
                placeholder="Mumbai"
              />
              {state.errors?.city && <FieldError message={state.errors.city} />}
            </Field>
            <Field label="State">
              <input
                className={inputClass}
                name="state"
                defaultValue={property?.state}
                autoComplete="address-level1"
                placeholder="Maharashtra"
              />
            </Field>
          </div>
          <Field label="Postal code">
            <input
              className={inputClass}
              name="postalCode"
              defaultValue={property?.postalCode}
              autoComplete="postal-code"
              maxLength={12}
              placeholder="400001"
            />
          </Field>
          <Field label="Electricity rate (₹ per unit)">
            <input
              className={inputClass}
              name="electricityRate"
              inputMode="decimal"
              defaultValue={property?.electricityRate ?? ""}
              aria-invalid={Boolean(state.errors?.electricityRate)}
              placeholder="e.g. 8.50"
            />
            {state.errors?.electricityRate
              ? <FieldError message={state.errors.electricityRate} />
              : <p className="mt-1.5 text-[10px] leading-4 text-white/35">Used for submeter bills, including readings your tenants send. Leave blank if you don’t bill electricity.</p>}
          </Field>
          <div aria-live="polite" className="min-h-5">
            {state.status === "error" && (
              <p className="text-xs font-medium text-[#c65c4d]">{state.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : editing ? <Check className="size-4" /> : <Building2 className="size-4" />}
              {pending ? "Saving..." : editing ? "Save changes" : "Add property"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
