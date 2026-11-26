import "server-only";

import { and, desc, eq, gte, or } from "drizzle-orm";
import { db } from "@/db";
import { landlord, paymentClaim, property, tenant, unit, user } from "@/db/schema";
import { getElectricityBills, type ElectricityBillRecord } from "@/lib/electricity-billing";
import { getPayments } from "@/lib/payments";
import { getRentBilling, type RentBillRecord } from "@/lib/rent-billing";
import { appOrigin, buildShareLinks, type ShareLinks } from "@/lib/share-links";
import { getTenantAnalytics } from "@/lib/tenant-analytics";

export const PORTAL_TOKEN_PATTERN = /^[0-9a-f]{32}$/;
export const CLAIM_METHODS = ["upi", "bank_transfer", "cash", "check"] as const;
export type ClaimMethod = (typeof CLAIM_METHODS)[number];
export const MAX_PENDING_CLAIMS = 3;

export function portalUrl(token: string) {
  return `${appOrigin()}/t/${token}`;
}

export function newPortalToken() {
  return crypto.randomUUID().replaceAll("-", "");
}

export type PortalClaim = {
  id: string;
  amount: number;
  paidOn: string;
  method: string;
  reference: string;
  status: "pending" | "confirmed" | "rejected";
  reviewNote: string;
  createdAt: string;
};

export type TenantPortal = {
  token: string;
  tenant: { id: string; name: string; isActive: boolean; propertyName: string; propertyAddress: string; unitNumber: string };
  landlord: { businessName: string; phone: string; upiId: string };
  outstanding: number;
  rentBills: RentBillRecord[];
  electricityBills: ElectricityBillRecord[];
  payments: { id: string; receiptNumber: string; amount: number; date: string }[];
  claims: PortalClaim[];
  shareLinks: ShareLinks;
};

export async function findTenantByPortalToken(token: string) {
  if (!PORTAL_TOKEN_PATTERN.test(token)) return null;
  const [row] = await db
    .select({
      id: tenant.id,
      name: tenant.name,
      phone: tenant.phone,
      isActive: tenant.isActive,
      landlordId: tenant.landlordId,
      userId: landlord.userId,
      businessName: landlord.businessName,
      landlordPhone: landlord.phone,
      upiId: landlord.upiId,
      landlordEmail: user.email,
      propertyName: property.name,
      propertyAddress: property.address,
      propertyCity: property.city,
      unitNumber: unit.unitNumber,
    })
    .from(tenant)
    .innerJoin(landlord, eq(tenant.landlordId, landlord.id))
    .innerJoin(user, eq(landlord.userId, user.id))
    .innerJoin(unit, eq(tenant.unitId, unit.id))
    .innerJoin(property, eq(unit.propertyId, property.id))
    .where(eq(tenant.portalToken, token))
    .limit(1);
  return row ?? null;
}

export async function getTenantPortal(token: string, now = new Date()): Promise<TenantPortal | null> {
  const row = await findTenantByPortalToken(token);
  if (!row) return null;

  const recent = new Date(now.getTime() - 45 * 86_400_000);
  const [billing, electricity, payments, analytics, claims] = await Promise.all([
    getRentBilling(row.userId, now),
    getElectricityBills(row.userId, now),
    getPayments(row.userId),
    getTenantAnalytics(row.userId),
    db
      .select()
      .from(paymentClaim)
      .where(and(
        eq(paymentClaim.tenantId, row.id),
        // Pending claims always show; decided ones fade out after ~6 weeks.
        or(eq(paymentClaim.status, "pending"), gte(paymentClaim.createdAt, recent)),
      ))
      .orderBy(desc(paymentClaim.createdAt))
      .limit(12),
  ]);

  const rentBills = billing.bills.filter((bill) => bill.tenantId === row.id);
  const electricityBills = electricity.filter((bill) => bill.tenantId === row.id);
  const tenantPayments = payments
    .filter((payment) => payment.tenantId === row.id)
    .slice(0, 24)
    .map((payment) => ({ id: payment.id, receiptNumber: payment.receiptNumber, amount: payment.amount, date: payment.date }));
  const shareLinks = await buildShareLinks([
    ...rentBills.map((bill) => ({ kind: "rent" as const, id: bill.id })),
    ...electricityBills.map((bill) => ({ kind: "electricity" as const, id: bill.id })),
    ...tenantPayments.map((payment) => ({ kind: "receipt" as const, id: payment.id })),
  ]);

  return {
    token,
    tenant: {
      id: row.id,
      name: row.name,
      isActive: row.isActive,
      propertyName: row.propertyName,
      propertyAddress: [row.propertyAddress, row.propertyCity].filter(Boolean).join(", "),
      unitNumber: row.unitNumber,
    },
    landlord: { businessName: row.businessName, phone: row.landlordPhone ?? "", upiId: row.upiId ?? "" },
    outstanding: analytics.find((item) => item.tenantId === row.id)?.totalPending ?? 0,
    rentBills,
    electricityBills,
    payments: tenantPayments,
    claims: claims.map((claim) => ({
      id: claim.id,
      amount: Number(claim.amount),
      paidOn: claim.paidOn.toISOString().slice(0, 10),
      method: claim.method,
      reference: claim.reference ?? "",
      status: claim.status === "confirmed" || claim.status === "rejected" ? claim.status : "pending",
      reviewNote: claim.reviewNote ?? "",
      createdAt: claim.createdAt.toISOString(),
    })),
    shareLinks,
  };
}

export type LandlordClaim = {
  id: string;
  tenantId: string;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  amount: number;
  paidOn: string;
  method: ClaimMethod;
  reference: string;
  note: string;
  createdAt: string;
};

export async function getPendingClaims(userId: string): Promise<LandlordClaim[]> {
  const rows = await db
    .select({
      id: paymentClaim.id,
      tenantId: paymentClaim.tenantId,
      tenantName: tenant.name,
      propertyName: property.name,
      unitNumber: unit.unitNumber,
      amount: paymentClaim.amount,
      paidOn: paymentClaim.paidOn,
      method: paymentClaim.method,
      reference: paymentClaim.reference,
      note: paymentClaim.note,
      createdAt: paymentClaim.createdAt,
    })
    .from(paymentClaim)
    .innerJoin(landlord, eq(paymentClaim.landlordId, landlord.id))
    .innerJoin(tenant, eq(paymentClaim.tenantId, tenant.id))
    .innerJoin(unit, eq(tenant.unitId, unit.id))
    .innerJoin(property, eq(unit.propertyId, property.id))
    .where(and(eq(landlord.userId, userId), eq(paymentClaim.status, "pending")))
    .orderBy(desc(paymentClaim.createdAt));

  return rows.map((row) => ({
    ...row,
    amount: Number(row.amount),
    paidOn: row.paidOn.toISOString().slice(0, 10),
    method: (CLAIM_METHODS as readonly string[]).includes(row.method) ? (row.method as ClaimMethod) : "upi",
    reference: row.reference ?? "",
    note: row.note ?? "",
    createdAt: row.createdAt.toISOString(),
  }));
}
