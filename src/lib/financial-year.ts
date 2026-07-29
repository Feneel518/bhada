export type FinancialYear = {
  startPeriod: string;
  endPeriod: string;
  label: string;
};

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

  return {
    startPeriod: `${startYear}-04`,
    endPeriod: `${startYear + 1}-03`,
    label: `FY ${startYear}-${String(startYear + 1).slice(-2)}`,
  };
}

export function formatBillingMonth(billingPeriod: string) {
  const [year, month] = billingPeriod.split("-").map(Number);
  if (!year || !month) return billingPeriod;
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 15)));
}
