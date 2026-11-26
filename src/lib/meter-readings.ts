import "server-only";

import { and, desc, eq, gte, or } from "drizzle-orm";
import { db } from "@/db";
import { landlord, meterReadingSubmission, property, tenant, unit } from "@/db/schema";

export type PendingMeterReading = {
  id: string;
  unitId: string;
  tenantId: string;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  previousReading: number | null;
  previousDate: string;
  reading: number;
  readingDate: string;
  rate: number | null;
  note: string;
};

export async function getPendingMeterReadings(userId: string): Promise<PendingMeterReading[]> {
  const rows = await db
    .select({
      id: meterReadingSubmission.id,
      unitId: meterReadingSubmission.unitId,
      tenantId: meterReadingSubmission.tenantId,
      tenantName: tenant.name,
      propertyName: property.name,
      unitNumber: unit.unitNumber,
      previousReading: unit.lastMeterReading,
      previousDate: unit.lastMeterReadingDate,
      reading: meterReadingSubmission.reading,
      readingDate: meterReadingSubmission.readingDate,
      rate: property.electricityRate,
      note: meterReadingSubmission.note,
    })
    .from(meterReadingSubmission)
    .innerJoin(landlord, eq(meterReadingSubmission.landlordId, landlord.id))
    .innerJoin(tenant, eq(meterReadingSubmission.tenantId, tenant.id))
    .innerJoin(unit, eq(meterReadingSubmission.unitId, unit.id))
    .innerJoin(property, eq(unit.propertyId, property.id))
    .where(and(eq(landlord.userId, userId), eq(meterReadingSubmission.status, "pending")))
    .orderBy(desc(meterReadingSubmission.createdAt));
  return rows.map((row) => ({
    ...row,
    reading: Number(row.reading),
    previousDate: row.previousDate?.toISOString().slice(0, 10) ?? "",
    note: row.note ?? "",
  }));
}

export type TenantMeter = {
  unitId: string;
  lastReading: number | null;
  lastReadingDate: string;
  rate: number | null;
  submissions: { id: string; reading: number; readingDate: string; status: "pending" | "approved" | "rejected"; reviewNote: string }[];
};

export async function getTenantMeter(tenantId: string, unitId: string, now = new Date()): Promise<TenantMeter> {
  const recent = new Date(now.getTime() - 45 * 86_400_000);
  const [[meter], submissions] = await Promise.all([
    db
      .select({ lastReading: unit.lastMeterReading, lastReadingDate: unit.lastMeterReadingDate, rate: property.electricityRate })
      .from(unit)
      .innerJoin(property, eq(unit.propertyId, property.id))
      .where(eq(unit.id, unitId))
      .limit(1),
    db
      .select()
      .from(meterReadingSubmission)
      .where(and(
        eq(meterReadingSubmission.tenantId, tenantId),
        or(eq(meterReadingSubmission.status, "pending"), gte(meterReadingSubmission.createdAt, recent)),
      ))
      .orderBy(desc(meterReadingSubmission.createdAt))
      .limit(6),
  ]);
  return {
    unitId,
    lastReading: meter?.lastReading ?? null,
    lastReadingDate: meter?.lastReadingDate?.toISOString().slice(0, 10) ?? "",
    rate: meter?.rate ?? null,
    submissions: submissions.map((item) => ({
      id: item.id,
      reading: Number(item.reading),
      readingDate: item.readingDate,
      status: item.status === "approved" || item.status === "rejected" ? item.status : "pending",
      reviewNote: item.reviewNote ?? "",
    })),
  };
}
