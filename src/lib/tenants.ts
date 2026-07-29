import "server-only";

import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { landlord, property, tenant, unit } from "@/db/schema";

export type TenantRecord = {
  id: string;
  unitId: string;
  propertyName: string;
  unitNumber: string;
  name: string;
  email: string;
  phone: string;
  aadhaarMasked: string;
  panMasked: string;
  gstin: string;
  emergencyContact: string;
  emergencyPhone: string;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number | null;
  rentBillingDay: number;
  gstEnabled: boolean;
  gstRate: number;
  tdsEnabled: boolean;
  tdsRate: number;
  securityDeposit: number | null;
  lockInMonths: number | null;
  noticePeriodMonths: number | null;
  rentEscalationPct: number | null;
  rentEscalationMonths: number | null;
  nextEscalationDate: string;
  leaseDocUrl: string;
  isActive: boolean;
  openingBalance: number;
  creditBalance: number;
};

const dateValue = (value: Date | null) => value?.toISOString().slice(0, 10) ?? "";

export async function getTenants(userId: string): Promise<TenantRecord[]> {
  const rows = await db
    .select({
      id: tenant.id,
      unitId: tenant.unitId,
      propertyName: property.name,
      unitNumber: unit.unitNumber,
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      aadhaarMasked: tenant.aadhaarMasked,
      panMasked: tenant.panMasked,
      gstin: tenant.gstin,
      emergencyContact: tenant.emergencyContact,
      emergencyPhone: tenant.emergencyPhone,
      leaseStart: tenant.leaseStart,
      leaseEnd: tenant.leaseEnd,
      monthlyRent: tenant.monthlyRent,
      rentBillingDay: tenant.rentBillingDay,
      gstEnabled: tenant.gstEnabled,
      gstRate: tenant.gstRate,
      tdsEnabled: tenant.tdsEnabled,
      tdsRate: tenant.tdsRate,
      securityDeposit: tenant.securityDeposit,
      lockInMonths: tenant.lockInMonths,
      noticePeriodMonths: tenant.noticePeriodMonths,
      rentEscalationPct: tenant.rentEscalationPct,
      rentEscalationMonths: tenant.rentEscalationMonths,
      nextEscalationDate: tenant.nextEscalationDate,
      leaseDocUrl: tenant.leaseDocUrl,
      isActive: tenant.isActive,
      openingBalance: tenant.openingBalance,
      creditBalance: tenant.creditBalance,
    })
    .from(tenant)
    .innerJoin(landlord, eq(tenant.landlordId, landlord.id))
    .innerJoin(unit, eq(tenant.unitId, unit.id))
    .innerJoin(property, eq(unit.propertyId, property.id))
    .where(eq(landlord.userId, userId))
    .orderBy(desc(tenant.createdAt));

  return rows.map((row) => ({
    ...row,
    email: row.email ?? "",
    phone: row.phone ?? "",
    aadhaarMasked: row.aadhaarMasked ?? "",
    panMasked: row.panMasked ?? "",
    gstin: row.gstin ?? "",
    emergencyContact: row.emergencyContact ?? "",
    emergencyPhone: row.emergencyPhone ?? "",
    leaseStart: dateValue(row.leaseStart),
    leaseEnd: dateValue(row.leaseEnd),
    nextEscalationDate: dateValue(row.nextEscalationDate),
    leaseDocUrl: row.leaseDocUrl ?? "",
  }));
}
