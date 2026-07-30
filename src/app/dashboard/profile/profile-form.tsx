"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarClock,
  Check,
  CreditCard,
  Landmark,
  LoaderCircle,
  MapPin,
  ReceiptText,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-controls";
import { SubscriptionBillingHistory } from "@/components/subscription-receipt-card";
import type { SubscriptionReceipt } from "@/lib/subscription-receipts";

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
  "h-11 w-full border border-white/10 bg-white/[0.02] px-3.5 text-sm text-[#edede8] outline-none transition placeholder:text-white/25 focus:border-[#e4c77a]/55 focus:bg-white/[0.035]";

const profileSections = [
  { id: "plan", label: "Plan", description: "Subscription and access", icon: CreditCard },
  { id: "receipts", label: "Billing history", description: "Receipts and payments", icon: ReceiptText },
  { id: "business", label: "Business", description: "Name and contact", icon: Building2 },
  { id: "tax", label: "Tax details", description: "GSTIN and PAN", icon: ReceiptText },
  { id: "address", label: "Address", description: "Business location", icon: MapPin },
  { id: "billing", label: "Rent billing", description: "Monthly bill period", icon: CalendarClock },
] as const;

type ProfileSection = (typeof profileSections)[number]["id"];

export function ProfileForm({
  email,
  initialValues,
  subscription,
  receipts,
  initialSection = "business",
  focusedReceiptId,
}: {
  email: string;
  initialValues: ProfileValues;
  subscription: {
    active: boolean;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  };
  receipts: SubscriptionReceipt[];
  initialSection?: ProfileSection;
  focusedReceiptId?: string;
}) {
  const router = useRouter();
  const [result, setResult] = useState<SaveResult>({ status: "idle", message: "" });
  const [pending, setPending] = useState(false);
  const [gstin, setGstin] = useState(initialValues.gstin);
  const [pan, setPan] = useState(initialValues.pan);
  const [cancelPending, setCancelPending] = useState(false);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(subscription.cancelAtPeriodEnd);
  const [cancellationMessage, setCancellationMessage] = useState("");
  const [activeSection, setActiveSection] = useState<ProfileSection>(initialSection);

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

  async function scheduleDowngrade() {
    const confirmed = window.confirm(
      "Downgrade to One Door at the end of this billing cycle? Future renewals will stop, and your existing data will be kept.",
    );
    if (!confirmed) return;

    setCancelPending(true);
    setCancellationMessage("");
    try {
      const response = await fetch("/api/billing/razorpay/cancel", { method: "POST" });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message || "Unable to schedule the downgrade.");
      }
      setCancelAtPeriodEnd(true);
      setCancellationMessage(payload.message || "Your downgrade is scheduled.");
      router.refresh();
    } catch (error) {
      setCancellationMessage(
        error instanceof Error ? error.message : "Unable to schedule the downgrade.",
      );
    } finally {
      setCancelPending(false);
    }
  }

  const paidThrough = subscription.currentPeriodEnd
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }).format(new Date(subscription.currentPeriodEnd))
    : null;

  return (
    <div className="animate-rise">
      <header>
        <p className="text-xs text-[#8a909f] sm:text-sm">Account settings</p>
        <h1 className="mt-1 font-display text-[29px] font-extrabold tracking-[-0.045em] sm:text-[34px]">
          Business profile
        </h1>
        <p className="mt-1 text-[13px] text-[#747b8b] sm:text-sm">
          Manage the business information used across your portfolio, invoices, and rent bills.
        </p>
      </header>

      <div className="mt-7 grid items-start gap-4 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside>
          <div className="border border-white/10 bg-[#151515] p-2">
            <p className="px-3 pb-2.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
              Profile sections
            </p>
            <nav
              className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1"
              aria-label="Profile sections"
            >
              {profileSections.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  aria-pressed={activeSection === item.id}
                  className={`flex min-w-0 items-center gap-3 border px-3 py-3 text-left transition ${
                    activeSection === item.id
                      ? "border-[#e4c77a]/40 bg-[#e4c77a]/[0.07] text-[#e4c77a]"
                      : "border-transparent text-white/45 hover:border-white/10 hover:bg-white/[0.025] hover:text-white/70"
                  }`}
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center border ${
                      activeSection === item.id
                        ? "border-[#e4c77a]/30 bg-[#e4c77a]/[0.04]"
                        : "border-white/[0.08] bg-white/[0.015]"
                    }`}
                  >
                    <item.icon className="size-4" strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold">{item.label}</span>
                    <span
                      className={`mt-0.5 hidden truncate text-[10px] font-normal lg:block ${
                        activeSection === item.id ? "text-[#e4c77a]/55" : "text-white/25"
                      }`}
                    >
                      {item.description}
                    </span>
                  </span>
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-3 hidden border-l border-white/10 px-4 py-2 lg:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/25">
              Signed in as
            </p>
            <p className="mt-1.5 truncate text-xs text-white/50" title={email}>
              {email}
            </p>
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          <section
            className={`border border-white/10 bg-[#171717] ${
              activeSection === "plan" ? "block" : "hidden"
            }`}
          >
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center border border-[#e4c77a]/30 bg-[#e4c77a]/[0.04] text-[#e4c77a]">
                  <CreditCard className="size-5" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                    Current plan
                  </p>
                  <h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.025em] text-[#edede8]">
                    {subscription.active ? "Portfolio plan" : "One Door plan"}
                  </h2>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-white/40">
                    {cancelAtPeriodEnd
                      ? `Your subscription will not renew${paidThrough ? ` after ${paidThrough}` : ""}. Portfolio access stays available until then.`
                      : subscription.active
                        ? `₹49 per month${paidThrough ? ` · current period ends ${paidThrough}` : ""}.`
                        : "Free plan · 1 property and 3 units."}
                  </p>
                </div>
              </div>
              {subscription.active && !cancelAtPeriodEnd && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={scheduleDowngrade}
                  disabled={cancelPending}
                  className="shrink-0"
                >
                  {cancelPending && <LoaderCircle className="size-4 animate-spin" />}
                  {cancelPending ? "Scheduling..." : "Downgrade plan"}
                </Button>
              )}
              {cancelAtPeriodEnd && (
                <span className="shrink-0 border border-[#e4c77a]/25 bg-[#e4c77a]/[0.05] px-3 py-2 text-xs font-semibold text-[#e4c77a]">
                  Cancellation scheduled
                </span>
              )}
            </div>
            {cancellationMessage && (
              <p
                aria-live="polite"
                className={`border-t border-white/10 px-5 py-3 text-sm sm:px-6 ${
                  cancelAtPeriodEnd ? "font-semibold text-[#7fc5ad]" : "font-medium text-[#d98678]"
                }`}
              >
                {cancellationMessage}
              </p>
            )}
          </section>

          <div className={activeSection === "receipts" ? "block" : "hidden"}>
            <SubscriptionBillingHistory
              receipts={receipts}
              customer={{ name: initialValues.businessName, email }}
              focusedReceiptId={focusedReceiptId}
            />
          </div>

          <form
            data-profile-settings
            onSubmit={submit}
            className={
              activeSection === "plan" || activeSection === "receipts" ? "hidden" : "block"
            }
          >
            <SettingSection
              hidden={activeSection !== "business"}
              eyebrow="Identity"
              title="Business details"
              description="The primary information that identifies your rental business."
              icon={Building2}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Business name" required>
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
              </div>
            </SettingSection>

            <SettingSection
              hidden={activeSection !== "tax"}
              eyebrow="Compliance"
              title="Tax details"
              description="Optional tax identifiers shown on applicable invoices and bills."
              icon={ReceiptText}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="GSTIN" hint="15 characters">
                  <input
                    className={inputClass}
                    name="gstin"
                    value={gstin}
                    onChange={(event) =>
                      setGstin(event.target.value.toUpperCase().replace(/\s/g, ""))
                    }
                    maxLength={15}
                    autoCapitalize="characters"
                    aria-invalid={Boolean(gstinError)}
                    aria-describedby={gstinError ? "gstin-error" : undefined}
                    placeholder="22AAAAA0000A1Z5"
                  />
                  {gstinError && (
                    <p id="gstin-error" className="mt-2 text-xs font-medium text-[#d98678]">
                      {gstinError} You can still save this profile.
                    </p>
                  )}
                </Field>
                <Field label="PAN">
                  <input
                    className={inputClass}
                    name="pan"
                    value={pan}
                    onChange={(event) =>
                      setPan(event.target.value.toUpperCase().replace(/\s/g, ""))
                    }
                    maxLength={10}
                    pattern="[A-Z]{5}[0-9]{4}[A-Z]"
                    autoCapitalize="characters"
                    aria-invalid={Boolean(panError)}
                    aria-describedby={panError ? "pan-error" : undefined}
                    placeholder="ABCDE1234F"
                  />
                  {panError && (
                    <p id="pan-error" className="mt-2 text-xs font-medium text-[#d98678]">
                      {panError}
                    </p>
                  )}
                </Field>
              </div>
              <div className="mt-4 flex items-start gap-2 border-t border-white/[0.07] pt-4 text-xs leading-5 text-white/30">
                <Landmark className="mt-0.5 size-3.5 shrink-0 text-[#e4c77a]/60" />
                These identifiers are only used in your business documents.
              </div>
            </SettingSection>

            <SettingSection
              hidden={activeSection !== "address"}
              eyebrow="Location"
              title="Business address"
              description="The registered or correspondence address for your business."
              icon={MapPin}
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Street address" className="sm:col-span-2 lg:col-span-3">
                  <textarea
                    className={`${inputClass} min-h-24 resize-y py-3`}
                    name="address"
                    defaultValue={initialValues.address}
                    autoComplete="street-address"
                    placeholder="Street, building, area"
                  />
                </Field>
                <Field label="City">
                  <input
                    className={inputClass}
                    name="city"
                    defaultValue={initialValues.city}
                    autoComplete="address-level2"
                    placeholder="Mumbai"
                  />
                </Field>
                <Field label="State">
                  <input
                    className={inputClass}
                    name="state"
                    defaultValue={initialValues.state}
                    autoComplete="address-level1"
                    placeholder="Maharashtra"
                  />
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
            </SettingSection>

            <SettingSection
              hidden={activeSection !== "billing"}
              eyebrow="Automation"
              title="Billing preference"
              description="Choose which rental period monthly bills should cover."
              icon={CalendarClock}
            >
              <Field label="Monthly rent billing">
                <FormSelect
                  className={inputClass}
                  name="rentBillingPeriod"
                  defaultValue={initialValues.rentBillingPeriod}
                  options={[
                    { value: "previous", label: "Previous month" },
                    { value: "current", label: "Current month" },
                  ]}
                />
                <p className="mt-2.5 max-w-2xl text-xs leading-5 text-white/35">
                  On the first of each month, Bhada creates rent bills for the selected period.
                  Adding a new tenant never creates a bill automatically.
                </p>
              </Field>
            </SettingSection>

            <footer className="mt-3 flex flex-col gap-4 border border-white/10 bg-[#151515] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div aria-live="polite" className="min-h-5 text-sm">
                {result.message ? (
                  <p
                    className={
                      result.status === "success"
                        ? "flex items-center gap-2 font-semibold text-[#7fc5ad]"
                        : "font-medium text-[#d98678]"
                    }
                  >
                    {result.status === "success" && <Check className="size-4" />}
                    {result.message}
                  </p>
                ) : (
                  <p className="text-xs text-white/30">
                    Changes apply to future business documents.
                  </p>
                )}
              </div>
              <Button type="submit" className="sm:min-w-40" disabled={pending}>
                {pending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {pending ? "Saving..." : "Save changes"}
              </Button>
            </footer>
          </form>
        </div>
      </div>
    </div>
  );
}

function SettingSection({
  hidden,
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
}: {
  hidden?: boolean;
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof Building2;
  children: React.ReactNode;
}) {
  return (
    <section className={`${hidden ? "hidden" : "block"} border border-white/10 bg-[#171717]`}>
      <div className="border-b border-white/10 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-4">
          <span className="grid size-10 shrink-0 place-items-center border border-white/10 bg-white/[0.025] text-[#e4c77a]">
            <Icon className="size-[18px]" strokeWidth={1.8} />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e4c77a]/65">
              {eyebrow}
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold tracking-[-0.025em] text-[#edede8]">
              {title}
            </h2>
            <p className="mt-1 text-xs leading-5 text-white/35">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
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
      <span className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
        {label}
        {required && <span className="text-[#d98678]">*</span>}
        {hint && (
          <span className="ml-auto normal-case tracking-normal text-white/25">{hint}</span>
        )}
      </span>
      {children}
    </label>
  );
}
