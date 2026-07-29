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
import { getCurrentFinancialYear, getFinancialYear } from "@/lib/financial-year";

export type RentBillRecord = {
  id: string;
  tenantId: string;
  tenantName: string;
  billNumber: string;
  billingPeriod: string;
  dueDate: string;
  baseAmount: number;
  gstRate: number;
  gstAmount: number;
  tdsRate: number;
  tdsAmount: number;
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
export type RentBillingPeriod = "previous" | "current";

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

function previousMonth(value: { year: number; month: number }) {
  return value.month === 1
    ? { year: value.year - 1, month: 12 }
    : { year: value.year, month: value.month - 1 };
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

function isAfterMonth(value: DateParts, month: { year: number; month: number }) {
  return value.year > month.year || (value.year === month.year && value.month > month.month);
}

function isBeforeMonth(value: DateParts, month: { year: number; month: number }) {
  return value.year < month.year || (value.year === month.year && value.month < month.month);
}

export async function generateMonthlyRentBills(now = new Date(), userId?: string) {
  const current = dateParts(now);
  const tenantConditions = [eq(tenant.isActive, true)];
  if (userId) tenantConditions.push(eq(landlord.userId, userId));

  const activeTenants = await db
    .select({
      id: tenant.id,
      landlordId: tenant.landlordId,
      leaseStart: tenant.leaseStart,
      leaseEnd: tenant.leaseEnd,
      monthlyRent: tenant.monthlyRent,
      rentBillingDay: tenant.rentBillingDay,
      rentDueDay: tenant.rentDueDay,
      gstEnabled: tenant.gstEnabled,
      gstRate: tenant.gstRate,
      tdsEnabled: tenant.tdsEnabled,
      tdsRate: tenant.tdsRate,
      createdAt: tenant.createdAt,
      rentBillingPeriod: landlord.rentBillingPeriod,
    })
    .from(tenant)
    .innerJoin(landlord, eq(tenant.landlordId, landlord.id))
    .where(and(...tenantConditions));

  const rows: (typeof rentBill.$inferInsert)[] = [];

  for (const renter of activeTenants) {
    if (!renter.monthlyRent || renter.monthlyRent <= 0) continue;

    const effectiveBillingDay = Math.min(
      renter.rentBillingDay,
      daysInMonth(current.year, current.month),
    );
    // Running daily with a "<" check lets a later run safely catch up after an outage.
    if (current.day < effectiveBillingDay) continue;

    const created = dateParts(renter.createdAt);
    if (!isBeforeMonth(created, current)) continue;

    const billingPreference: RentBillingPeriod =
      renter.rentBillingPeriod === "current" ? "current" : "previous";
    const billingMonth =
      billingPreference === "previous" ? previousMonth(current) : current;
    const start = renter.leaseStart ? dateParts(renter.leaseStart) : null;
    const end = renter.leaseEnd ? dateParts(renter.leaseEnd) : null;
    if ((start && isAfterMonth(start, billingMonth)) || (end && isBeforeMonth(end, billingMonth))) {
      continue;
    }

    const billingPeriod = period(billingMonth.year, billingMonth.month);
    const dueMonth = billingPreference === "previous" ? current : billingMonth;
    const billDueDate = dueDate(
      dueMonth.year,
      dueMonth.month,
      Math.max(renter.rentBillingDay, renter.rentDueDay),
    );
    const basePaise = Math.round(renter.monthlyRent * 100);
    const gstRate = renter.gstEnabled ? renter.gstRate : 0;
    const tdsRate = renter.tdsEnabled ? renter.tdsRate : 0;
    const gstPaise = Math.round((basePaise * gstRate) / 100);
    const tdsPaise = Math.round(((basePaise + gstPaise) * tdsRate) / 100);
    rows.push({
      id: crypto.randomUUID(),
      landlordId: renter.landlordId,
      tenantId: renter.id,
      billNumber: `RENT-${renter.id.slice(0, 8).toUpperCase()}-${billingPeriod.replace("-", "")}`,
      billingPeriod,
      baseAmount: asMoney(basePaise / 100),
      gstRate: gstRate.toFixed(2),
      gstAmount: asMoney(gstPaise / 100),
      tdsRate: tdsRate.toFixed(2),
      tdsAmount: asMoney(tdsPaise / 100),
      amount: asMoney((basePaise + gstPaise - tdsPaise) / 100),
      dueDate: billDueDate,
    });
  }

  if (!rows.length) return 0;

  const inserted = await db
      .insert(rentBill)
      .values(rows)
      .onConflictDoNothing({ target: [rentBill.tenantId, rentBill.billingPeriod] })
      .returning({ id: rentBill.id });

  return inserted.length;
}

export async function getRentBilling(
  userId: string,
  now = new Date(),
  financialYearStart?: number,
): Promise<RentBillingSummary> {
  await generateMonthlyRentBills(now, userId);
  const financialYear = financialYearStart === undefined
    ? getCurrentFinancialYear(now)
    : getFinancialYear(financialYearStart);

  const [billRows, rentPayments, openingBalances, priorBillTotals] = await Promise.all([
    db
      .select({
        id: rentBill.id,
        tenantId: rentBill.tenantId,
        tenantName: tenant.name,
        billNumber: rentBill.billNumber,
        billingPeriod: rentBill.billingPeriod,
        baseAmount: rentBill.baseAmount,
        gstRate: rentBill.gstRate,
        gstAmount: rentBill.gstAmount,
        tdsRate: rentBill.tdsRate,
        tdsAmount: rentBill.tdsAmount,
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
      dueDate: (() => {
        const due = dateParts(bill.dueDate);
        return `${period(due.year, due.month)}-${String(due.day).padStart(2, "0")}`;
      })(),
      baseAmount: Number(bill.baseAmount),
      gstRate: Number(bill.gstRate),
      gstAmount: Number(bill.gstAmount),
      tdsRate: Number(bill.tdsRate),
      tdsAmount: Number(bill.tdsAmount),
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
