"use client";

import { useActionState, useEffect, useState } from "react";
import { CalendarDays, Check, CircleDollarSign, LoaderCircle, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DatePickerInput, FormSelect } from "@/components/ui/form-controls";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { saveTenant, type TenantActionState } from "@/app/dashboard/tenants/actions";
import type { PropertyRecord } from "@/lib/properties";
import type { TenantRecord } from "@/lib/tenants";
import { formatCurrency } from "@/lib/utils";
import { Field, FieldError, inputClass } from "@/components/workspace/shared";

export const initialTenantState: TenantActionState = {
  status: "idle",
  message: "",
};

export function TenantDialog({
  tenant,
  properties,
  open,
  onOpenChange,
}: {
  tenant: TenantRecord | null;
  properties: PropertyRecord[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(saveTenant, initialTenantState);
  const editing = Boolean(tenant);
  const [gstEnabled, setGstEnabled] = useState(tenant?.gstEnabled ?? false);
  const [gstRate, setGstRate] = useState(String(tenant?.gstRate || 18));
  const [gstTaxablePercent, setGstTaxablePercent] = useState(String(tenant?.gstTaxablePercent ?? 100));
  const [tdsEnabled, setTdsEnabled] = useState(tenant?.tdsEnabled ?? false);
  const [tdsRate, setTdsRate] = useState(String(tenant?.tdsRate || 10));
  const [monthlyRent, setMonthlyRent] = useState(String(tenant?.monthlyRent ?? ""));
  const baseRent = Math.max(0, Number(monthlyRent) || 0);
  const taxableRent = gstEnabled
    ? (baseRent * (Number(gstTaxablePercent) || 0)) / 100
    : 0;
  const previewGst = gstEnabled ? (taxableRent * (Number(gstRate) || 0)) / 100 : 0;
  const previewTds = tdsEnabled
    ? ((baseRent + previewGst) * (Number(tdsRate) || 0)) / 100
    : 0;
  const previewPayable = baseRent + previewGst - previewTds;
  const units = properties.flatMap((item) =>
    item.units.filter((unit) => !unit.tenant || unit.tenant.id === tenant?.id).map((unit) => ({
      id: unit.id,
      label: `${item.name} · Unit ${unit.unitNumber}`,
    })),
  );

  useEffect(() => {
    if (state.status !== "success") return;
    toast.success(state.message);
    onOpenChange(false);
  }, [onOpenChange, state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[760px] overflow-y-auto overscroll-contain">
        <DialogTitle>{editing ? `Edit ${tenant?.name}` : "Add a tenant"}</DialogTitle>
        <DialogDescription>
          Add the tenant first, then set up their lease and monthly rent. Optional tax and rent increase rules are grouped below.
        </DialogDescription>
        <form action={formAction} className="mt-6 space-y-5">
          <input type="hidden" name="id" value={tenant?.id ?? ""} />

          <section className="space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e4c77a]/70">Tenant & unit</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name">
                <input required className={inputClass} name="name" defaultValue={tenant?.name} aria-invalid={Boolean(state.errors?.name)} autoComplete="name" placeholder="Tenant name" />
                {state.errors?.name && <FieldError message={state.errors.name} />}
              </Field>
              <Field label="Unit">
                <FormSelect
                  key={`tenant-unit-${tenant?.id ?? "new"}`}
                  required
                  className={inputClass}
                  name="unitId"
                  defaultValue={tenant?.unitId ?? ""}
                  invalid={Boolean(state.errors?.unitId)}
                  placeholder="Select a unit"
                  options={units.map((unit) => ({ value: unit.id, label: unit.label }))}
                />
                {state.errors?.unitId && <FieldError message={state.errors.unitId} />}
              </Field>
              <Field label="Email">
                <input className={inputClass} name="email" type="email" defaultValue={tenant?.email} aria-invalid={Boolean(state.errors?.email)} autoComplete="email" placeholder="name@example.com" />
                {state.errors?.email && <FieldError message={state.errors.email} />}
              </Field>
              <Field label="Phone">
                <input className={inputClass} name="phone" type="tel" defaultValue={tenant?.phone} autoComplete="tel" placeholder="+91 98765 43210" />
              </Field>
              <Field label="Emergency contact">
                <input className={inputClass} name="emergencyContact" defaultValue={tenant?.emergencyContact} placeholder="Contact name" />
              </Field>
              <Field label="Emergency phone">
                <input className={inputClass} name="emergencyPhone" type="tel" defaultValue={tenant?.emergencyPhone} placeholder="+91 98765 43210" />
              </Field>
            </div>
          </section>

          <section className="space-y-4 border-t border-white/10 pt-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e4c77a]/70">Masked identity details</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Aadhaar last 4">
                <input className={inputClass} name="aadhaarLast4" inputMode="numeric" maxLength={4} defaultValue={tenant?.aadhaarMasked.slice(-4)} aria-invalid={Boolean(state.errors?.aadhaarLast4)} placeholder="1234" />
                {state.errors?.aadhaarLast4 && <FieldError message={state.errors.aadhaarLast4} />}
              </Field>
              <Field label="PAN number">
                <input
                  className={inputClass}
                  name="panMasked"
                  maxLength={10}
                  defaultValue={tenant?.panMasked}
                  aria-invalid={Boolean(state.errors?.panMasked)}
                  autoCapitalize="characters"
                  autoComplete="off"
                  placeholder="ABCDE1234F"
                />
                {state.errors?.panMasked && <FieldError message={state.errors.panMasked} />}
                {!state.errors?.panMasked && <p className="mt-1.5 text-[10px] text-white/35">Automatically stored as AB***1234F.</p>}
              </Field>
              <Field label="GSTIN">
                <input className={inputClass} name="gstin" maxLength={15} defaultValue={tenant?.gstin} placeholder="Optional" />
              </Field>
            </div>
          </section>

          <section className="space-y-4 border-t border-white/10 pt-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e4c77a]/70">Lease & rent setup</p>
              <p className="mt-1.5 text-xs leading-5 text-white/40">
                Work through each group in order. Leave any optional field blank when it does not apply.
              </p>
            </div>

            <LeaseFieldGroup
              icon={<CalendarDays className="size-4" />}
              title="1. Lease duration"
              description="Set the agreement dates and the rules for ending the tenancy."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <TenantInput label="Lease starts on" name="leaseStart" type="date" value={tenant?.leaseStart} error={state.errors?.leaseStart} />
                <TenantInput label="Lease ends on" name="leaseEnd" type="date" value={tenant?.leaseEnd} error={state.errors?.leaseEnd} />
                <TenantInput
                  label="Minimum stay / lock-in"
                  name="lockInMonths"
                  type="number"
                  value={tenant?.lockInMonths}
                  error={state.errors?.lockInMonths}
                  hint="Number of months before the tenant can end the lease."
                />
                <TenantInput
                  label="Move-out notice"
                  name="noticePeriodMonths"
                  type="number"
                  value={tenant?.noticePeriodMonths}
                  error={state.errors?.noticePeriodMonths}
                  hint="Number of months' notice required before leaving."
                />
              </div>
            </LeaseFieldGroup>

            <LeaseFieldGroup
              icon={<CircleDollarSign className="size-4" />}
              title="2. Monthly rent & billing"
              description="Enter the base rent and choose when each month's bill is created and due."
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Monthly base rent (₹)">
                  <input
                    className={inputClass}
                    name="monthlyRent"
                    type="number"
                    min={0}
                    step="any"
                    value={monthlyRent}
                    onChange={(event) => setMonthlyRent(event.target.value)}
                    aria-invalid={Boolean(state.errors?.monthlyRent)}
                    placeholder="e.g. 25000"
                  />
                  {state.errors?.monthlyRent && <FieldError message={state.errors.monthlyRent} />}
                </Field>
                <TenantInput
                  label="Create bill on day"
                  name="rentBillingDay"
                  type="number"
                  value={tenant?.rentBillingDay ?? 1}
                  error={state.errors?.rentBillingDay}
                  min={1}
                  max={31}
                  hint="Day of the month, from 1 to 31."
                />
                <TenantInput
                  label="Payment due on day"
                  name="rentDueDay"
                  type="number"
                  value={tenant?.rentDueDay ?? tenant?.rentBillingDay ?? 1}
                  error={state.errors?.rentDueDay}
                  min={1}
                  max={31}
                  hint="The monthly deadline for rent."
                />
              </div>
            </LeaseFieldGroup>

            <LeaseFieldGroup
              icon={<WalletCards className="size-4" />}
              title="3. Deposit & starting balance"
              description="Record money already held or owed when adding this tenant to Bhadaa."
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <TenantInput
                  label="Refundable security deposit (₹)"
                  name="securityDeposit"
                  type="number"
                  value={tenant?.securityDeposit}
                  error={state.errors?.securityDeposit}
                  step="any"
                />
                <TenantInput
                  label="Tenant already owes (₹)"
                  name="openingBalance"
                  type="number"
                  value={tenant?.openingBalance ?? 0}
                  error={state.errors?.openingBalance}
                  step="any"
                  hint="Past unpaid amount to carry forward."
                />
                <TenantInput
                  label="Tenant paid in advance (₹)"
                  name="creditBalance"
                  type="number"
                  value={tenant?.creditBalance ?? 0}
                  error={state.errors?.creditBalance}
                  step="any"
                  hint="Unused advance payment or credit."
                />
              </div>
            </LeaseFieldGroup>
          </section>

          <section className="space-y-4 border-t border-white/10 pt-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e4c77a]/70">Optional: rent bill taxes</p>
              <p className="mt-1.5 text-xs leading-5 text-white/40">
                Turn these on only when they apply to this tenant. TDS is calculated on the GST-inclusive invoice total.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="border border-white/10 bg-white/[0.018] p-4">
                <label className="flex items-center gap-3 text-sm font-semibold text-white/70">
                  <input
                    className="size-4 accent-[#e4c77a]"
                    type="checkbox"
                    name="gstEnabled"
                    checked={gstEnabled}
                    onChange={(event) => setGstEnabled(event.target.checked)}
                  />
                  Add GST to rent bills
                </label>
                {gstEnabled && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Field label="GST rate (%)">
                      <input
                        className={inputClass}
                        name="gstRate"
                        type="number"
                        min={0.01}
                        max={100}
                        step="any"
                        value={gstRate}
                        onChange={(event) => setGstRate(event.target.value)}
                        aria-invalid={Boolean(state.errors?.gstRate)}
                      />
                      {state.errors?.gstRate && <FieldError message={state.errors.gstRate} />}
                    </Field>
                    <Field label="Rent subject to GST (%)">
                      <input
                        className={inputClass}
                        name="gstTaxablePercent"
                        type="number"
                        min={0.01}
                        max={100}
                        step="any"
                        value={gstTaxablePercent}
                        onChange={(event) => setGstTaxablePercent(event.target.value)}
                        aria-invalid={Boolean(state.errors?.gstTaxablePercent)}
                      />
                      {state.errors?.gstTaxablePercent && <FieldError message={state.errors.gstTaxablePercent} />}
                    </Field>
                    <p className="text-[10px] leading-4 text-white/35 sm:col-span-2">
                      Use 50% when half the rent is billed with GST and half without GST.
                    </p>
                  </div>
                )}
              </div>
              <div className="border border-white/10 bg-white/[0.018] p-4">
                <label className="flex items-center gap-3 text-sm font-semibold text-white/70">
                  <input
                    className="size-4 accent-[#e4c77a]"
                    type="checkbox"
                    name="tdsEnabled"
                    checked={tdsEnabled}
                    onChange={(event) => setTdsEnabled(event.target.checked)}
                  />
                  Tenant deducts TDS
                </label>
                {tdsEnabled && (
                  <div className="mt-3">
                    <Field label="TDS rate (%)">
                      <input
                        className={inputClass}
                        name="tdsRate"
                        type="number"
                        min={0.01}
                        max={100}
                        step="any"
                        value={tdsRate}
                        onChange={(event) => setTdsRate(event.target.value)}
                        aria-invalid={Boolean(state.errors?.tdsRate)}
                      />
                      {state.errors?.tdsRate && <FieldError message={state.errors.tdsRate} />}
                    </Field>
                  </div>
                )}
              </div>
            </div>
            {baseRent > 0 && (
              <div className="border border-[#e4c77a]/20 bg-[#e4c77a]/[0.045] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#e4c77a]/70">Monthly bill preview</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/45">
                  <span>Rent {formatCurrency(baseRent)}</span>
                  {gstEnabled && (
                    <span>
                      + GST on {gstTaxablePercent || 0}% ({formatCurrency(taxableRent)}): {formatCurrency(previewGst)}
                    </span>
                  )}
                  {tdsEnabled && <span>− TDS {formatCurrency(previewTds)}</span>}
                  <span className="font-semibold text-[#e4c77a]">= {formatCurrency(previewPayable)} payable</span>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4 border-t border-white/10 pt-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e4c77a]/70">Optional: scheduled rent increase</p>
              <p className="mt-1.5 text-xs leading-5 text-white/40">
                Example: increase the rent by 5% every 12 months, with the next increase on 1 April 2027.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <TenantInput label="Rent increase (%)" name="rentEscalationPct" type="number" value={tenant?.rentEscalationPct} error={state.errors?.rentEscalationPct} step="any" />
              <TenantInput label="Increase rent every (months)" name="rentEscalationMonths" type="number" value={tenant?.rentEscalationMonths} error={state.errors?.rentEscalationMonths} />
              <TenantInput label="Next rent increase date" name="nextEscalationDate" type="date" value={tenant?.nextEscalationDate} error={state.errors?.nextEscalationDate} />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e4c77a]/70">Lease document</p>
            <Field label="Lease document URL">
              <input className={inputClass} name="leaseDocUrl" type="url" defaultValue={tenant?.leaseDocUrl} aria-invalid={Boolean(state.errors?.leaseDocUrl)} placeholder="https://..." />
              {state.errors?.leaseDocUrl && <FieldError message={state.errors.leaseDocUrl} />}
            </Field>
          </section>

          <label className="flex items-center gap-3 border border-[#7aa18b]/25 bg-[#7aa18b]/[0.07] px-4 py-3 text-sm font-semibold text-[#9bc4ab]">
            <input className="size-4 accent-[#9bc4ab]" type="checkbox" name="isActive" defaultChecked={tenant?.isActive ?? true} />
            Active tenant (marks the unit occupied)
          </label>

          <div aria-live="polite" className="min-h-5">
            {state.status === "error" && <p className="text-xs font-medium text-[#c65c4d]">{state.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
            <Button type="submit" disabled={pending || !units.length}>
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
              {pending ? "Saving..." : editing ? "Save changes" : "Add tenant"}
            </Button>
          </div>
          {!units.length && <p className="text-right text-xs text-[#c65c4d]">Add a property unit before creating a tenant.</p>}
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TenantInput({
  label,
  name,
  type,
  value,
  error,
  hint,
  step,
  min,
  max,
}: {
  label: string;
  name: string;
  type: "date" | "number";
  value?: string | number | null;
  error?: string;
  hint?: string;
  step?: string;
  min?: number;
  max?: number;
}) {
  return (
    <Field label={label}>
      {type === "date" ? (
        <DatePickerInput
          key={`${name}-${value ?? ""}`}
          className={inputClass}
          name={name}
          defaultValue={typeof value === "string" ? value : undefined}
          invalid={Boolean(error)}
        />
      ) : (
        <input className={inputClass} name={name} type={type} min={min ?? 0} max={max} step={step} defaultValue={value ?? ""} aria-invalid={Boolean(error)} />
      )}
      {error && <FieldError message={error} />}
      {!error && hint && <p className="mt-1.5 text-[10px] leading-4 text-white/35">{hint}</p>}
    </Field>
  );
}

export function LeaseFieldGroup({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-white/10 bg-white/[0.018] p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center border border-[#e4c77a]/20 bg-[#e4c77a]/[0.06] text-[#e4c77a]/80">
          {icon}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-white/75">{title}</h3>
          <p className="mt-1 text-[11px] leading-4 text-white/40">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
