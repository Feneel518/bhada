"use client";

import { useState } from "react";
import { Download, FileText, LoaderCircle, Share2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { ElectricityBillRecord } from "@/lib/electricity-billing";
import { formatBillingMonth } from "@/lib/financial-year";
import type { RentBillingSummary } from "@/lib/rent-billing";
import type { TenantRecord } from "@/lib/tenants";
import { formatCurrency } from "@/lib/utils";

type RentBill = RentBillingSummary["bills"][number];

export type BillIssuer = {
  businessName: string;
  email: string;
  phone: string;
  gstin: string;
  pan: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

export type BillDocument =
  | { kind: "rent"; bill: RentBill; tenant: TenantRecord | null }
  | { kind: "electricity"; bill: ElectricityBillRecord; tenant: TenantRecord | null };

function formatDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(`${value}T00:00:00+05:30`));
}

const money = (value: number) =>
  `INR ${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;

function gstTaxableAmount(bill: RentBill) {
  return bill.gstRate > 0 ? (bill.gstAmount * 100) / bill.gstRate : 0;
}

function filenameFor(document: BillDocument) {
  return `${document.kind === "rent" ? "Rent" : "Electricity"}-Bill-${document.bill.billNumber.replace(/[^a-z0-9-]/gi, "-")}.pdf`;
}

async function createPdf(document: BillDocument, issuer: BillIssuer) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const bill = document.bill;
  const tenant = document.tenant;
  const accent: [number, number, number] = document.kind === "rent" ? [91, 91, 214] : [234, 150, 63];
  const issuerAddress = [issuer.address, issuer.city, issuer.state, issuer.pincode].filter(Boolean).join(", ");

  pdf.setFillColor(...accent);
  pdf.rect(0, 0, 210, 7, "F");
  pdf.setTextColor(32, 38, 54);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.text(issuer.businessName || "Bhada Property Management", 18, 25);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(105, 112, 129);
  if (issuerAddress) pdf.text(issuerAddress, 18, 31, { maxWidth: 105 });
  pdf.text([issuer.phone, issuer.email].filter(Boolean).join("  |  "), 18, issuerAddress ? 38 : 32);

  pdf.setTextColor(...accent);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(17);
  pdf.text(document.kind === "rent" ? "RENT BILL" : "ELECTRICITY BILL", 192, 24, { align: "right" });
  pdf.setFontSize(9);
  pdf.setTextColor(74, 81, 97);
  pdf.text(bill.billNumber, 192, 31, { align: "right" });

  pdf.setDrawColor(228, 230, 237);
  pdf.line(18, 47, 192, 47);
  pdf.setFontSize(8);
  pdf.setTextColor(142, 148, 162);
  pdf.setFont("helvetica", "bold");
  pdf.text("BILL TO", 18, 57);
  pdf.text("BILL DETAILS", 126, 57);
  pdf.setTextColor(42, 48, 64);
  pdf.setFontSize(11);
  pdf.text(tenant?.name || bill.tenantName, 18, 65);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  const propertyLine = tenant
    ? `${tenant.propertyName}, Unit ${tenant.unitNumber}`
    : document.kind === "electricity"
      ? `${document.bill.propertyName}, Unit ${document.bill.unitNumber}`
      : "";
  pdf.text(propertyLine, 18, 71);
  if (tenant?.phone) pdf.text(tenant.phone, 18, 77);
  if (tenant?.email) pdf.text(tenant.email, 18, tenant.phone ? 83 : 77);

  const detailRows = [
    ["Billing period", formatBillingMonth(bill.billingPeriod)],
    ["Issue date", formatDate(new Date().toISOString().slice(0, 10))],
    ["Due date", formatDate(bill.dueDate)],
    ["Status", bill.status.toUpperCase()],
  ];
  detailRows.forEach(([label, value], index) => {
    const y = 65 + index * 7;
    pdf.setTextColor(129, 136, 151);
    pdf.setFont("helvetica", "normal");
    pdf.text(label, 126, y);
    pdf.setTextColor(42, 48, 64);
    pdf.setFont("helvetica", "bold");
    pdf.text(value, 192, y, { align: "right" });
  });

  const tableTop = 101;
  pdf.setFillColor(247, 248, 252);
  pdf.roundedRect(18, tableTop, 174, 11, 2, 2, "F");
  pdf.setTextColor(126, 133, 148);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.text("DESCRIPTION", 23, tableTop + 7);
  pdf.text("AMOUNT", 187, tableTop + 7, { align: "right" });

  const rows: Array<[string, string, boolean?]> = document.kind === "rent"
    ? [
        [`Monthly rent — ${formatBillingMonth(document.bill.billingPeriod)}`, money(document.bill.baseAmount)],
        ...(document.bill.gstAmount > 0
          ? [[
              `GST @ ${document.bill.gstRate}% on taxable rent ${money(gstTaxableAmount(document.bill))}`,
              money(document.bill.gstAmount),
            ] as [string, string]]
          : []),
        ...(document.bill.tdsAmount > 0 ? [[`TDS deduction @ ${document.bill.tdsRate}%`, `- ${money(document.bill.tdsAmount)}`] as [string, string]] : []),
      ]
    : [
        [`Electricity usage — ${formatBillingMonth(document.bill.billingPeriod)}`, money(document.bill.amount)],
        [`${document.bill.unitsConsumed} units x ${money(document.bill.unitRate)} per unit`, "", true],
        [`Meter: ${document.bill.previousReading} to ${document.bill.currentReading}`, "", true],
      ];

  rows.forEach(([label, amount, muted], index) => {
    const y = tableTop + 22 + index * 10;
    pdf.setFont("helvetica", muted ? "normal" : "bold");
    pdf.setFontSize(muted ? 8 : 9.5);
    pdf.setTextColor(...(muted ? [135, 142, 157] as [number, number, number] : [49, 55, 70] as [number, number, number]));
    pdf.text(label, 23, y);
    if (amount) pdf.text(amount, 187, y, { align: "right" });
    if (!muted) {
      pdf.setDrawColor(239, 240, 244);
      pdf.line(23, y + 5, 187, y + 5);
    }
  });

  const summaryTop = tableTop + 22 + rows.length * 10 + 8;
  const summary = [
    ["Bill amount", money(bill.amount)],
    ["Amount received", money(bill.paid)],
    ["Balance due", money(bill.pending)],
  ];
  summary.forEach(([label, value], index) => {
    const y = summaryTop + index * 9;
    const isTotal = index === 2;
    if (isTotal) {
      pdf.setFillColor(...accent);
      pdf.roundedRect(112, y - 6, 80, 11, 2, 2, "F");
      pdf.setTextColor(255, 255, 255);
    } else {
      pdf.setTextColor(87, 94, 109);
    }
    pdf.setFont("helvetica", isTotal ? "bold" : "normal");
    pdf.setFontSize(isTotal ? 10 : 9);
    pdf.text(label, 117, y);
    pdf.text(value, 187, y, { align: "right" });
  });

  const noteTop = Math.max(205, summaryTop + 34);
  if (document.kind === "electricity" && document.bill.note) {
    pdf.setTextColor(126, 133, 148);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.text("NOTE", 18, noteTop);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(74, 81, 97);
    pdf.text(document.bill.note, 18, noteTop + 6, { maxWidth: 174 });
  }

  pdf.setDrawColor(228, 230, 237);
  pdf.line(18, 270, 192, 270);
  pdf.setFontSize(8);
  pdf.setTextColor(137, 143, 157);
  pdf.setFont("helvetica", "normal");
  const taxDetails = [
    issuer.gstin ? `GSTIN: ${issuer.gstin}` : "",
    issuer.pan ? `PAN: ${issuer.pan}` : "",
  ].filter(Boolean).join("  |  ");
  pdf.text(taxDetails || "Computer-generated bill; no signature is required.", 18, 277);
  pdf.text("Generated with bhada", 192, 277, { align: "right" });

  return pdf.output("blob");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function BillDocumentDialog({
  document,
  issuer,
  onClose,
}: {
  document: BillDocument | null;
  issuer: BillIssuer;
  onClose: () => void;
}) {
  const [working, setWorking] = useState<"download" | "share" | null>(null);
  if (!document) return null;

  const bill = document.bill;
  const tenant = document.tenant;

  async function download() {
    if (!document) return;
    setWorking("download");
    try {
      const blob = await createPdf(document, issuer);
      downloadBlob(blob, filenameFor(document));
      toast.success("PDF downloaded");
    } catch {
      toast.error("Couldn’t create the PDF. Please try again.");
    } finally {
      setWorking(null);
    }
  }

  async function share() {
    if (!document) return;
    setWorking("share");
    try {
      const blob = await createPdf(document, issuer);
      const file = new File([blob], filenameFor(document), { type: "application/pdf" });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({
          title: `${document.kind === "rent" ? "Rent" : "Electricity"} bill ${bill.billNumber}`,
          text: `${bill.tenantName} — ${formatBillingMonth(bill.billingPeriod)}`,
          files: [file],
        });
      } else {
        downloadBlob(blob, filenameFor(document));
        toast.info("Sharing isn’t supported here, so the PDF was downloaded.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Couldn’t share this bill.");
    } finally {
      setWorking(null);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[94vh] max-w-[880px] overflow-y-auto p-0">
        <div className="flex flex-col gap-4 border-b border-[#e8eaf0] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <DialogTitle>{document.kind === "rent" ? "Rent bill copy" : "Electricity bill copy"}</DialogTitle>
            <DialogDescription className="mt-1">Preview, download, or share this bill as a PDF.</DialogDescription>
          </div>
          <div className="flex gap-2 pr-7 sm:pr-0">
            <Button variant="outline" onClick={share} disabled={working !== null}>
              {working === "share" ? <LoaderCircle className="size-4 animate-spin" /> : <Share2 className="size-4" />} Share
            </Button>
            <Button onClick={download} disabled={working !== null}>
              {working === "download" ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />} Download PDF
            </Button>
          </div>
        </div>

        <div className="bg-[#f0f1f5] p-3 sm:p-7">
          <article className="mx-auto min-h-[760px] max-w-[720px] overflow-hidden rounded-sm bg-white shadow-[0_14px_45px_rgba(35,40,55,.12)]">
            <div className={document.kind === "rent" ? "h-2 bg-[#5b5bd6]" : "h-2 bg-[#ea963f]"} />
            <div className="p-6 sm:p-10">
              <header className="flex items-start justify-between gap-5">
                <div>
                  <p className="font-display text-xl font-extrabold tracking-[-0.035em] text-[#202636] sm:text-2xl">{issuer.businessName || "Bhada Property Management"}</p>
                  <p className="mt-2 max-w-sm text-[11px] leading-5 text-[#858b9a]">
                    {[issuer.address, issuer.city, issuer.state, issuer.pincode].filter(Boolean).join(", ")}
                    {(issuer.phone || issuer.email) && <><br />{[issuer.phone, issuer.email].filter(Boolean).join(" · ")}</>}
                  </p>
                </div>
                <div className="text-right">
                  <span className={document.kind === "rent" ? "inline-grid size-10 place-items-center rounded-xl bg-[#efeffd] text-[#5b5bd6]" : "inline-grid size-10 place-items-center rounded-xl bg-[#fff1e3] text-[#c77a35]"}>
                    {document.kind === "rent" ? <FileText className="size-5" /> : <Zap className="size-5" />}
                  </span>
                  <p className="mt-3 text-sm font-extrabold tracking-[0.08em] text-[#303646]">{document.kind === "rent" ? "RENT BILL" : "ELECTRICITY BILL"}</p>
                  <p className="mt-1 text-[10px] text-[#8b91a0]">{bill.billNumber}</p>
                </div>
              </header>

              <div className="mt-8 grid gap-5 border-y border-[#eceef3] py-6 sm:grid-cols-2">
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#a0a5b2]">Bill to</p>
                  <p className="mt-2 text-sm font-bold text-[#303646]">{tenant?.name || bill.tenantName}</p>
                  <p className="mt-1 text-[11px] leading-5 text-[#7c8393]">
                    {tenant ? `${tenant.propertyName} · Unit ${tenant.unitNumber}` : document.kind === "electricity" ? `${document.bill.propertyName} · Unit ${document.bill.unitNumber}` : ""}
                    {tenant?.phone && <><br />{tenant.phone}</>}
                    {tenant?.email && <><br />{tenant.email}</>}
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-x-5 gap-y-2 text-[11px] sm:justify-self-end">
                  <dt className="text-[#9298a7]">Bill month</dt><dd className="text-right font-bold">{formatBillingMonth(bill.billingPeriod)}</dd>
                  <dt className="text-[#9298a7]">Due date</dt><dd className="text-right font-bold">{formatDate(bill.dueDate)}</dd>
                  <dt className="text-[#9298a7]">Status</dt><dd className="text-right font-bold">{bill.status}</dd>
                </dl>
              </div>

              <div className="mt-7">
                <div className="grid grid-cols-[1fr_auto] rounded-lg bg-[#f7f8fb] px-4 py-3 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#9298a7]">
                  <span>Description</span><span>Amount</span>
                </div>
                {document.kind === "rent" ? (
                  <div className="divide-y divide-[#eff0f4] text-xs">
                    <BillLine label={`Monthly rent · ${formatBillingMonth(document.bill.billingPeriod)}`} value={formatCurrency(document.bill.baseAmount)} />
                    {document.bill.gstAmount > 0 && (
                      <BillLine
                        label={`GST @ ${document.bill.gstRate}% on taxable rent ${formatCurrency(gstTaxableAmount(document.bill))}`}
                        value={formatCurrency(document.bill.gstAmount)}
                      />
                    )}
                    {document.bill.tdsAmount > 0 && <BillLine label={`TDS deduction @ ${document.bill.tdsRate}%`} value={`− ${formatCurrency(document.bill.tdsAmount)}`} />}
                  </div>
                ) : (
                  <div className="border-b border-[#eff0f4] px-4 py-5">
                    <div className="flex justify-between gap-4 text-xs font-bold"><span>Electricity usage · {formatBillingMonth(document.bill.billingPeriod)}</span><span>{formatCurrency(document.bill.amount)}</span></div>
                    <p className="mt-2 text-[10px] text-[#8b91a0]">{document.bill.previousReading} → {document.bill.currentReading} = {document.bill.unitsConsumed} units × {formatCurrency(document.bill.unitRate)}</p>
                  </div>
                )}
              </div>

              <div className="ml-auto mt-6 max-w-[310px] space-y-3 text-xs">
                <SummaryLine label="Bill amount" value={formatCurrency(bill.amount)} />
                <SummaryLine label="Amount received" value={formatCurrency(bill.paid)} />
                <div className={document.kind === "rent" ? "flex justify-between rounded-xl bg-[#5b5bd6] px-4 py-3.5 font-bold text-white" : "flex justify-between rounded-xl bg-[#d98538] px-4 py-3.5 font-bold text-white"}>
                  <span>Balance due</span><span>{formatCurrency(bill.pending)}</span>
                </div>
              </div>

              {document.kind === "electricity" && document.bill.note && (
                <div className="mt-10 rounded-xl bg-[#fafafd] p-4 text-[11px] leading-5 text-[#747b8b]"><span className="font-bold text-[#4d5362]">Note: </span>{document.bill.note}</div>
              )}

              <footer className="mt-16 flex flex-wrap justify-between gap-3 border-t border-[#eceef3] pt-4 text-[9px] text-[#9aa0af]">
                <span>{[issuer.gstin && `GSTIN: ${issuer.gstin}`, issuer.pan && `PAN: ${issuer.pan}`].filter(Boolean).join(" · ") || "Computer-generated bill"}</span>
                <span>Generated with bhada</span>
              </footer>
            </div>
          </article>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BillLine({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 px-4 py-4"><span className="font-semibold text-[#454c5b]">{label}</span><span className="font-bold text-[#303646]">{value}</span></div>;
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between px-4 text-[#646b7b]"><span>{label}</span><span className="font-bold text-[#303646]">{value}</span></div>;
}
