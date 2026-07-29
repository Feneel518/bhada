import "server-only";

import { and, asc, eq, gte, lt, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  landlord,
  paymentAllocation,
  paymentReceipt,
  rentBill,
  tenant,
} from "@/db/schema";
import { getCurrentFinancialYear } from "@/lib/financial-year";

export type RentBillRecord = {
  id: string;
  tenantId: string;
  tenantName: string;
  billNumber: string;
  billingPeriod: string;
  dueDate: string;
  amount: number;
  paid: number;
  pending: number;
  status: "Paid" | "Pending" | "Overdue";
};

export type RentBillingSummary = {
  financialYearLabel: string;
  periodLabel: string;
  billedThisMonth: number;
  paidThisMonth: number;
  pendingThisMonth: number;
  openingBalancePending: number;
  pendingTotal: number;
  overdueTotal: number;
  overdueCount: number;
  collectionRate: number;
  bills: RentBillRecord[];
};

type DateParts = { year: number; month: number; day: number };

const indiaDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function dateParts(value: Date): DateParts {
  const parts = Object.fromEntries(
    indiaDate.formatToParts(value).map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

function period(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function dueDate(year: number, month: number, billingDay: number) {
  const day = Math.min(billingDay, daysInMonth(year, month));
  return new Date(
    `${period(year, month)}-${String(day).padStart(2, "0")}T00:00:00+05:30`,
  );
}

function nextMonth(value: { year: number; month: number }) {
  return value.month === 12
    ? { year: value.year + 1, month: 1 }
    : { year: value.year, month: value.month + 1 };
}

function isBeforeOrSameMonth(
  value: { year: number; month: number },
  other: { year: number; month: number },
) {
  return value.year < other.year || (value.year === other.year && value.month <= other.month);
}

function isBeforeDate(value: DateParts, other: DateParts) {
  return (
    value.year < other.year ||
    (value.year === other.year &&
      (value.month < other.month ||
        (value.month === other.month && value.day < other.day)))
  );
}

function asMoney(value: number) {
  return value.toFixed(2);
}

export async function ensureRentBills(userId: string, now = new Date()) {
  const current = dateParts(now);
  const activeTenants = await db
    .select({
      id: tenant.id,
      landlordId: tenant.landlordId,
      leaseStart: tenant.leaseStart,
      leaseEnd: tenant.leaseEnd,
      monthlyRent: tenant.monthlyRent,
      rentBillingDay: tenant.rentBillingDay,
    })
    .from(tenant)
    .innerJoin(landlord, eq(tenant.landlordId, landlord.id))
    .where(and(eq(landlord.userId, userId), eq(tenant.isActive, true)));

  const rows: (typeof rentBill.$inferInsert)[] = [];

  for (const renter of activeTenants) {
    if (!renter.monthlyRent || renter.monthlyRent <= 0) continue;

    const start = renter.leaseStart ? dateParts(renter.leaseStart) : current;
    const end = renter.leaseEnd ? dateParts(renter.leaseEnd) : null;
    let cursor = { year: start.year, month: start.month };
    let generated = 0;

    while (isBeforeOrSameMonth(cursor, current) && generated < 240) {
      const billDueDate = dueDate(cursor.year, cursor.month, renter.rentBillingDay);
      const due = dateParts(billDueDate);
      const startsAfterDue =
        renter.leaseStart &&
        (start.year > due.year ||
          (start.year === due.year &&
            (start.month > due.month || (start.month === due.month && start.day > due.day))));
      const endsBeforeDue =
        end &&
        (end.year < due.year ||
          (end.year === due.year &&
            (end.month < due.month || (end.month === due.month && end.day < due.day))));

      if (!startsAfterDue && !endsBeforeDue && billDueDate.getTime() <= now.getTime()) {
        const billingPeriod = period(cursor.year, cursor.month);
        rows.push({
          id: crypto.randomUUID(),
          landlordId: renter.landlordId,
          tenantId: renter.id,
          billNumber: `RENT-${renter.id.slice(0, 8).toUpperCase()}-${billingPeriod.replace("-", "")}`,
          billingPeriod,
          amount: asMoney(renter.monthlyRent),
          dueDate: billDueDate,
        });
      }

      cursor = nextMonth(cursor);
      generated += 1;
    }
  }

  if (rows.length) {
    await db
      .insert(rentBill)
      .values(rows)
      .onConflictDoNothing({ target: [rentBill.tenantId, rentBill.billingPeriod] });
  }
}

export async function getRentBilling(
  userId: string,
  now = new Date(),
): Promise<RentBillingSummary> {
  await ensureRentBills(userId, now);
  const financialYear = getCurrentFinancialYear(now);

  const [billRows, rentPayments, openingBalances, priorBillTotals] = await Promise.all([
    db
      .select({
        id: rentBill.id,
        tenantId: rentBill.tenantId,
        tenantName: tenant.name,
        billNumber: rentBill.billNumber,
        billingPeriod: rentBill.billingPeriod,
        amount: rentBill.amount,
        dueDate: rentBill.dueDate,
        storedStatus: rentBill.status,
      })
      .from(rentBill)
      .innerJoin(landlord, eq(rentBill.landlordId, landlord.id))
      .innerJoin(tenant, eq(rentBill.tenantId, tenant.id))
      .where(
        and(
          eq(landlord.userId, userId),
          gte(rentBill.billingPeriod, financialYear.startPeriod),
          lte(rentBill.billingPeriod, financialYear.endPeriod),
        ),
      )
      .orderBy(asc(rentBill.dueDate), asc(rentBill.createdAt)),
    db
      .select({
        tenantId: paymentReceipt.tenantId,
        totalAmount: paymentAllocation.totalAmount,
      })
      .from(paymentAllocation)
      .innerJoin(paymentReceipt, eq(paymentAllocation.paymentReceiptId, paymentReceipt.id))
      .innerJoin(landlord, eq(paymentReceipt.landlordId, landlord.id))
      .where(
        and(eq(landlord.userId, userId), eq(paymentAllocation.chargeType, "rent")),
      ),
    db
      .select({
        tenantId: tenant.id,
        openingBalance: tenant.openingBalance,
      })
      .from(tenant)
      .innerJoin(landlord, eq(tenant.landlordId, landlord.id))
      .where(eq(landlord.userId, userId)),
    db
      .select({
        tenantId: rentBill.tenantId,
        amount: sql<string>`coalesce(sum(${rentBill.amount}), 0)`,
      })
      .from(rentBill)
      .innerJoin(landlord, eq(rentBill.landlordId, landlord.id))
      .where(
        and(
          eq(landlord.userId, userId),
          lt(rentBill.billingPeriod, financialYear.startPeriod),
        ),
      )
      .groupBy(rentBill.tenantId),
  ]);

  const availableByTenant = new Map<string, number>();
  for (const item of rentPayments) {
    availableByTenant.set(
      item.tenantId,
      (availableByTenant.get(item.tenantId) ?? 0) + Number(item.totalAmount),
    );
  }

  let openingBalancePending = 0;
  let openingBalanceCount = 0;
  for (const item of openingBalances) {
    const openingBalance = Math.max(0, item.openingBalance);
    const available = availableByTenant.get(item.tenantId) ?? 0;
    const openingPaid = Math.min(openingBalance, available);
    const pending = Math.max(0, openingBalance - openingPaid);
    availableByTenant.set(item.tenantId, Math.max(0, available - openingPaid));
    openingBalancePending += pending;
    if (pending > 0.005) openingBalanceCount += 1;
  }

  let priorBillsPending = 0;
  let priorBalanceCount = 0;
  for (const item of priorBillTotals) {
    const amount = Number(item.amount);
    const available = availableByTenant.get(item.tenantId) ?? 0;
    const paid = Math.min(amount, available);
    const pending = Math.max(0, amount - paid);
    availableByTenant.set(item.tenantId, Math.max(0, available - paid));
    priorBillsPending += pending;
    if (pending > 0.005) priorBalanceCount += 1;
  }

  const today = dateParts(now);
  const currentPeriod = period(today.year, today.month);
  const statusUpdates: { id: string; status: "pending" | "paid" | "overdue" }[] = [];
  const bills = billRows.map((bill): RentBillRecord => {
    const amount = Number(bill.amount);
    const available = availableByTenant.get(bill.tenantId) ?? 0;
    const paid = Math.min(amount, available);
    availableByTenant.set(bill.tenantId, Math.max(0, available - paid));
    const pending = Math.max(0, amount - paid);
    const status =
      pending <= 0.005
        ? "Paid"
        : isBeforeDate(dateParts(bill.dueDate), today)
          ? "Overdue"
          : "Pending";
    const storedStatus = status.toLowerCase() as "pending" | "paid" | "overdue";
    if (bill.storedStatus !== storedStatus) {
      statusUpdates.push({ id: bill.id, status: storedStatus });
    }

    return {
      id: bill.id,
      tenantId: bill.tenantId,
      tenantName: bill.tenantName,
      billNumber: bill.billNumber,
      billingPeriod: bill.billingPeriod,
      dueDate: bill.dueDate.toISOString().slice(0, 10),
      amount,
      paid,
      pending,
      status,
    };
  });

  await Promise.all(
    statusUpdates.map((item) =>
      db
        .update(rentBill)
        .set({ status: item.status, updatedAt: now })
        .where(eq(rentBill.id, item.id)),
    ),
  );

  const currentBills = bills.filter((bill) => bill.billingPeriod === currentPeriod);
  const billedThisMonth = currentBills.reduce((sum, bill) => sum + bill.amount, 0);
  const pendingThisMonth = currentBills.reduce((sum, bill) => sum + bill.pending, 0);
  const pendingTotal =
    openingBalancePending + priorBillsPending + bills.reduce((sum, bill) => sum + bill.pending, 0);
  const overdueBills = bills.filter((bill) => bill.status === "Overdue");

  return {
    financialYearLabel: financialYear.label,
    periodLabel: new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      month: "long",
      year: "numeric",
    }).format(now),
    billedThisMonth,
    paidThisMonth: Math.max(0, billedThisMonth - pendingThisMonth),
    pendingThisMonth,
    openingBalancePending,
    pendingTotal,
    overdueTotal:
      openingBalancePending + priorBillsPending + overdueBills.reduce((sum, bill) => sum + bill.pending, 0),
    overdueCount: openingBalanceCount + priorBalanceCount + overdueBills.length,
    collectionRate:
      billedThisMonth > 0
        ? Math.round(((billedThisMonth - pendingThisMonth) / billedThisMonth) * 1000) / 10
        : 0,
    bills: bills.reverse(),
  };
}
