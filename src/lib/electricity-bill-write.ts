import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { electricityBill, meterReadingSubmission, tenant, unit } from "@/db/schema";
import type { ensureLandlord } from "@/lib/landlords";
import { getRentalAccess, RENTAL_LOCK_MESSAGE } from "@/lib/plan-access";

export type ElectricityBillField = "unitId" | "billingPeriod" | "currentReading" | "unitRate" | "dueDate";

export type ElectricityWriteResult =
  | { ok: true; id: string; billNumber: string; tenantId: string | null; amount: number }
  | { ok: false; message: string; errors?: Partial<Record<ElectricityBillField, string>> };

export function parseIndiaDate(value: string, hour = 12) {
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

/**
 * Creates an electricity bill from a meter reading and moves the unit's last
 * reading forward. Shared by the landlord's form and by approving a tenant's
 * submitted reading (which is marked approved in the same transaction).
 */
export async function insertElectricityBill(
  owner: Awaited<ReturnType<typeof ensureLandlord>>,
  input: {
    unitId: string;
    billingPeriod: string;
    currentReading: number;
    unitRate: number;
    dueDate: Date;
    note: string | null;
    submissionId?: string;
  },
): Promise<ElectricityWriteResult> {
  const { unitId, billingPeriod, currentReading, unitRate, dueDate } = input;
  const readingDate = parseIndiaDate(billingPeriod);
  if (!readingDate) return { ok: false, message: "Choose a valid meter reading date.", errors: { billingPeriod: "Choose a valid meter reading date." } };

  if (!(await getRentalAccess(owner)).unitIds.includes(unitId)) {
    return { ok: false, message: RENTAL_LOCK_MESSAGE };
  }
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
      and(eq(tenant.unitId, unit.id), eq(tenant.landlordId, owner.id), eq(tenant.isActive, true)),
    )
    .where(and(eq(unit.id, unitId), eq(unit.landlordId, owner.id)))
    .limit(1);

  if (!ownedUnit) {
    return { ok: false, message: "Unit not found or you no longer have access to it.", errors: { unitId: "Choose one of your units." } };
  }
  if (ownedUnit.lastMeterReading === null || !ownedUnit.lastMeterReadingDate) {
    return { ok: false, message: "Set an opening meter reading for this unit first.", errors: { unitId: "Edit the unit and add its opening reading and date." } };
  }

  const previousPeriod = ownedUnit.lastMeterReadingDate.toISOString().slice(0, 10);
  if (billingPeriod <= previousPeriod) {
    return {
      ok: false,
      message: "The reading date must be after the unit's previous reading date.",
      errors: { billingPeriod: `Choose a date after ${previousPeriod}.` },
    };
  }
  if (currentReading < ownedUnit.lastMeterReading) {
    return {
      ok: false,
      message: "The current reading cannot be lower than the previous reading.",
      errors: { currentReading: `Enter ${ownedUnit.lastMeterReading} or higher.` },
    };
  }

  const [duplicate] = await db
    .select({ id: electricityBill.id })
    .from(electricityBill)
    .where(and(eq(electricityBill.unitId, unitId), eq(electricityBill.billingPeriod, billingPeriod)))
    .limit(1);
  if (duplicate) {
    return { ok: false, message: "This unit already has an electricity bill for that date.", errors: { billingPeriod: "Choose another date." } };
  }

  const id = crypto.randomUUID();
  const billNumber = `ELEC-${billingPeriod.replaceAll("-", "")}-${id.slice(0, 6).toUpperCase()}`;
  const unitsConsumed = currentReading - ownedUnit.lastMeterReading;
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
      dueDate,
      note: input.note,
    }),
    db
      .update(unit)
      .set({ lastMeterReading: currentReading, lastMeterReadingDate: readingDate, updatedAt: new Date() })
      .where(and(eq(unit.id, unitId), eq(unit.landlordId, owner.id))),
    ...(input.submissionId
      ? [db.update(meterReadingSubmission)
          .set({ status: "approved", reviewedAt: new Date(), electricityBillId: id })
          .where(and(
            eq(meterReadingSubmission.id, input.submissionId),
            eq(meterReadingSubmission.landlordId, owner.id),
            eq(meterReadingSubmission.status, "pending"),
          ))]
      : []),
  ]);

  return { ok: true, id, billNumber, tenantId: ownedUnit.activeTenantId, amount };
}
