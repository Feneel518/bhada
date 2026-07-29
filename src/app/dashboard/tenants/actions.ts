"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { tenant, unit } from "@/db/schema";
import { auth } from "@/lib/auth";
import { ensureLandlord } from "@/lib/landlords";

type TenantField =
  | "unitId"
  | "name"
  | "email"
  | "phone"
  | "aadhaarLast4"
  | "panMasked"
  | "leaseStart"
  | "leaseEnd"
  | "monthlyRent"
  | "rentBillingDay"
  | "securityDeposit"
  | "lockInMonths"
  | "noticePeriodMonths"
  | "rentEscalationPct"
  | "rentEscalationMonths"
  | "nextEscalationDate"
  | "leaseDocUrl"
  | "openingBalance"
  | "creditBalance";

export type TenantActionState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Partial<Record<TenantField, string>>;
};

const error = (message: string): TenantActionState => ({ status: "error", message });
const optional = (value: string) => value || null;
const date = (value: string) => (value ? new Date(`${value}T00:00:00`) : null);

function optionalNumber(raw: string, label: string, integer = false) {
  if (!raw) return { value: null as number | null };
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || (integer && !Number.isInteger(value))) {
    return { value: null as number | null, error: `${label} must be a non-negative ${integer ? "whole number" : "number"}.` };
  }
  return { value };
}

function refreshTenantViews() {
  revalidatePath("/dashboard");
}

async function syncUnitStatus(unitId: string, landlordId: string) {
  const [activeTenant] = await db
    .select({ id: tenant.id })
    .from(tenant)
    .where(and(eq(tenant.unitId, unitId), eq(tenant.landlordId, landlordId), eq(tenant.isActive, true)))
    .limit(1);

  await db
    .update(unit)
    .set({ status: activeTenant ? "occupied" : "vacant", updatedAt: new Date() })
    .where(and(eq(unit.id, unitId), eq(unit.landlordId, landlordId)));
}

