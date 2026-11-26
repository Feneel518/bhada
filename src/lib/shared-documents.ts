import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  electricityBill,
  landlord,
  paymentAllocation,
  paymentReceipt,
  property,
  rentBill,
  tenant,
  unit,
  user,
} from "@/db/schema";
import type { BillDocument, BillIssuer } from "@/components/bill-document";
import { getElectricityBills } from "@/lib/electricity-billing";
import { getRentBilling } from "@/lib/rent-billing";
import { getTenantAnalytics } from "@/lib/tenant-analytics";
import type { ShareKind } from "@/lib/share-keys";

export type SharedReceipt = {
  receiptNumber: string;
  amount: number;
  paidAt: string;
  method: string;
  reference: string;
  tenantName: string;
  propertyName: string;
  propertyAddress: string;
  unitNumber: string;
  lines: { label: string; amount: number }[];
};

export type SharedDocument =
  | { kind: "bill"; document: BillDocument; issuer: BillIssuer }
  | { kind: "receipt"; receipt: SharedReceipt; issuer: BillIssuer };

function financialYearStartFor(period: string) {
  const [year, month] = period.split("-").map(Number);
  return month >= 4 ? year : year - 1;
}

async function issuerFor(landlordId: string): Promise<{ issuer: BillIssuer; userId: string } | null> {
  const [row] = await db
    .select({
      userId: landlord.userId,
      businessName: landlord.businessName,
      email: user.email,
      phone: landlord.phone,
      gstin: landlord.gstin,
      pan: landlord.pan,
      address: landlord.address,
      city: landlord.city,
      state: landlord.state,
      pincode: landlord.pincode,
      showOutstandingOnInvoice: landlord.showOutstandingOnInvoice,
      upiId: landlord.upiId,
    })
    .from(landlord)
    .innerJoin(user, eq(landlord.userId, user.id))
    .where(eq(landlord.id, landlordId))
    .limit(1);
  if (!row) return null;
  return {
    userId: row.userId,
    issuer: {
      businessName: row.businessName,
      email: row.email,
      phone: row.phone ?? "",
      gstin: row.gstin ?? "",
      pan: row.pan ?? "",
      address: row.address ?? "",
      city: row.city ?? "",
      state: row.state ?? "",
      pincode: row.pincode ?? "",
      showOutstandingOnInvoice: row.showOutstandingOnInvoice,
      upiId: row.upiId ?? "",
    },
  };
}

async function tenantSummary(tenantId: string) {
  const [row] = await db
    .select({
      name: tenant.name,
      propertyName: property.name,
      propertyAddress: property.address,
      propertyCity: property.city,
      propertyState: property.state,
      postalCode: property.postalCode,
      unitNumber: unit.unitNumber,
    })
    .from(tenant)
    .innerJoin(unit, eq(tenant.unitId, unit.id))
    .innerJoin(property, eq(unit.propertyId, property.id))
    .where(eq(tenant.id, tenantId))
    .limit(1);
  return row ?? null;
}

async function outstandingFor(userId: string, tenantId: string | null) {
  if (!tenantId) return 0;
  const analytics = await getTenantAnalytics(userId);
  return analytics.find((item) => item.tenantId === tenantId)?.totalPending ?? 0;
}

// Tenant phone and email are deliberately left off public pages: a link can be
// forwarded, and the tenant already knows their own contact details.
function publicTenant(row: NonNullable<Awaited<ReturnType<typeof tenantSummary>>>) {
  return { name: row.name, phone: "", email: "", propertyName: row.propertyName, unitNumber: row.unitNumber };
}

