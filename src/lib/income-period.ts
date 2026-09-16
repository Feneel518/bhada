export function filterIncomePeriod<T extends { period: string }>(data: T[], range: string): T[] {
  const latest = data.at(-1)?.period;
  if (!latest) return [];
  if (range === "Last 6 months") return data.slice(-6);
  const [year, month] = latest.split("-").map(Number);
  const firstMonth = range === "This quarter" ? Math.floor((month - 1) / 3) * 3 + 1 : 1;
  const firstPeriod = `${year}-${String(firstMonth).padStart(2, "0")}`;
  return data.filter((point) => point.period >= firstPeriod && point.period <= latest);
}
