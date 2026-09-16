import assert from "node:assert/strict";
import test from "node:test";
import { getRentMonthMetrics } from "../src/lib/rent-month-metrics.ts";
import { filterIncomePeriod } from "../src/lib/income-period.ts";

test("rent in arrears is counted in its collection month, including April", () => {
  const bills = [
    { billingPeriod: "2026-03", dueDate: "2026-04-05", amount: 10000, pending: 4000 },
    { billingPeriod: "2026-04", dueDate: "2026-05-05", amount: 10000, pending: 10000 },
    { billingPeriod: "2026-02", dueDate: "2026-03-05", amount: 10000, pending: 2000 },
  ];
  assert.deepEqual(getRentMonthMetrics(bills, "2026-04"), {
    billedThisMonth: 10000, paidThisMonth: 6000, pendingThisMonth: 4000, collectionRate: 60,
  });
});

test("current-period rent and partial payments combine correctly", () => {
  assert.deepEqual(getRentMonthMetrics([
    { dueDate: "2026-09-01", amount: 12000, pending: 0 },
    { dueDate: "2026-09-15", amount: 8000, pending: 3000 },
  ], "2026-09"), { billedThisMonth: 20000, paidThisMonth: 17000, pendingThisMonth: 3000, collectionRate: 85 });
});

test("an empty portfolio shows finite zero metrics", () => {
  assert.deepEqual(getRentMonthMetrics([], "2026-09"), {
    billedThisMonth: 0, paidThisMonth: 0, pendingThisMonth: 0, collectionRate: 0,
  });
});

const points = ["2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"].map((period) => ({ period, value: 100 }));
test("This year excludes the previous year's months", () => {
  assert.equal(filterIncomePeriod(points, "This year").length, 9);
  assert.equal(filterIncomePeriod(points, "This year")[0].period, "2026-01");
});
test("This quarter starts at the calendar quarter boundary", () => {
  assert.deepEqual(filterIncomePeriod(points.slice(0, -1), "This quarter").map((item) => item.period), ["2026-07", "2026-08"]);
  assert.deepEqual(filterIncomePeriod(points.slice(0, 4), "This quarter").map((item) => item.period), ["2026-01"]);
});
test("Last 6 months is a rolling range", () => {
  assert.deepEqual(filterIncomePeriod(points, "Last 6 months").map((item) => item.period), ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"]);
  assert.deepEqual(filterIncomePeriod([], "This year"), []);
});
