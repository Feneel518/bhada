"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { electricityBill, tenant, unit } from "@/db/schema";
import { auth } from "@/lib/auth";
import { ensureLandlord } from "@/lib/landlords";

type ElectricityBillField =
  | "unitId"
  | "billingPeriod"
  | "currentReading"
  | "unitRate"
  | "dueDate";

export type ElectricityBillActionState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Partial<Record<ElectricityBillField, string>>;
};

const fail = (
  message: string,
  errors?: ElectricityBillActionState["errors"],
): ElectricityBillActionState => ({ status: "error", message, errors });

function parseIndiaDate(value: string, hour = 12) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const calendarCheck = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    calendarCheck.getUTCFullYear() !== Number(year) ||
    calendarCheck.getUTCMonth() !== Number(month) - 1 ||
    calendarCheck.getUTCDate() !== Number(day)
  ) return null;
  return new Date(`${value}T${String(hour).padStart(2, "0")}:00:00+05:30`);
}

export async function createElectricityBill(
  _previousState: ElectricityBillActionState,
  formData: FormData,
): Promise<ElectricityBillActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail("Your session has expired. Please sign in again.");

  const text = (name: string, maxLength = 250) =>
    String(formData.get(name) ?? "").trim().slice(0, maxLength);
  const unitId = text("unitId", 100);
  const billingPeriod = text("billingPeriod", 10);
  const currentReadingInput = text("currentReading", 30);
  const unitRateInput = text("unitRate", 30);
  const dueDateInput = text("dueDate", 10);
  const errors: ElectricityBillActionState["errors"] = {};

  if (!unitId) errors.unitId = "Choose a unit.";
  const readingDate = parseIndiaDate(billingPeriod);
  if (!readingDate) {
    errors.billingPeriod = "Choose a valid meter reading date.";
  }
  if (!/^\d+(?:\.\d{1,3})?$/.test(currentReadingInput)) {
    errors.currentReading = "Enter a valid meter reading with up to 3 decimal places.";
  }
  if (!/^\d+(?:\.\d{1,4})?$/.test(unitRateInput) || Number(unitRateInput) <= 0) {
    errors.unitRate = "Enter a positive rate with up to 4 decimal places.";
  }
  const dueDate = parseIndiaDate(dueDateInput, 0);
  if (!dueDate) {
    errors.dueDate = "Choose a valid due date.";
  }
  if (Object.keys(errors).length) {
    return fail("Please correct the highlighted fields.", errors);
  }

  const owner = await ensureLandlord(session.user);
  const [ownedUnit] = await db
    .select({
      id: unit.id,
      activeTenantId: tenant.id,
      lastMeterReading: unit.lastMeterReading,
      lastMeterReadingDate: unit.lastMeterReadingDate,
    })
    .from(unit)
    .leftJoin(
      tenant,
      and(
        eq(tenant.unitId, unit.id),
        eq(tenant.landlordId, owner.id),
        eq(tenant.isActive, true),
      ),
    )
    .where(and(eq(unit.id, unitId), eq(unit.landlordId, owner.id)))
    .limit(1);

  if (!ownedUnit) {
    return fail("Unit not found or you no longer have access to it.", {
      unitId: "Choose one of your units.",
    });
  }
  if (ownedUnit.lastMeterReading === null || !ownedUnit.lastMeterReadingDate) {
    return fail("Set an opening meter reading for this unit first.", {
      unitId: "Edit the unit and add its opening reading and date.",
    });
  }

  const previousPeriod = ownedUnit.lastMeterReadingDate.toISOString().slice(0, 10);
  if (billingPeriod <= previousPeriod) {
    return fail("The reading date must be after the unit's previous reading date.", {
      billingPeriod: `Choose a date after ${previousPeriod}.`,
    });
  }

  const currentReading = Number(currentReadingInput);
  if (currentReading < ownedUnit.lastMeterReading) {
    return fail("The current reading cannot be lower than the previous reading.", {
      currentReading: `Enter ${ownedUnit.lastMeterReading} or higher.`,
    });
  }

  const [duplicate] = await db
    .select({ id: electricityBill.id })
    .from(electricityBill)
    .where(
      and(
        eq(electricityBill.unitId, unitId),
        eq(electricityBill.billingPeriod, billingPeriod),
      ),
    )
    .limit(1);
  if (duplicate) {
    return fail("This unit already has an electricity bill for that date.", {
      billingPeriod: "Choose another date.",
    });
  }

  const id = crypto.randomUUID();
  const billNumber = `ELEC-${billingPeriod.replaceAll("-", "")}-${id.slice(0, 6).toUpperCase()}`;
  const unitsConsumed = currentReading - ownedUnit.lastMeterReading;
  const unitRate = Number(unitRateInput);
  const amount = unitsConsumed * unitRate;
  await db.batch([
    db.insert(electricityBill).values({
      id,
      landlordId: owner.id,
      unitId,
      tenantId: ownedUnit.activeTenantId,
      billNumber,
      billingPeriod,
      previousReading: ownedUnit.lastMeterReading.toFixed(3),
      currentReading: currentReading.toFixed(3),
      unitsConsumed: unitsConsumed.toFixed(3),
      unitRate: unitRate.toFixed(4),
      amount: amount.toFixed(2),
      dueDate: dueDate!,
      note: text("note", 1_000) || null,
    }),
    db
      .update(unit)
      .set({
        lastMeterReading: currentReading,
        lastMeterReadingDate: readingDate!,
        updatedAt: new Date(),
      })
      .where(and(eq(unit.id, unitId), eq(unit.landlordId, owner.id))),
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  return { status: "success", message: `Electricity bill ${billNumber} added.` };
}
