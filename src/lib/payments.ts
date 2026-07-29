import "server-only";

import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  landlord,
  paymentAllocation,
  paymentReceipt,
  property,
  tenant,
  unit,
} from "@/db/schema";

export type PaymentRecord = {
  id: string;
  receiptNumber: string;
  tenant: string;
  tenantId: string;
  property: string;
  amount: number;
  date: string;
  paidAt: string;
  status: "Paid";
  method: string;
  allocationMode: "lump_sum" | "bill_wise";
  summary: string;
  initials: string;
  color: string;
};

const colors = ["#e7e3fb", "#dcefeb", "#f9e6d1", "#f6dfe6", "#e1e8f5"];

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function colorFor(id: string) {
  const value = Array.from(id).reduce((total, character) => total + character.charCodeAt(0), 0);
  return colors[value % colors.length];
}

export async function getPayments(userId: string): Promise<PaymentRecord[]> {
  const receipts = await db
    .select({
      id: paymentReceipt.id,
      receiptNumber: paymentReceipt.receiptNumber,
      tenantId: tenant.id,
      tenantName: tenant.name,
      propertyName: property.name,
      unitNumber: unit.unitNumber,
      amount: paymentReceipt.amount,
      paidAt: paymentReceipt.paidAt,
      method: paymentReceipt.method,
      allocationMode: paymentReceipt.allocationMode,
    })
    .from(paymentReceipt)
    .innerJoin(landlord, eq(paymentReceipt.landlordId, landlord.id))
    .innerJoin(tenant, eq(paymentReceipt.tenantId, tenant.id))
    .innerJoin(unit, eq(tenant.unitId, unit.id))
    .innerJoin(property, eq(unit.propertyId, property.id))
    .where(eq(landlord.userId, userId))
    .orderBy(desc(paymentReceipt.paidAt), desc(paymentReceipt.createdAt));

  if (!receipts.length) return [];

  const allocations = await db
    .select({
      receiptId: paymentAllocation.paymentReceiptId,
      chargeType: paymentAllocation.chargeType,
      description: paymentAllocation.description,
    })
    .from(paymentAllocation)
    .where(inArray(paymentAllocation.paymentReceiptId, receipts.map((item) => item.id)));

  const summaries = new Map<string, string[]>();
  for (const allocation of allocations) {
    const label =
      allocation.chargeType === "rent"
        ? "Rent"
        : allocation.chargeType === "light_bill"
          ? "Light bill"
          : allocation.description || "Other";
    summaries.set(allocation.receiptId, [...(summaries.get(allocation.receiptId) ?? []), label]);
  }

  return receipts.map((receipt) => ({
    id: receipt.id,
    receiptNumber: receipt.receiptNumber,
    tenant: receipt.tenantName,
    tenantId: receipt.tenantId,
    property: `${receipt.propertyName} · Unit ${receipt.unitNumber}`,
    amount: Number(receipt.amount),
    date: new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(receipt.paidAt),
    paidAt: receipt.paidAt.toISOString().slice(0, 10),
    status: "Paid",
    method: receipt.method,
    allocationMode: receipt.allocationMode,
    summary:
      receipt.allocationMode === "lump_sum"
        ? "Lump sum"
        : [...new Set(summaries.get(receipt.id) ?? [])].join(", "),
    initials: initials(receipt.tenantName),
    color: colorFor(receipt.tenantId),
  }));
}
