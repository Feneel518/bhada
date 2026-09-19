import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  electricityBill,
  landlord,
  paymentReceipt,
  rentBill,
  tenant,
} from "@/db/schema";
import { formatBillingMonth, formatElectricityReadingDate } from "@/lib/financial-year";

export type TenantLedgerEntry = {
  id: string;
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
};

export type TenantLedgerRecord = {
  tenantId: string;
  openingBalance: number;
  totalDebits: number;
  totalCredits: number;
  closingBalance: number;
  entries: TenantLedgerEntry[];
};

type PendingEntry = Omit<TenantLedgerEntry, "balance"> & { order: number };

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

export async function getTenantLedgers(
  userId: string,
  financialYearStart: number,
): Promise<TenantLedgerRecord[]> {
  const startDate = `${financialYearStart}-04-01`;
  const endDate = `${financialYearStart + 1}-03-31`;
  const [tenantRows, rentRows, electricityRows, receiptRows] = await Promise.all([
    db
      .select({ id: tenant.id, openingBalance: tenant.openingBalance })
      .from(tenant)
      .innerJoin(landlord, eq(tenant.landlordId, landlord.id))
      .where(eq(landlord.userId, userId)),
    db
      .select({
        id: rentBill.id,
        tenantId: rentBill.tenantId,
        billNumber: rentBill.billNumber,
        billingPeriod: rentBill.billingPeriod,
        amount: rentBill.amount,
        createdAt: rentBill.createdAt,
      })
      .from(rentBill)
      .innerJoin(landlord, eq(rentBill.landlordId, landlord.id))
      .where(eq(landlord.userId, userId)),
    db
      .select({
        id: electricityBill.id,
        tenantId: electricityBill.tenantId,
        billNumber: electricityBill.billNumber,
        billingPeriod: electricityBill.billingPeriod,
        amount: electricityBill.amount,
        createdAt: electricityBill.createdAt,
      })
      .from(electricityBill)
      .innerJoin(landlord, eq(electricityBill.landlordId, landlord.id))
      .where(eq(landlord.userId, userId)),
    db
      .select({
        id: paymentReceipt.id,
        tenantId: paymentReceipt.tenantId,
        receiptNumber: paymentReceipt.receiptNumber,
        amount: paymentReceipt.amount,
        paidAt: paymentReceipt.paidAt,
      })
      .from(paymentReceipt)
      .innerJoin(landlord, eq(paymentReceipt.landlordId, landlord.id))
      .where(eq(landlord.userId, userId)),
  ]);

  const entriesByTenant = new Map<string, PendingEntry[]>();
  const addEntry = (tenantId: string, entry: PendingEntry) => {
    entriesByTenant.set(tenantId, [...(entriesByTenant.get(tenantId) ?? []), entry]);
  };

  for (const bill of rentRows) {
    addEntry(bill.tenantId, {
      id: `rent-${bill.id}`,
      date: dateKey(bill.createdAt),
      description: `Rent — ${formatBillingMonth(bill.billingPeriod)}`,
      reference: bill.billNumber,
      debit: Number(bill.amount),
      credit: 0,
      order: 0,
    });
  }
  for (const bill of electricityRows) {
    if (!bill.tenantId) continue;
    addEntry(bill.tenantId, {
      id: `electricity-${bill.id}`,
      date: dateKey(bill.createdAt),
      description: `Electricity — ${formatElectricityReadingDate(bill.billingPeriod)}`,
      reference: bill.billNumber,
      debit: Number(bill.amount),
      credit: 0,
      order: 1,
    });
  }
  for (const receipt of receiptRows) {
    addEntry(receipt.tenantId, {
      id: `payment-${receipt.id}`,
      date: dateKey(receipt.paidAt),
      description: "Payment received",
      reference: receipt.receiptNumber,
      debit: 0,
      credit: Number(receipt.amount),
      order: 2,
    });
  }

  return tenantRows.map((renter) => {
    const allEntries = (entriesByTenant.get(renter.id) ?? []).sort(
      (a, b) => a.date.localeCompare(b.date) || a.order - b.order || a.id.localeCompare(b.id),
    );
    let runningBalance = Math.max(0, renter.openingBalance);
    for (const entry of allEntries) {
      if (entry.date >= startDate) break;
      runningBalance += entry.debit - entry.credit;
    }

    const openingBalance = runningBalance;
    let totalDebits = 0;
    let totalCredits = 0;
    const entries: TenantLedgerEntry[] = [];
    for (const entry of allEntries) {
      if (entry.date < startDate || entry.date > endDate) continue;
      totalDebits += entry.debit;
      totalCredits += entry.credit;
      runningBalance += entry.debit - entry.credit;
      entries.push({
        id: entry.id,
        date: entry.date,
        description: entry.description,
        reference: entry.reference,
        debit: entry.debit,
        credit: entry.credit,
        balance: runningBalance,
      });
    }

    return {
      tenantId: renter.id,
      openingBalance,
      totalDebits,
      totalCredits,
      closingBalance: openingBalance + totalDebits - totalCredits,
      entries,
    };
  });
}
