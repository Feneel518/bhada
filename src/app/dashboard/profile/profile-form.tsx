"use client";

import { useState } from "react";
import { Check, LoaderCircle, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export type ProfileValues = {
  businessName: string;
  rentBillingPeriod: "previous" | "current";
  phone: string;
  gstin: string;
  pan: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

type SaveResult = {
  status: "idle" | "success" | "error";
  message: string;
  panError?: string;
};

const inputClass =
  "h-10 w-full rounded-xl border border-[#dfe2e9] bg-white px-3.5 text-sm text-[#2d3342] outline-none transition placeholder:text-[#abb0bc] focus:border-[#aaaaf0] focus:ring-4 focus:ring-[#5b5bd6]/10";

export function ProfileForm({
  email,
  initialValues,
}: {
  email: string;
  initialValues: ProfileValues;
}) {
  const [result, setResult] = useState<SaveResult>({ status: "idle", message: "" });
  const [pending, setPending] = useState(false);
  const [gstin, setGstin] = useState(initialValues.gstin);
  const [pan, setPan] = useState(initialValues.pan);

  const gstinError =
    gstin.length > 0 && !GSTIN_REGEX.test(gstin)
      ? "GSTIN must be a valid 15-character number."
      : "";
  const panError =
    pan.length > 0 && !PAN_REGEX.test(pan)
      ? "Enter a valid PAN, for example ABCDE1234F."
      : result.panError ?? "";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setResult({ status: "idle", message: "" });

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        body: new FormData(event.currentTarget),
      });
      const payload = (await response.json()) as SaveResult;
      setResult(payload);
    } catch {
      setResult({ status: "error", message: "We couldn’t save your profile. Please try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="animate-rise">
      <header>
        <p className="text-sm font-semibold text-[#5b5bd6]">Account settings</p>
        <h1 className="mt-2 font-display text-[29px] tracking-[-0.045em] text-[#222836] sm:text-[34px]">
          Business profile
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#747b8b]">
          These details identify your rental business and will be available for invoices.
        </p>
      </header>

      <form onSubmit={submit} className="mt-5 w-full overflow-hidden rounded-[20px] border border-[#e7e9ef] bg-white shadow-[0_1px_2px_rgba(25,29,41,.02)]">
          <section className="border-b border-[#eceef3] px-5 py-4 sm:px-6">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#efeffd] text-[#5656c9]">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold tracking-[-0.025em] text-[#292f3d]">Profile details</h2>
                <p className="mt-1 text-xs text-[#8b91a0]">Signed in as {email}</p>
              </div>
            </div>
          </section>

          <div className="grid gap-x-4 gap-y-3.5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
            <Field label="Business name" required className="sm:col-span-2">
              <input
                className={inputClass}
                name="businessName"
                defaultValue={initialValues.businessName}
                required
                autoComplete="organization"
                placeholder="Your business name"
              />
            </Field>

            <Field label="Phone">
              <input
                className={inputClass}
                name="phone"
                defaultValue={initialValues.phone}
                type="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
              />
            </Field>

            <Field label="Monthly rent billing" className="sm:col-span-2 lg:col-span-3">
              <select
                className={inputClass}
                name="rentBillingPeriod"
                defaultValue={initialValues.rentBillingPeriod}
              >
                <option value="previous">Previous month</option>
                <option value="current">Current month</option>
              </select>
              <p className="mt-2 text-xs leading-5 text-[#8b91a0]">
                On the first of each month, create rent bills for the selected month. New tenants
                never receive a bill just from being added.
              </p>
            </Field>

            <Field label="GSTIN" hint="15 characters">
              <input
                className={inputClass}
                name="gstin"
                value={gstin}
                onChange={(event) => setGstin(event.target.value.toUpperCase().replace(/\s/g, ""))}
                maxLength={15}
                autoCapitalize="characters"
                aria-invalid={Boolean(gstinError)}
                aria-describedby={gstinError ? "gstin-error" : undefined}
                placeholder="22AAAAA0000A1Z5"
              />
              {gstinError && (
                <p id="gstin-error" className="mt-2 text-xs font-medium text-[#c65c4d]">
                  {gstinError} You can still save this profile.
                </p>
              )}
            </Field>

            <Field label="PAN">
              <input
                className={inputClass}
                name="pan"
                value={pan}
                onChange={(event) => setPan(event.target.value.toUpperCase().replace(/\s/g, ""))}
                maxLength={10}
                pattern="[A-Z]{5}[0-9]{4}[A-Z]"
                autoCapitalize="characters"
                aria-invalid={Boolean(panError)}
                aria-describedby={panError ? "pan-error" : undefined}
                placeholder="ABCDE1234F"
              />
              {panError && (
                <p id="pan-error" className="mt-2 text-xs font-medium text-[#c65c4d]">{panError}</p>
              )}
            </Field>

            <Field label="Address" className="sm:col-span-2 lg:col-span-3">
              <textarea
                className={`${inputClass} min-h-20 resize-y py-2.5`}
                name="address"
                defaultValue={initialValues.address}
                autoComplete="street-address"
                placeholder="Street, building, area"
              />
            </Field>

            <Field label="City">
              <input className={inputClass} name="city" defaultValue={initialValues.city} autoComplete="address-level2" placeholder="Mumbai" />
            </Field>
            <Field label="State">
              <input className={inputClass} name="state" defaultValue={initialValues.state} autoComplete="address-level1" placeholder="Maharashtra" />
            </Field>
            <Field label="Pincode">
              <input
                className={inputClass}
                name="pincode"
                defaultValue={initialValues.pincode}
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="400001"
              />
            </Field>
          </div>

          <footer className="flex flex-col gap-3 border-t border-[#eceef3] bg-[#fafafd] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div aria-live="polite" className="min-h-5 text-sm">
              {result.message && (
                <p className={result.status === "success" ? "flex items-center gap-2 font-semibold text-[#27816b]" : "font-medium text-[#c65c4d]"}>
                  {result.status === "success" && <Check className="size-4" />}
                  {result.message}
                </p>
              )}
            </div>
            <Button type="submit" className="sm:min-w-36" disabled={pending}>
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
              {pending ? "Saving..." : "Save profile"}
            </Button>
          </footer>
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#4d5362]">
        {label}
        {required && <span className="text-[#c65c4d]">*</span>}
        {hint && <span className="ml-auto font-medium text-[#9aa0ad]">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