export async function saveTenant(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return error("Your session has expired. Please sign in again.");

  const value = (name: string) => String(formData.get(name) ?? "").trim();
  const id = value("id");
  const unitId = value("unitId");
  const name = value("name");
  const email = value("email").toLowerCase();
  const phone = value("phone");
  const aadhaarLast4 = value("aadhaarLast4").replace(/\D/g, "");
  const panInput = value("panMasked").toUpperCase().replace(/\s/g, "");
  const leaseStart = value("leaseStart");
  const leaseEnd = value("leaseEnd");
  const nextEscalationDate = value("nextEscalationDate");
  const isActive = formData.get("isActive") === "on";
  const monthlyRent = optionalNumber(value("monthlyRent"), "Monthly rent");
  const rentBillingDay = optionalNumber(value("rentBillingDay"), "Rent billing day", true);
  const securityDeposit = optionalNumber(value("securityDeposit"), "Security deposit");
  const lockInMonths = optionalNumber(value("lockInMonths"), "Lock-in period", true);
  const noticePeriodMonths = optionalNumber(value("noticePeriodMonths"), "Notice period", true);
  const rentEscalationPct = optionalNumber(value("rentEscalationPct"), "Rent increase percentage");
  const rentEscalationMonths = optionalNumber(value("rentEscalationMonths"), "Rent increase interval", true);
  const openingBalance = optionalNumber(value("openingBalance"), "Opening balance");
  const creditBalance = optionalNumber(value("creditBalance"), "Credit balance");
  const errors: TenantActionState["errors"] = {};

  if (!unitId) errors.unitId = "Choose a unit.";
  if (!name) errors.name = "Tenant name is required.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  if (aadhaarLast4 && aadhaarLast4.length !== 4) errors.aadhaarLast4 = "Enter only the last 4 Aadhaar digits.";
  const isFullPan = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panInput);
  const isAlreadyMaskedPan = /^[A-Z]{2}\*{3}[A-Z0-9]{5}$/.test(panInput);
  if (panInput && !isFullPan && !isAlreadyMaskedPan) {
    errors.panMasked = "Enter a valid PAN, such as ABCDE1234F.";
  }
  if (leaseStart && Number.isNaN(date(leaseStart)?.getTime())) errors.leaseStart = "Choose a valid start date.";
  if (leaseEnd && Number.isNaN(date(leaseEnd)?.getTime())) errors.leaseEnd = "Choose a valid end date.";
  if (leaseStart && leaseEnd && date(leaseEnd)! < date(leaseStart)!) errors.leaseEnd = "Lease end must be after the start date.";
  if (nextEscalationDate && Number.isNaN(date(nextEscalationDate)?.getTime())) errors.nextEscalationDate = "Choose a valid escalation date.";
  if (monthlyRent.error) errors.monthlyRent = monthlyRent.error;
  if (rentBillingDay.error || rentBillingDay.value === null || rentBillingDay.value < 1 || rentBillingDay.value > 31) {
    errors.rentBillingDay = "Rent billing day must be between 1 and 31.";
  }
  if (securityDeposit.error) errors.securityDeposit = securityDeposit.error;
  if (lockInMonths.error) errors.lockInMonths = lockInMonths.error;
  if (noticePeriodMonths.error) errors.noticePeriodMonths = noticePeriodMonths.error;
  if (rentEscalationPct.error) errors.rentEscalationPct = rentEscalationPct.error;
  if (rentEscalationMonths.error) errors.rentEscalationMonths = rentEscalationMonths.error;
  if (openingBalance.error) errors.openingBalance = openingBalance.error;
  if (creditBalance.error) errors.creditBalance = creditBalance.error;

  const leaseDocUrl = value("leaseDocUrl");
  if (leaseDocUrl) {
    try {
      const parsed = new URL(leaseDocUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    } catch {
      errors.leaseDocUrl = "Enter a valid http(s) document URL.";
    }
  }

  if (Object.keys(errors).length) {
    return { status: "error", message: "Please correct the highlighted fields.", errors };
  }

  const owner = await ensureLandlord(session.user);
  const [ownedUnit] = await db
    .select({ id: unit.id })
    .from(unit)
    .where(and(eq(unit.id, unitId), eq(unit.landlordId, owner.id)))
    .limit(1);
  if (!ownedUnit) return error("Unit not found or you no longer have access to it.");

  if (isActive) {
    const conditions = [
      eq(tenant.unitId, unitId),
      eq(tenant.landlordId, owner.id),
      eq(tenant.isActive, true),
    ];
    if (id) conditions.push(ne(tenant.id, id));
    const [conflict] = await db.select({ id: tenant.id }).from(tenant).where(and(...conditions)).limit(1);
    if (conflict) {
      return {
        status: "error",
        message: "This unit already has an active tenant.",
        errors: { unitId: "Choose a vacant unit or mark the other tenancy inactive." },
      };
    }
  }

  const values = {
    unitId,
    landlordId: owner.id,
    name,
    email: optional(email),
    phone: optional(phone),
    aadhaarMasked: aadhaarLast4 ? `XXXX XXXX ${aadhaarLast4}` : null,
    panMasked: panInput
      ? isFullPan
        ? `${panInput.slice(0, 2)}***${panInput.slice(-5)}`
        : panInput
      : null,
    gstin: optional(value("gstin").toUpperCase()),
    emergencyContact: optional(value("emergencyContact")),
    emergencyPhone: optional(value("emergencyPhone")),
    leaseStart: date(leaseStart),
    leaseEnd: date(leaseEnd),
    monthlyRent: monthlyRent.value,
    rentBillingDay: rentBillingDay.value ?? 1,
    securityDeposit: securityDeposit.value,
    lockInMonths: lockInMonths.value,
    noticePeriodMonths: noticePeriodMonths.value,
    rentEscalationPct: rentEscalationPct.value,
    rentEscalationMonths: rentEscalationMonths.value,
    nextEscalationDate: date(nextEscalationDate),
    leaseDocUrl: optional(leaseDocUrl),
    isActive,
    openingBalance: openingBalance.value ?? 0,
    creditBalance: creditBalance.value ?? 0,
    updatedAt: new Date(),
  };

  let previousUnitId = "";
  if (id) {
    const [existing] = await db
      .select({ unitId: tenant.unitId })
      .from(tenant)
      .where(and(eq(tenant.id, id), eq(tenant.landlordId, owner.id)))
      .limit(1);
    if (!existing) return error("Tenant not found or you no longer have access to it.");
    previousUnitId = existing.unitId;
    await db.update(tenant).set(values).where(and(eq(tenant.id, id), eq(tenant.landlordId, owner.id)));
  } else {
    await db.insert(tenant).values({ id: crypto.randomUUID(), ...values });
  }

  await syncUnitStatus(unitId, owner.id);
  if (previousUnitId && previousUnitId !== unitId) await syncUnitStatus(previousUnitId, owner.id);
  refreshTenantViews();
  return { status: "success", message: id ? "Tenant updated." : "Tenant added." };
}

export async function deleteTenant(id: string): Promise<TenantActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return error("Your session has expired. Please sign in again.");

  const owner = await ensureLandlord(session.user);
  const [existing] = await db
    .select({ unitId: tenant.unitId })
    .from(tenant)
    .where(and(eq(tenant.id, id), eq(tenant.landlordId, owner.id)))
    .limit(1);
  if (!existing) return error("Tenant not found or you no longer have access to it.");

  await db.delete(tenant).where(and(eq(tenant.id, id), eq(tenant.landlordId, owner.id)));
  await syncUnitStatus(existing.unitId, owner.id);
  refreshTenantViews();
  return { status: "success", message: "Tenant deleted." };
}
