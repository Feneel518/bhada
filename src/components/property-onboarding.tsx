"use client";

import { useState, useTransition } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { saveProperty } from "@/app/dashboard/properties/actions";
import { saveUnit } from "@/app/dashboard/units/actions";
import { saveTenant } from "@/app/dashboard/tenants/actions";
import type { PropertyRecord } from "@/lib/properties";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const inputClass = "mt-1.5 h-11 w-full border border-white/15 bg-[#222220] px-3 text-sm text-[#edede8] outline-none focus:border-[#e4c77a]";
const idle = { status: "idle" as const, message: "" };

export function PropertyOnboarding({ properties, initialPropertyId = "", onClose }: {
  properties: PropertyRecord[];
  initialPropertyId?: string;
  onClose: () => void;
}) {
  const [step, setStep] = useState(initialPropertyId ? 1 : 0);
  const [propertyId, setPropertyId] = useState(initialPropertyId);
  const [propertyName, setPropertyName] = useState("");
  const [address, setAddress] = useState("");
  const [unitId, setUnitId] = useState("");
  const [unitNumber, setUnitNumber] = useState("1");
  const [tenantName, setTenantName] = useState("");
  const [phone, setPhone] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [rentDueDay, setRentDueDay] = useState("1");
  const [email, setEmail] = useState("");
  const [leaseStart, setLeaseStart] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [hasTenant, setHasTenant] = useState(true);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [pending, startTransition] = useTransition();
  const selectedProperty = properties.find((item) => item.id === propertyId);
  const availableUnits = selectedProperty?.units.filter((item) => !item.tenant && item.status === "vacant") ?? [];
  const selectedUnit = selectedProperty?.units.find((item) => item.id === unitId);
  const propertyLabel = selectedProperty?.name || propertyName;
  const unitLabel = selectedUnit?.unitNumber || unitNumber;

  function goTo(next: number) { setMessage(""); setErrors({}); setStep(next); }
  function submit(formData: FormData) {
    setMessage(""); setErrors({});
    startTransition(async () => {
      try {
        if (step === 0) {
          if (propertyId) { goTo(1); return; }
          const data = new FormData(); data.set("name", propertyName); data.set("address", address);
          const result = await saveProperty(idle, data);
          if (result.status === "error") { setMessage(result.message); setErrors(result.errors ?? {}); return; }
          if (!result.id) throw new Error("Missing property ID");
          setPropertyId(result.id); goTo(1);
        } else if (step === 1) {
          if (unitId) { goTo(2); return; }
          const data = new FormData(); data.set("propertyId", propertyId); data.set("unitNumber", unitNumber); data.set("status", "vacant");
          const result = await saveUnit(idle, data);
          if (result.status === "error") { setMessage(result.message); setErrors(result.errors ?? {}); return; }
          if (!result.id) throw new Error("Missing unit ID");
          setUnitId(result.id); goTo(2);
        } else if (step === 2) {
          if (!hasTenant) { goTo(3); return; }
          formData.set("unitId", unitId); formData.set("name", tenantName); formData.set("phone", phone);
          formData.set("monthlyRent", monthlyRent); formData.set("isActive", "on"); formData.set("rentBillingDay", "1");
          formData.set("rentDueDay", rentDueDay); formData.set("email", email); formData.set("leaseStart", leaseStart);
          formData.set("securityDeposit", securityDeposit); formData.set("openingBalance", openingBalance);
          const result = await saveTenant(idle, formData);
          if (result.status === "error") { setMessage(result.message); setErrors(result.errors ?? {}); return; }
          goTo(3);
        }
      } catch { setMessage("We couldn't confirm the save. Your entries are still here. Check your connection and try again."); }
    });
  }
  function field(label: string, name: string, element: React.ReactNode) {
    return <label className="block text-sm text-white/70">{label}{element}{errors[name] && <span className="mt-1 block text-xs text-[#df8a70]">{errors[name]}</span>}</label>;
  }

  return <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
    <DialogContent className="max-w-[560px]" onEscapeKeyDown={(event) => { if (pending) event.preventDefault(); }} onPointerDownOutside={(event) => event.preventDefault()}>
      <DialogTitle>{step === 3 ? "You're ready to track rent" : "Set up your rental"}</DialogTitle>
      <DialogDescription>{step === 3 ? "Your rental is saved. Add more details whenever you need them." : "Just the essentials. Each completed step is saved so you can finish later."}</DialogDescription>
      <ol aria-label="Setup progress" className="my-5 grid grid-cols-3 gap-2">
        {["Property", "Unit", "Tenant"].map((label, index) => <li key={label} aria-current={step === index ? "step" : undefined} className={`border-b-2 pb-2 text-xs ${index <= step ? "border-[#e4c77a] text-[#e4c77a]" : "border-white/10 text-white/35"}`}>{index < step ? "✓" : index + 1} {label}</li>)}
      </ol>
      {step > 0 && <p className="mb-5 text-sm text-white/60">{propertyLabel}{step > 1 ? ` · Unit ${unitLabel}` : ""}</p>}
      {step === 3 ? <div className="space-y-5">
        <p className="flex items-center gap-2 text-sm text-[#9bc4ab]"><Check className="size-5" />{hasTenant ? `${tenantName} is assigned to Unit ${unitLabel}.` : `Unit ${unitLabel} is saved as vacant.`}</p>
        {hasTenant && <p className="text-xs leading-5 text-white/45">Automatic rent billing begins next month. Any earlier unpaid rent can be entered as an opening balance in Edit tenant.</p>}
        <div className="flex flex-wrap gap-2"><Button onClick={onClose}>View dashboard</Button><Button variant="outline" onClick={() => {
          setUnitId(""); setUnitNumber(""); setTenantName(""); setPhone(""); setMonthlyRent(""); setHasTenant(true); goTo(1);
          setEmail(""); setLeaseStart(""); setSecurityDeposit(""); setOpeningBalance("");
        }}>Add another unit</Button></div>
      </div> : <form action={submit} className="space-y-4">
        <fieldset disabled={pending} className="space-y-4">
          {step === 0 && <>
            {properties.length > 0 && field("Property", "propertyId", <select className={inputClass} value={propertyId} onChange={(event) => { setPropertyId(event.target.value); setUnitId(""); }}>
              <option value="">Add a new property</option>{properties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>)}
            {!propertyId && <>
              {field("Property name", "name", <input autoFocus required maxLength={200} className={inputClass} value={propertyName} onChange={(event) => setPropertyName(event.target.value)} placeholder="e.g. Green Park Apartments" />)}
              <details className="text-sm text-white/50"><summary className="cursor-pointer">Add an address (optional)</summary><div className="mt-3">{field("Address", "address", <input className={inputClass} value={address} onChange={(event) => setAddress(event.target.value)} autoComplete="street-address" placeholder="Street, city and postal code" />)}</div></details>
            </>}
          </>}
          {step === 1 && <>
            {availableUnits.length > 0 && field("Unit", "unitId", <select className={inputClass} value={unitId} onChange={(event) => setUnitId(event.target.value)}>
              <option value="">Add a new unit</option>{availableUnits.map((item) => <option key={item.id} value={item.id}>Unit {item.unitNumber}</option>)}
            </select>)}
            {!unitId && field("Unit / room number", "unitNumber", <input autoFocus required maxLength={100} className={inputClass} value={unitNumber} onChange={(event) => setUnitNumber(event.target.value)} placeholder="e.g. 101, Shop A or Whole property" />)}
            <p className="text-xs leading-5 text-white/40">Renting out the entire property? Use “Whole property” as the unit name. Floor, area and meter readings can be added later.</p>
            {unitId && <p className="text-xs text-[#9bc4ab]">This unit is already saved. Continue to assign a tenant.</p>}
          </>}
          {step === 2 && <>
            <div className="grid grid-cols-2 gap-2" aria-label="Occupancy"><Button type="button" variant={hasTenant ? "default" : "outline"} onClick={() => setHasTenant(true)}>Add tenant now</Button><Button type="button" variant={hasTenant ? "outline" : "default"} onClick={() => setHasTenant(false)}>Keep vacant</Button></div>
            {hasTenant ? <>
              {field("Tenant name", "name", <input autoFocus required className={inputClass} value={tenantName} onChange={(event) => setTenantName(event.target.value)} autoComplete="name" placeholder="Full name" />)}
              {field("Phone (optional)", "phone", <input type="tel" className={inputClass} value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" placeholder="Tenant's phone number" />)}
              <div className="grid grid-cols-2 gap-3">
                {field("Monthly rent (₹)", "monthlyRent", <input required type="number" min="0.01" step="0.01" className={inputClass} value={monthlyRent} onChange={(event) => setMonthlyRent(event.target.value)} placeholder="10000" />)}
                {field("Rent due day", "rentDueDay", <input required type="number" name="rentDueDay" min="1" max="31" value={rentDueDay} onChange={(event) => setRentDueDay(event.target.value)} className={inputClass} />)}
              </div>
              <p className="text-xs text-white/40">Bills are prepared on the 1st using your account&apos;s billing period.</p>
              <details open={Boolean(errors.email || errors.leaseStart || errors.securityDeposit || errors.openingBalance)} className="text-sm text-white/50"><summary className="cursor-pointer">Email, lease and balances (optional)</summary><div className="mt-3 space-y-3">
                {field("Email", "email", <input type="email" name="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} />)}
                {field("Lease start", "leaseStart", <input type="date" name="leaseStart" value={leaseStart} onChange={(event) => setLeaseStart(event.target.value)} className={inputClass} />)}
                {field("Security deposit (₹)", "securityDeposit", <input type="number" name="securityDeposit" min="0" step="0.01" value={securityDeposit} onChange={(event) => setSecurityDeposit(event.target.value)} className={inputClass} />)}
                {field("Unpaid rent from before setup (₹)", "openingBalance", <input type="number" name="openingBalance" min="0" step="0.01" value={openingBalance} onChange={(event) => setOpeningBalance(event.target.value)} className={inputClass} />)}
              </div></details>
              <p className="text-xs leading-5 text-white/40">Tax, identity and rent increase settings are available in Edit tenant.</p>
            </> : <p className="py-3 text-sm text-white/60">Finish now and assign a tenant when this unit is rented.</p>}
          </>}
        </fieldset>
        <p role="status" aria-live="polite" className="min-h-5 text-xs text-[#df8a70]">{message}</p>
        <div className="flex items-center justify-between gap-2"><Button type="button" variant="outline" disabled={pending} onClick={() => step > 0 ? goTo(step - 1) : onClose()}>{step > 0 ? "Back" : "Cancel"}</Button><Button type="submit" disabled={pending}>{pending && <LoaderCircle className="size-4 animate-spin" />}{pending ? "Saving…" : step === 2 ? "Finish setup" : "Continue"}</Button></div>
      </form>}
    </DialogContent>
  </Dialog>;
}
