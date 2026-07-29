import "server-only";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { electricityBill, landlord, rentBill } from "@/db/schema";
import {
  getCurrentFinancialYear,
  getFinancialYear,
  type FinancialYearOption,
} from "@/lib/financial-year";

function periodStartYear(period: string) {
  const [year, month] = period.split("-").map(Number);
  return month >= 4 ? year : year - 1;
}

export async function getAvailableFinancialYears(
  userId: string,
  selectedStartYear?: number,
  now = new Date(),
): Promise<FinancialYearOption[]> {
  const [[oldestRent], [oldestElectricity]] = await Promise.all([
    db
      .select({ period: sql<string | null>`min(${rentBill.billingPeriod})` })
      .from(rentBill)
      .innerJoin(landlord, eq(rentBill.landlordId, landlord.id))
      .where(eq(landlord.userId, userId)),
    db
      .select({ period: sql<string | null>`min(${electricityBill.billingPeriod})` })
      .from(electricityBill)
      .innerJoin(landlord, eq(electricityBill.landlordId, landlord.id))
      .where(eq(landlord.userId, userId)),
  ]);

  const currentStartYear = getCurrentFinancialYear(now).startYear;
  const storedStartYears = [oldestRent.period, oldestElectricity.period]
    .filter((period): period is string => Boolean(period))
    .map(periodStartYear);
  const earliestStartYear = Math.min(
    currentStartYear,
    selectedStartYear ?? currentStartYear,
    ...storedStartYears,
  );

  return Array.from(
    { length: currentStartYear - earliestStartYear + 1 },
    (_, index) => {
      const startYear = currentStartYear - index;
      return { value: startYear, label: getFinancialYear(startYear).label };
    },
  );
}
