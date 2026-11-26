"use client";

import { Ellipsis } from "lucide-react";
import type { PaymentRecord } from "@/lib/payments";
import { cn, formatCurrency } from "@/lib/utils";
import { statusStyles } from "@/components/workspace/shared";

export function PaymentTable({
  rows,
  onViewAll,
  focusedPaymentId,
}: {
  rows: PaymentRecord[];
  onViewAll?: () => void;
  focusedPaymentId?: string;
}) {
  const focusedPayment = rows.find((payment) => payment.id === focusedPaymentId);
  const displayedRows = focusedPayment
    ? [focusedPayment, ...rows.filter((payment) => payment.id !== focusedPaymentId).slice(0, 7)]
    : rows.slice(0, 8);

  return (
    <section
      id={focusedPayment ? "notification-payment-target" : undefined}
      className="scroll-mt-24 overflow-hidden rounded-[20px] border border-[#e7e9ef] bg-white shadow-[0_1px_2px_rgba(25,29,41,.02)]"
    >
      <div className="flex items-center justify-between p-5 pb-4 sm:px-6">
        <div>
          <h2 className="font-display text-base font-bold tracking-[-0.025em]">Recent payments</h2>
          <p className="mt-1 text-xs text-[#8b91a0]">Latest activity from your tenants</p>
        </div>
        {onViewAll && (
          <button onClick={onViewAll} className="text-xs font-bold text-[#5b5bd6] hover:text-[#4646b8]">
            View all
          </button>
        )}
      </div>
      <div className="divide-y divide-white/[0.075] border-t border-white/10 sm:hidden">
        {rows.length ? (
          displayedRows.map((payment) => (
            <div
              key={payment.id}
              className={cn(
                "p-4",
                payment.id === focusedPaymentId && "bg-[#e4c77a]/[0.09] ring-1 ring-inset ring-[#e4c77a]/35",
              )}
            >
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[#e4c77a]/25 bg-[#e4c77a]/[0.08] text-[10px] font-extrabold text-[#e4c77a]">
                  {payment.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#343a48]">{payment.tenant}</p>
                      <p className="mt-0.5 truncate text-[11px] text-[#989eac]">{payment.property} · {payment.summary}</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-[#343a48]">{formatCurrency(payment.amount)}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-[11px] text-[#7e8595]">{payment.date}</p>
                    <span className={cn("inline-flex px-2.5 py-1 text-[10px] font-bold", statusStyles[payment.status])}>
                      {payment.status}
                    </span>
                  </div>
                  {payment.status !== "Paid" && (
                    <p className="mt-2 text-right text-[10px] font-semibold text-[#b66a45]">
                      Balance {formatCurrency(payment.balance)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="px-5 py-10 text-center text-sm text-[#8b91a0]">No payments match your search.</p>
        )}
      </div>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[600px] text-left">
          <thead>
            <tr className="border-y border-[#eef0f4] bg-[#fafafd] text-[10px] uppercase tracking-[0.08em] text-[#989eac]">
              <th className="px-6 py-3 font-bold">Tenant</th>
              <th className="px-4 py-3 font-bold">Amount</th>
              <th className="px-4 py-3 font-bold">Date</th>
              <th className="px-4 py-3 font-bold">Balance</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="w-12 px-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              displayedRows.map((payment) => (
                <tr
                  key={payment.id}
                  className={cn(
                    "border-b border-[#f0f1f4] last:border-0 hover:bg-[#fcfcfe]",
                    payment.id === focusedPaymentId && "bg-[#fff9e9] ring-1 ring-inset ring-[#e4c77a]/50",
                  )}
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 place-items-center rounded-full border border-[#e4c77a]/25 bg-[#e4c77a]/[0.08] text-[10px] font-extrabold text-[#e4c77a]">
                        {payment.initials}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#343a48]">{payment.tenant}</p>
                        <p className="mt-0.5 text-[10px] text-[#989eac]">{payment.property} · {payment.summary}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-bold text-[#343a48]">{formatCurrency(payment.amount)}</td>
                  <td className="px-4 py-3.5 text-xs text-[#7e8595]">{payment.date}</td>
                  <td className={cn(
                    "px-4 py-3.5 text-xs font-bold",
                    payment.status === "Pending"
                      ? "text-[#b66a45]"
                      : payment.status === "Overpaid"
                        ? "text-[#3974ad]"
                        : "text-[#328161]",
                  )}>
                    {payment.status === "Paid" ? "—" : formatCurrency(payment.balance)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold", statusStyles[payment.status])}>{payment.status}</span>
                  </td>
                  <td className="px-3"><Ellipsis className="size-4 text-[#9ca1af]" /></td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-[#8b91a0]">No payments match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
