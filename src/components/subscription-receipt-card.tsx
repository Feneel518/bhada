"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Download, LoaderCircle, ReceiptText, Search } from "lucide-react";
import { toast } from "sonner";
import { FormSelect } from "@/components/ui/form-controls";
import { getCurrentFinancialYear, getFinancialYear } from "@/lib/financial-year";
import { downloadSubscriptionReceiptPdf } from "@/lib/subscription-receipt-pdf";
import type { SubscriptionReceipt } from "@/lib/subscription-receipts";

export function SubscriptionBillingHistory({
  receipts,
  customer,
  focusedReceiptId,
}: {
  receipts: SubscriptionReceipt[];
  customer: { name: string; email: string };
  focusedReceiptId?: string;
}) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const financialYears = useMemo(() => {
    const years = new Set(receipts.map((receipt) => receiptFinancialYear(receipt.paidAt)));
    years.add(getCurrentFinancialYear().startYear);
    return Array.from(years).sort((left, right) => right - left);
  }, [receipts]);
  const [selectedYear, setSelectedYear] = useState(() => {
    const focusedReceipt = receipts.find((receipt) => receipt.paymentId === focusedReceiptId);
    return String(
      focusedReceipt
        ? receiptFinancialYear(focusedReceipt.paidAt)
        : receipts[0]
          ? receiptFinancialYear(receipts[0].paidAt)
          : getCurrentFinancialYear().startYear,
    );
  });
  const [query, setQuery] = useState("");
  const filteredReceipts = useMemo(() => {
    const search = query.trim().toLowerCase();
    return receipts.filter((receipt) => {
      if (receiptFinancialYear(receipt.paidAt) !== Number(selectedYear)) return false;
      if (!search) return true;
      return `${receipt.receiptNumber} ${receipt.paymentId} ${receipt.subscriptionId} ${receipt.amountPaise}`
        .toLowerCase()
        .includes(search);
    });
  }, [query, receipts, selectedYear]);

  async function downloadReceipt(receipt: SubscriptionReceipt) {
    setDownloadingId(receipt.paymentId);
    try {
      await downloadSubscriptionReceiptPdf({
        ...receipt,
        customerName: customer.name,
        customerEmail: customer.email,
        description: "Bhada Portfolio plan - monthly subscription",
      });
    } catch {
      toast.error("Could not download the receipt. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <section id="receipts" className="scroll-mt-24 border border-white/10 bg-[#171717]">
      <div className="flex items-start gap-4 border-b border-white/10 px-5 py-5 sm:px-6">
        <span className="grid size-10 shrink-0 place-items-center border border-white/10 bg-white/[0.025] text-[#e4c77a]">
          <ReceiptText className="size-5" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e4c77a]/65">
            Subscription
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold tracking-[-0.025em] text-[#edede8]">
            Billing history
          </h2>
          <p className="mt-1 text-xs leading-5 text-white/35">
            View and download invoices for every Portfolio payment.
          </p>
        </div>
      </div>

      {receipts.length ? (
        <>
          <div className="grid gap-3 border-b border-white/[0.07] px-5 py-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:px-6">
            <label className="relative">
              <span className="sr-only">Search invoices</span>
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/30" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search invoice or payment ID"
                className="h-10 w-full border border-white/10 bg-white/[0.02] pl-10 pr-3 text-xs text-[#edede8] outline-none placeholder:text-white/25 focus:border-[#e4c77a]/45"
              />
            </label>
            <FormSelect
              value={selectedYear}
              onValueChange={setSelectedYear}
              className="h-10 w-full border border-white/10 bg-white/[0.02] px-3 text-xs font-semibold text-[#edede8] outline-none focus:border-[#e4c77a]/45"
              options={financialYears.map((year) => ({
                value: String(year),
                label: getFinancialYear(year).label,
              }))}
            />
          </div>

          {filteredReceipts.length ? (
            <div className="divide-y divide-white/[0.07]">
              {filteredReceipts.map((receipt) => {
                const downloading = downloadingId === receipt.paymentId;
                return (
                  <div
                    key={receipt.paymentId}
                    className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-6 ${
                      receipt.paymentId === focusedReceiptId
                        ? "bg-[#e4c77a]/[0.07] ring-1 ring-inset ring-[#e4c77a]/30"
                        : ""
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center border border-[#7fc5ad]/25 bg-[#7fc5ad]/[0.05] text-[#7fc5ad]">
                        <CheckCircle2 className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#edede8]">
                          Portfolio plan · ₹{(receipt.amountPaise / 100).toFixed(2)}
                        </p>
                        <p className="mt-1 text-xs text-white/40">
                          {formatReceiptDate(receipt.paidAt)}
                        </p>
                        <p className="mt-1 truncate text-[11px] text-white/25">
                          {receipt.receiptNumber} · {receipt.paymentId}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pl-11 sm:justify-end sm:pl-0">
                  <span className="border border-[#7fc5ad]/25 bg-[#7fc5ad]/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7fc5ad]">
                        Paid
                      </span>
                      <button
                        type="button"
                        onClick={() => downloadReceipt(receipt)}
                        disabled={Boolean(downloadingId)}
                        className="inline-flex h-9 items-center justify-center gap-2 border border-white/10 bg-white/[0.025] px-3 text-xs font-semibold text-white/55 transition hover:border-[#e4c77a]/35 hover:bg-[#e4c77a]/[0.05] hover:text-[#e4c77a] disabled:cursor-wait disabled:opacity-60"
                        aria-label={`Download invoice ${receipt.receiptNumber}`}
                      >
                        {downloading
                          ? <LoaderCircle className="size-3.5 animate-spin" />
                          : <Download className="size-3.5" />}
                        {downloading ? "Preparing..." : "Invoice"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-8 text-center sm:px-6">
              <p className="text-sm font-semibold text-[#edede8]">No matching receipts</p>
              <p className="mt-1 text-xs text-white/35">
                Try another financial year or clear your search.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="px-5 py-8 text-center sm:px-6">
          <p className="text-sm font-semibold text-[#edede8]">No invoices yet</p>
          <p className="mt-1 text-xs text-white/35">
            Your Portfolio payment invoices will appear here.
          </p>
        </div>
      )}
    </section>
  );
}

function formatReceiptDate(value: string, includeTime = false) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: includeTime ? "long" : "medium",
    ...(includeTime ? { timeStyle: "short" as const } : {}),
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function receiptFinancialYear(value: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
    })
      .formatToParts(new Date(value))
      .map((part) => [part.type, part.value]),
  );
  const year = Number(parts.year);
  return Number(parts.month) >= 4 ? year : year - 1;
}
