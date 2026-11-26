"use client";

import { useState } from "react";
import { Eye, Search } from "lucide-react";
import type { RentBillingSummary } from "@/lib/rent-billing";
import type { ElectricityBillRecord } from "@/lib/electricity-billing";
import { formatBillingMonth, formatElectricityReadingDate } from "@/lib/financial-year";
import { cn, formatCurrency } from "@/lib/utils";
import { formatMeterReading, statusStyles } from "@/components/workspace/shared";

export function RentBillTable({
  bills,
  financialYearLabel,
  onViewBill,
}: {
  bills: RentBillingSummary["bills"];
  financialYearLabel: string;
  onViewBill: (bill: RentBillingSummary["bills"][number]) => void;
}) {
  const [billSearch, setBillSearch] = useState("");
  const visibleBills = bills.filter((bill) =>
    bill.billNumber.toLowerCase().includes(billSearch.trim().toLowerCase()),
  );

  return (
    <section className="overflow-hidden rounded-[20px] border border-[#e7e9ef] bg-white shadow-[0_1px_2px_rgba(25,29,41,.02)]">
      <div className="flex flex-col gap-4 p-5 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="font-display text-base font-bold tracking-[-0.025em]">Rent bills · {financialYearLabel}</h2>
          <p className="mt-1 text-xs text-[#8b91a0]">Selected financial year (April–March)</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9aa0af]" />
          <input
            className="h-9 w-full rounded-lg border border-[#e3e5ec] bg-[#fafafd] pl-9 pr-3 text-xs outline-none focus:border-[#aaaaf0]"
            value={billSearch}
            onChange={(event) => setBillSearch(event.target.value)}
            placeholder="Search bill number"
          />
        </div>
      </div>
      <div className="divide-y divide-white/[0.075] border-t border-white/10 sm:hidden">
        {visibleBills.length ? visibleBills.map((bill) => (
          <article key={bill.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#343a48]">{bill.billNumber}</p>
                <p className="mt-1 truncate text-[11px] text-[#7e8595]">
                  {bill.tenantName} · {formatBillingMonth(bill.billingPeriod)}
                </p>
              </div>
              <span className={cn(
                "inline-flex shrink-0 px-2.5 py-1 text-[10px] font-bold",
                bill.status === "Paid"
                  ? statusStyles.Paid
                  : bill.status === "Overdue"
                    ? statusStyles.Overdue
                    : statusStyles.Upcoming,
              )}>
                {bill.status}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-y border-white/[0.075] py-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/30">Payable</p>
                <p className="mt-1 text-sm font-bold text-[#343a48]">{formatCurrency(bill.amount)}</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/30">Pending</p>
                <p className="mt-1 text-sm font-bold text-[#b66a45]">{formatCurrency(bill.pending)}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11px] text-[#7e8595]">Due {bill.dueDate}</p>
              <button
                onClick={() => onViewBill(bill)}
                className="inline-flex h-9 items-center gap-1.5 border border-[#dfe2e9] px-3 text-[11px] font-bold text-[#5555c7]"
              >
                <Eye className="size-3.5" /> View bill
              </button>
            </div>
          </article>
        )) : (
          <p className="px-5 py-10 text-center text-sm text-[#8b91a0]">
            {billSearch ? "No rent bill matches that bill number." : `No rent bills in ${financialYearLabel}.`}
          </p>
        )}
      </div>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[460px] text-left md:min-w-[720px]">
          <thead>
            <tr className="border-y border-[#eef0f4] bg-[#fafafd] text-[10px] uppercase tracking-[0.08em] text-[#989eac]">
              <th className="px-6 py-3 font-bold">Bill</th>
              <th className="px-4 py-3 font-bold">Bill month</th>
              <th className="hidden px-4 py-3 font-bold lg:table-cell">Tenant</th>
              <th className="hidden px-4 py-3 font-bold md:table-cell">Payable</th>
              <th className="px-4 py-3 font-bold">Pending</th>
              <th className="hidden px-4 py-3 font-bold md:table-cell">Due date</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold">Copy</th>
            </tr>
          </thead>
          <tbody>
            {visibleBills.length ? visibleBills.map((bill) => (
              <tr key={bill.id} className="border-b border-[#f0f1f4] last:border-0 hover:bg-[#fcfcfe]">
                <td className="px-6 py-3.5">
                  <p className="text-xs font-bold text-[#343a48]">{bill.billNumber}</p>
                </td>
                <td className="px-4 py-3.5 text-xs text-[#5f6676]">{formatBillingMonth(bill.billingPeriod)}</td>
                <td className="hidden px-4 py-3.5 text-xs text-[#5f6676] lg:table-cell">{bill.tenantName}</td>
                <td className="hidden px-4 py-3.5 md:table-cell">
                  <p className="text-xs font-bold text-[#343a48]">{formatCurrency(bill.amount)}</p>
                  {(bill.gstAmount > 0 || bill.tdsAmount > 0) && (
                    <p className="mt-1 text-[10px] font-medium text-[#8b91a0]">
                      {formatCurrency(bill.baseAmount)}
                      {bill.gstAmount > 0 ? ` + ${formatCurrency(bill.gstAmount)} GST` : ""}
                      {bill.tdsAmount > 0 ? ` - ${formatCurrency(bill.tdsAmount)} TDS` : ""}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3.5 text-xs font-bold text-[#b66a45]">{formatCurrency(bill.pending)}</td>
                <td className="hidden px-4 py-3.5 text-xs text-[#7e8595] md:table-cell">{bill.dueDate}</td>
                <td className="px-4 py-3.5">
                  <span className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold",
                    bill.status === "Paid"
                      ? statusStyles.Paid
                      : bill.status === "Overdue"
                        ? statusStyles.Overdue
                        : statusStyles.Upcoming,
                  )}>
                    {bill.status}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <button
                    onClick={() => onViewBill(bill)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#dfe2e9] px-2.5 py-1.5 text-[10px] font-bold text-[#5555c7] hover:bg-[#efeffd]"
                  >
                    <Eye className="size-3.5" /> View
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-[#8b91a0]">
                  {billSearch ? "No rent bill matches that bill number." : `No rent bills in ${financialYearLabel}.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ElectricityBillTable({
  bills,
  financialYearLabel,
  onViewBill,
}: {
  bills: ElectricityBillRecord[];
  financialYearLabel: string;
  onViewBill: (bill: ElectricityBillRecord) => void;
}) {
  const [billSearch, setBillSearch] = useState("");
  const visibleBills = bills.filter((bill) =>
    bill.billNumber.toLowerCase().includes(billSearch.trim().toLowerCase()),
  );

  return (
    <section className="overflow-hidden rounded-[20px] border border-[#e7e9ef] bg-white shadow-[0_1px_2px_rgba(25,29,41,.02)]">
      <div className="flex flex-col gap-4 p-5 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="font-display text-base font-bold tracking-[-0.025em]">Electricity bills · {financialYearLabel}</h2>
          <p className="mt-1 text-xs text-[#8b91a0]">Selected financial year (April–March)</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9aa0af]" />
          <input
            className="h-9 w-full rounded-lg border border-[#e3e5ec] bg-[#fafafd] pl-9 pr-3 text-xs outline-none focus:border-[#aaaaf0]"
            value={billSearch}
            onChange={(event) => setBillSearch(event.target.value)}
            placeholder="Search bill number"
          />
        </div>
      </div>
      <div className="divide-y divide-white/[0.075] border-t border-white/10 sm:hidden">
        {visibleBills.length ? visibleBills.map((bill) => (
          <article key={bill.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#343a48]">{bill.billNumber}</p>
                <p className="mt-1 truncate text-[11px] text-[#7e8595]">
                  {bill.propertyName} · Unit {bill.unitNumber} · {formatElectricityReadingDate(bill.billingPeriod)}
                </p>
              </div>
              <span className={cn(
                "inline-flex shrink-0 px-2.5 py-1 text-[10px] font-bold",
                bill.status === "Paid"
                  ? statusStyles.Paid
                  : bill.status === "Overdue"
                    ? statusStyles.Overdue
                    : statusStyles.Upcoming,
              )}>
                {bill.status}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-y border-white/[0.075] py-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/30">Amount</p>
                <p className="mt-1 text-sm font-bold text-[#343a48]">{formatCurrency(bill.amount)}</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/30">Pending</p>
                <p className="mt-1 text-sm font-bold text-[#b66a45]">{formatCurrency(bill.pending)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/30">Meter reading</p>
                <p className="mt-1 text-[11px] text-[#7e8595]">
                  {formatMeterReading(bill.previousReading)} → {formatMeterReading(bill.currentReading)} · {formatMeterReading(bill.unitsConsumed)} units
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11px] text-[#7e8595]">Due {bill.dueDate}</p>
              <button
                onClick={() => onViewBill(bill)}
                className="inline-flex h-9 items-center gap-1.5 border border-[#dfe2e9] px-3 text-[11px] font-bold text-[#5555c7]"
              >
                <Eye className="size-3.5" /> View bill
              </button>
            </div>
          </article>
        )) : (
          <p className="px-5 py-10 text-center text-sm text-[#8b91a0]">
            {billSearch ? "No electricity bill matches that bill number." : `No electricity bills in ${financialYearLabel}.`}
          </p>
        )}
      </div>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[520px] text-left md:min-w-[760px] lg:min-w-[1000px]">
          <thead>
            <tr className="border-y border-[#eef0f4] bg-[#fafafd] text-[10px] uppercase tracking-[0.08em] text-[#989eac]">
              <th className="px-6 py-3 font-bold">Bill</th>
              <th className="px-4 py-3 font-bold">Reading date</th>
              <th className="px-4 py-3 font-bold">Unit</th>
              <th className="hidden px-4 py-3 font-bold xl:table-cell">Tenant</th>
              <th className="hidden px-4 py-3 font-bold lg:table-cell">Meter calculation</th>
              <th className="hidden px-4 py-3 font-bold md:table-cell">Amount</th>
              <th className="px-4 py-3 font-bold">Pending</th>
              <th className="hidden px-4 py-3 font-bold md:table-cell">Due date</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold">Copy</th>
            </tr>
          </thead>
          <tbody>
            {visibleBills.length ? visibleBills.map((bill) => (
              <tr key={bill.id} className="border-b border-[#f0f1f4] last:border-0 hover:bg-[#fcfcfe]">
                <td className="px-6 py-3.5">
                  <p className="text-xs font-bold text-[#343a48]">{bill.billNumber}</p>
                </td>
                <td className="px-4 py-3.5 text-xs text-[#5f6676]">{formatElectricityReadingDate(bill.billingPeriod)}</td>
                <td className="px-4 py-3.5">
                  <p className="text-xs font-bold text-[#4d5362]">{bill.propertyName}</p>
                  <p className="mt-0.5 text-[10px] text-[#989eac]">Unit {bill.unitNumber}</p>
                </td>
                <td className="hidden px-4 py-3.5 text-xs text-[#5f6676] xl:table-cell">{bill.tenantName}</td>
                <td className="hidden px-4 py-3.5 lg:table-cell">
                  <p className="text-xs font-bold tabular-nums text-[#4d5362]">{formatMeterReading(bill.previousReading)} → {formatMeterReading(bill.currentReading)}</p>
                  <p className="mt-0.5 text-[10px] tabular-nums text-[#989eac]">{formatMeterReading(bill.unitsConsumed)} units × {formatCurrency(bill.unitRate)}</p>
                </td>
                <td className="hidden px-4 py-3.5 text-xs font-bold text-[#343a48] md:table-cell">{formatCurrency(bill.amount)}</td>
                <td className="px-4 py-3.5 text-xs font-bold text-[#b66a45]">{formatCurrency(bill.pending)}</td>
                <td className="hidden px-4 py-3.5 text-xs text-[#7e8595] md:table-cell">{bill.dueDate}</td>
                <td className="px-4 py-3.5">
                  <span className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold",
                    bill.status === "Paid"
                      ? statusStyles.Paid
                      : bill.status === "Overdue"
                        ? statusStyles.Overdue
                        : statusStyles.Upcoming,
                  )}>
                    {bill.status}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <button
                    onClick={() => onViewBill(bill)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#dfe2e9] px-2.5 py-1.5 text-[10px] font-bold text-[#5555c7] hover:bg-[#efeffd]"
                  >
                    <Eye className="size-3.5" /> View
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-sm text-[#8b91a0]">
                  {billSearch ? "No electricity bill matches that bill number." : `No electricity bills in ${financialYearLabel}.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
