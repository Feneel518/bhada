export type FinancialYear = {
  startYear: number;
  startPeriod: string;
  endPeriod: string;
  label: string;
};

export type FinancialYearOption = {
  value: number;
  label: string;
};

export function getFinancialYear(startYear: number): FinancialYear {
  return {
    startYear,
    startPeriod: `${startYear}-04`,
    endPeriod: `${startYear + 1}-03`,
    label: `FY ${startYear}-${String(startYear + 1).slice(-2)}`,
  };
}

export function getCurrentFinancialYear(now = new Date()): FinancialYear {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  const year = Number(parts.year);
  const month = Number(parts.month);
  const startYear = month >= 4 ? year : year - 1;

  return getFinancialYear(startYear);
}

export function resolveFinancialYearStart(value: string | undefined, now = new Date()) {
  const current = getCurrentFinancialYear(now).startYear;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 2000 && parsed <= current
    ? parsed
    : current;
}

export function formatBillingMonth(billingPeriod: string) {
  const [year, month] = billingPeriod.split("-").map(Number);
  if (!year || !month) return billingPeriod;
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 15)));
}

export function formatElectricityReadingDate(billingPeriod: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(billingPeriod);
  if (!match) return formatBillingMonth(billingPeriod);

  const [, year, month, day] = match;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(`${year}-${month}-${day}T12:00:00+05:30`));
}