export async function getSharedDocument(
  kind: ShareKind,
  id: string,
  now = new Date(),
): Promise<SharedDocument | null> {
  if (kind === "rent") {
    const [row] = await db
      .select({ landlordId: rentBill.landlordId, tenantId: rentBill.tenantId, billingPeriod: rentBill.billingPeriod })
      .from(rentBill)
      .where(eq(rentBill.id, id))
      .limit(1);
    if (!row) return null;
    const owner = await issuerFor(row.landlordId);
    if (!owner) return null;
    const [billing, renter, outstanding] = await Promise.all([
      getRentBilling(owner.userId, now, financialYearStartFor(row.billingPeriod)),
      tenantSummary(row.tenantId),
      outstandingFor(owner.userId, row.tenantId),
    ]);
    const bill = billing.bills.find((item) => item.id === id);
    if (!bill) return null;
    return {
      kind: "bill",
      issuer: owner.issuer,
      document: { kind: "rent", bill, tenant: renter ? publicTenant(renter) : null, accountOutstanding: outstanding },
    };
  }

  if (kind === "electricity") {
    const [row] = await db
      .select({ landlordId: electricityBill.landlordId, tenantId: electricityBill.tenantId, billingPeriod: electricityBill.billingPeriod })
      .from(electricityBill)
      .where(eq(electricityBill.id, id))
      .limit(1);
    if (!row) return null;
    const owner = await issuerFor(row.landlordId);
    if (!owner) return null;
    const [bills, renter, outstanding] = await Promise.all([
      getElectricityBills(owner.userId, now, financialYearStartFor(row.billingPeriod.slice(0, 7))),
      row.tenantId ? tenantSummary(row.tenantId) : Promise.resolve(null),
      outstandingFor(owner.userId, row.tenantId),
    ]);
    const bill = bills.find((item) => item.id === id);
    if (!bill) return null;
    return {
      kind: "bill",
      issuer: owner.issuer,
      document: { kind: "electricity", bill, tenant: renter ? publicTenant(renter) : null, accountOutstanding: outstanding },
    };
  }

  const [receipt] = await db
    .select({
      landlordId: paymentReceipt.landlordId,
      tenantId: paymentReceipt.tenantId,
      receiptNumber: paymentReceipt.receiptNumber,
      amount: paymentReceipt.amount,
      paidAt: paymentReceipt.paidAt,
      method: paymentReceipt.method,
      reference: paymentReceipt.reference,
      allocationMode: paymentReceipt.allocationMode,
    })
    .from(paymentReceipt)
    .where(eq(paymentReceipt.id, id))
    .limit(1);
  if (!receipt) return null;
  const [owner, renter, allocations] = await Promise.all([
    issuerFor(receipt.landlordId),
    tenantSummary(receipt.tenantId),
    db
      .select({
        chargeType: paymentAllocation.chargeType,
        description: paymentAllocation.description,
        billReference: paymentAllocation.billReference,
        totalAmount: paymentAllocation.totalAmount,
      })
      .from(paymentAllocation)
      .where(eq(paymentAllocation.paymentReceiptId, id)),
  ]);
  if (!owner || !renter) return null;

  const methodLabels: Record<string, string> = {
    bank_transfer: "Bank transfer / UPI",
    cash: "Cash",
    check: "Cheque",
    card: "Card",
  };
  return {
    kind: "receipt",
    issuer: owner.issuer,
    receipt: {
      receiptNumber: receipt.receiptNumber,
      amount: Number(receipt.amount),
      paidAt: receipt.paidAt.toISOString().slice(0, 10),
      method: methodLabels[receipt.method] ?? receipt.method,
      reference: receipt.reference ?? "",
      tenantName: renter.name,
      propertyName: renter.propertyName,
      propertyAddress: [renter.propertyAddress, renter.propertyCity, renter.propertyState, renter.postalCode]
        .filter(Boolean)
        .join(", "),
      unitNumber: renter.unitNumber,
      lines: allocations.map((line) => {
        const base =
          line.chargeType === "rent"
            ? "Rent"
            : line.chargeType === "light_bill"
              ? "Electricity"
              : line.description || "Other charges";
        const label = line.billReference ? `${base} · ${line.billReference}` : base;
        return { label, amount: Number(line.totalAmount) };
      }),
    },
  };
}
