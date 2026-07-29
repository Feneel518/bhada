import "server-only";

import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import {
  landlord,
  paymentAllocation,
  paymentReceipt,
} from "@/db/schema";

export type IncomeOverviewPoint = {
  period: string;
  label: string;
  description: string;
  value: number;
};

const indiaMonth = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
});

function monthParts(value: Date) {
  const parts = Object.fromEntries(
    indiaMonth.formatToParts(value).map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
  };
}

function monthSequence(now: Date, count: number) {
  const current = monthParts(now);

  return Array.from({ length: count }, (_, index) => {
    const month = new Date(
      Date.UTC(current.year, current.month - count + index, 15),
    );
    const year = month.getUTCFullYear();
    const monthNumber = month.getUTCMonth() + 1;
    const period = `${year}-${String(monthNumber).padStart(2, "0")}`;

    return {
      period,
      label: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(month),
      description: new Intl.DateTimeFormat("en-IN", {
        month: "long",
        year: "numeric",
      }).format(month),
    };
  });
}

export async function getIncomeOverview(
  userId: string,
  now = new Date(),
): Promise<IncomeOverviewPoint[]> {
  const months = monthSequence(now, 12);
  const firstPeriod = months[0].period;
  const rows = await db
    .select({
      paidAt: paymentReceipt.paidAt,
      amount: paymentAllocation.totalAmount,
    })
    .from(paymentAllocation)
    .innerJoin(
      paymentReceipt,
      eq(paymentAllocation.paymentReceiptId, paymentReceipt.id),
    )
    .innerJoin(landlord, eq(paymentReceipt.landlordId, landlord.id))
    .where(
      and(
        eq(landlord.userId, userId),
        eq(paymentAllocation.chargeType, "rent"),
        gte(
          paymentReceipt.paidAt,
          new Date(`${firstPeriod}-01T00:00:00+05:30`),
        ),
      ),
    );

  const totals = new Map<string, number>();
  for (const row of rows) {
    const parts = monthParts(row.paidAt);
    const period = `${parts.year}-${String(parts.month).padStart(2, "0")}`;
    totals.set(period, (totals.get(period) ?? 0) + Number(row.amount));
  }

  return months.map((month) => ({
    ...month,
    value: Math.round((totals.get(month.period) ?? 0) * 100) / 100,
  }));
}
