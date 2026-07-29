import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { landlord, property, tenant, unit } from "@/db/schema";

export type UnitStatus = "vacant" | "occupied" | "maintenance";

export type UnitRecord = {
  id: string;
  propertyId: string;
  unitNumber: string;
  floor: string;
  areaSqft: number | null;
  status: UnitStatus;
  openingMeterReading: number | null;
  openingMeterReadingDate: string;
  lastMeterReading: number | null;
  lastMeterReadingDate: string;
  tenant: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
};

export type PropertyRecord = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  units: UnitRecord[];
};

export async function getProperties(userId: string): Promise<PropertyRecord[]> {
  const rows = await db
    .select({
      id: property.id,
      name: property.name,
      address: property.address,
      city: property.city,
      state: property.state,
      postalCode: property.postalCode,
    })
    .from(property)
    .innerJoin(landlord, eq(property.landlordId, landlord.id))
    .where(eq(landlord.userId, userId))
    .orderBy(desc(property.createdAt));

  const propertyIds = rows.map((row) => row.id);
  const unitRows = propertyIds.length
    ? await db
        .select({
          id: unit.id,
          propertyId: unit.propertyId,
          unitNumber: unit.unitNumber,
          floor: unit.floor,
          areaSqft: unit.areaSqft,
          status: unit.status,
          openingMeterReading: unit.openingMeterReading,
          openingMeterReadingDate: unit.openingMeterReadingDate,
          lastMeterReading: unit.lastMeterReading,
          lastMeterReadingDate: unit.lastMeterReadingDate,
          tenantId: tenant.id,
          tenantName: tenant.name,
          tenantEmail: tenant.email,
          tenantPhone: tenant.phone,
        })
        .from(unit)
        .leftJoin(tenant, and(eq(tenant.unitId, unit.id), eq(tenant.isActive, true)))
        .where(inArray(unit.propertyId, propertyIds))
        .orderBy(unit.unitNumber)
    : [];

  return rows.map((row) => ({
    ...row,
    address: row.address ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    postalCode: row.postalCode ?? "",
    units: unitRows
      .filter((item) => item.propertyId === row.id)
      .map((item) => ({
        id: item.id,
        propertyId: item.propertyId,
        unitNumber: item.unitNumber,
        floor: item.floor ?? "",
        areaSqft: item.areaSqft,
        status: item.status,
        openingMeterReading: item.openingMeterReading ?? item.lastMeterReading,
        openingMeterReadingDate:
          (item.openingMeterReadingDate ?? item.lastMeterReadingDate)?.toISOString().slice(0, 7) ?? "",
        lastMeterReading: item.lastMeterReading,
        lastMeterReadingDate: item.lastMeterReadingDate?.toISOString().slice(0, 10) ?? "",
        tenant: item.tenantId
          ? {
              id: item.tenantId,
              name: item.tenantName!,
              email: item.tenantEmail ?? "",
              phone: item.tenantPhone ?? "",
            }
          : null,
      })),
  }));
}
