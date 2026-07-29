import "server-only";

import { and, asc, eq, gte, lt, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  electricityBill,
  landlord,
  paymentAllocation,
  paymentReceipt,
  property,
  tenant,
  unit,
} from "@/db/schema";
import { getCurrentFinancialYear } from "@/lib/financial-year";

export type ElectricityBillRecord = {
  id: string;
  unitId: string;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  billNumber: string;
  billingPeriod: string;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  unitRate: number;
  dueDate: string;
  amount: number;
  paid: number;
  pending: number;
  status: "Paid" | "Pending" | "Overdue";
  note: string;
};

const indiaDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function dateKey(value: Date) {
  const parts = Object.fromEntries(
    indiaDate.formatToParts(value).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export async function getElectricityBills(
  userId: string,
  now = new Date(),
): Promise<ElectricityBillRecord[]> {
  const financialYear = getCurrentFinancialYear(now);
  const [billRows, payments, priorBillTotals] = await Promise.all([
    db
      .select({
        id: electricityBill.id,
        unitId: electricityBill.unitId,
        tenantId: electricityBill.tenantId,
        tenantName: tenant.name,
        propertyName: property.name,
        unitNumber: unit.unitNumber,
        billNumber: electricityBill.billNumber,
        billingPeriod: electricityBill.billingPeriod,
        previousReading: electricityBill.previousReading,
        currentReading: electricityBill.currentReading,
        unitsConsumed: electricityBill.unitsConsumed,
        unitRate: electricityBill.unitRate,
        amount: electricityBill.amount,
        dueDate: electricityBill.dueDate,
        note: electricityBill.note,
        storedStatus: electricityBill.status,
      })
      .from(electricityBill)
      .innerJoin(landlord, eq(electricityBill.landlordId, landlord.id))
      .innerJoin(unit, eq(electricityBill.unitId, unit.id))
      .innerJoin(property, eq(unit.propertyId, property.id))
      .leftJoin(tenant, eq(electricityBill.tenantId, tenant.id))
      .where(
        and(
          eq(landlord.userId, userId),
          gte(electricityBill.billingPeriod, financialYear.startPeriod),
          lte(electricityBill.billingPeriod, financialYear.endPeriod),
        ),
      )
      .orderBy(asc(electricityBill.dueDate), asc(electricityBill.createdAt)),
    db
      .select({
        tenantId: paymentReceipt.tenantId,
        totalAmount: paymentAllocation.totalAmount,
      })
      .from(paymentAllocation)
      .innerJoin(paymentReceipt, eq(paymentAllocation.paymentReceiptId, paymentReceipt.id))
      .innerJoin(landlord, eq(paymentReceipt.landlordId, landlord.id))
      .where(
        and(
          eq(landlord.userId, userId),
          eq(paymentAllocation.chargeType, "light_bill"),
        ),
      ),
    db
      .select({
        tenantId: electricityBill.tenantId,
        amount: sql<string>`coalesce(sum(${electricityBill.amount}), 0)`,
      })
      .from(electricityBill)
      .innerJoin(landlord, eq(electricityBill.landlordId, landlord.id))
      .where(
        and(
          eq(landlord.userId, userId),
          lt(electricityBill.billingPeriod, financialYear.startPeriod),
        ),
      )
      .groupBy(electricityBill.tenantId),
  ]);

  const availableByTenant = new Map<string, number>();
  for (const payment of payments) {
    availableByTenant.set(
      payment.tenantId,
      (availableByTenant.get(payment.tenantId) ?? 0) + Number(payment.totalAmount),
    );
  }
  for (const item of priorBillTotals) {
    if (!item.tenantId) continue;
    const available = availableByTenant.get(item.tenantId) ?? 0;
    availableByTenant.set(
      item.tenantId,
      Math.max(0, available - Number(item.amount)),
    );
  }

  const today = dateKey(now);
  const statusUpdates: { id: string; status: "pending" | "paid" | "overdue" }[] = [];
  const bills = billRows.map((bill): ElectricityBillRecord => {
    const amount = Number(bill.amount);
    const available = bill.tenantId
      ? (availableByTenant.get(bill.tenantId) ?? 0)
      : 0;
    const paid = Math.min(amount, available);
    if (bill.tenantId) {
      availableByTenant.set(bill.tenantId, Math.max(0, available - paid));
    }
    const pending = Math.max(0, amount - paid);
    const status =
      pending <= 0.005
        ? "Paid"
        : dateKey(bill.dueDate) < today
          ? "Overdue"
          : "Pending";
    const storedStatus = status.toLowerCase() as "pending" | "paid" | "overdue";
    if (storedStatus !== bill.storedStatus) {
      statusUpdates.push({ id: bill.id, status: storedStatus });
    }

    return {
      id: bill.id,
      unitId: bill.unitId,
      tenantName: bill.tenantName ?? "No active tenant",
      propertyName: bill.propertyName,
      unitNumber: bill.unitNumber,
      billNumber: bill.billNumber,
      billingPeriod: bill.billingPeriod,
      previousReading: Number(bill.previousReading),
      currentReading: Number(bill.currentReading),
      unitsConsumed: Number(bill.unitsConsumed),
      unitRate: Number(bill.unitRate),
      dueDate: bill.dueDate.toISOString().slice(0, 10),
      amount,
      paid,
      pending,
      status,
      note: bill.note ?? "",
    };
  });

  await Promise.all(
    statusUpdates.map((item) =>
      db
        .update(electricityBill)
        .set({ status: item.status, updatedAt: now })
        .where(eq(electricityBill.id, item.id)),
    ),
  );

  return bills.reverse();
}
