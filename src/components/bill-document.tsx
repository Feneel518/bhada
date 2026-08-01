"use client";

import { useState } from "react";
import { Download, LoaderCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BhadaMark } from "@/components/brand-logo";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { ElectricityBillRecord } from "@/lib/electricity-billing";
import { formatBillingMonth, formatElectricityReadingDate } from "@/lib/financial-year";
import { drawBhadaPdfLogo, loadGotuPdfFont } from "@/lib/bhada-pdf-logo";
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

export type BillTenant = Pick<
  TenantRecord,
  "name" | "phone" | "email" | "propertyName" | "unitNumber"
>;

export type BillDocument =
  | { kind: "rent"; bill: RentBill; tenant: BillTenant | null }
  | { kind: "electricity"; bill: ElectricityBillRecord; tenant: BillTenant | null };

type InvoiceRow = {
  item: string;
  quantity: string;
  unitPrice: string;
  total: string;
};

function formatDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
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

function invoiceRows(document: BillDocument): InvoiceRow[] {
  if (document.kind === "electricity") {
    return [{
      item: `Electricity usage — reading dated ${formatElectricityReadingDate(document.bill.billingPeriod)}`,
      quantity: String(document.bill.unitsConsumed),
      unitPrice: money(document.bill.unitRate),
      total: money(document.bill.amount),
    }];
  }

  return [
    {
      item: `Monthly rent — ${formatBillingMonth(document.bill.billingPeriod)}`,
      quantity: "1",
      unitPrice: money(document.bill.baseAmount),
      total: money(document.bill.baseAmount),
    },
    ...(document.bill.gstAmount > 0
      ? [{
          item: `GST on taxable rent of ${money(gstTaxableAmount(document.bill))}`,
          quantity: `${document.bill.gstRate}%`,
          unitPrice: "Tax",
          total: money(document.bill.gstAmount),
        }]
      : []),
    ...(document.bill.tdsAmount > 0
      ? [{
          item: "TDS deduction",
          quantity: `${document.bill.tdsRate}%`,
          unitPrice: "Deduction",
          total: `− ${money(document.bill.tdsAmount)}`,
        }]
      : []),
  ];
}

function subtotalFor(document: BillDocument) {
  return document.kind === "rent" ? document.bill.baseAmount : document.bill.amount;
}

function taxFor(document: BillDocument) {
  return document.bill.amount - subtotalFor(document);
}

function filenameFor(document: BillDocument) {
  return `${document.kind === "rent" ? "Rent" : "Electricity"}-Invoice-${document.bill.billNumber.replace(/[^a-z0-9-]/gi, "-")}.pdf`;
}

async function createPdf(document: BillDocument, issuer: BillIssuer) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pdfFont = await loadGotuPdfFont(pdf);
  const bill = document.bill;
  const tenant = document.tenant;
  const rows = invoiceRows(document);
  const paper: [number, number, number] = [247, 247, 243];
  const ink: [number, number, number] = [18, 18, 16];
  const muted: [number, number, number] = [83, 83, 78];
  const issuerAddress = [issuer.address, issuer.city, issuer.state, issuer.pincode].filter(Boolean).join(", ");
  const propertyLine = tenant
    ? `${tenant.propertyName}, Unit ${tenant.unitNumber}`
    : document.kind === "electricity"
      ? `${document.bill.propertyName}, Unit ${document.bill.unitNumber}`
      : "";

  pdf.setFillColor(...paper);
  pdf.rect(0, 0, 210, 297, "F");

  await drawBhadaPdfLogo(pdf, pdfFont);

  pdf.setTextColor(...ink);
  pdf.setFont(pdfFont, "normal");
  pdf.setFontSize(35);
  pdf.text("INVOICE", 185, 39, { align: "right" });

  pdf.setFont(pdfFont, "bold");
  pdf.setFontSize(8);
  pdf.text("BILLED TO:", 26, 66);
  pdf.setFont(pdfFont, "normal");
  pdf.setFontSize(9.5);
  pdf.text(tenant?.name || bill.tenantName, 26, 74);
  let billedToY = 80;
  if (tenant?.phone) {
    pdf.text(tenant.phone, 26, billedToY);
    billedToY += 6;
  }
  if (propertyLine) {
    pdf.text(propertyLine, 26, billedToY, { maxWidth: 75 });
    billedToY += 6;
  }
  if (tenant?.email) pdf.text(tenant.email, 26, billedToY, { maxWidth: 75 });

  pdf.setFontSize(10);
  pdf.text(`Invoice No. ${bill.billNumber}`, 185, 61, { align: "right" });
  pdf.text(formatDate(new Date().toISOString().slice(0, 10)), 185, 68, { align: "right" });
  pdf.setFontSize(8);
  pdf.setTextColor(...muted);
  pdf.text(`Due ${formatDate(bill.dueDate)}  |  ${bill.status}`, 185, 75, { align: "right" });

  const tableTop = 101;
  const columns = { item: 28, quantity: 124, unitPrice: 154, total: 184 };
  pdf.setDrawColor(...ink);
  pdf.setLineWidth(0.25);
  pdf.line(26, tableTop, 185, tableTop);
  pdf.setFont(pdfFont, "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...ink);
  pdf.text("Item", columns.item, tableTop + 8);
  pdf.text("Quantity", columns.quantity, tableTop + 8, { align: "center" });
  pdf.text("Unit Price", columns.unitPrice, tableTop + 8, { align: "center" });
  pdf.text("Total", columns.total, tableTop + 8, { align: "right" });
  pdf.line(26, tableTop + 13, 185, tableTop + 13);

  rows.forEach((row, index) => {
    const y = tableTop + 23 + index * 13;
    pdf.setFont(pdfFont, "normal");
    pdf.setFontSize(8.5);
    pdf.text(row.item, columns.item, y, { maxWidth: 85 });
    pdf.text(row.quantity, columns.quantity, y, { align: "center" });
    pdf.text(row.unitPrice, columns.unitPrice, y, { align: "center" });
    pdf.text(row.total, columns.total, y, { align: "right" });
    pdf.setDrawColor(98, 98, 93);
    pdf.line(26, y + 6, 185, y + 6);
  });

  const summaryTop = tableTop + 24 + rows.length * 13;
  const summaryRows: Array<[string, string, boolean?]> = [
    ["Subtotal", money(subtotalFor(document))],
    ["Tax / adjustments", money(taxFor(document))],
    ...(bill.paid > 0 ? [["Amount received", `− ${money(bill.paid)}`] as [string, string]] : []),
    ["Total Due", money(bill.pending), true],
  ];
  summaryRows.forEach(([label, value, total], index) => {
    const y = summaryTop + index * 12;
    if (total) pdf.line(138, y - 7, 185, y - 7);
    pdf.setFont(pdfFont, "bold");
    pdf.setFontSize(total ? 13 : 8.5);
    pdf.text(label, 142, y);
    pdf.setFont(pdfFont, "normal");
    pdf.setFontSize(total ? 14 : 8.5);
    pdf.text(value, 185, y, { align: "right" });
  });

  if (document.kind === "electricity" && document.bill.note) {
    pdf.setFont(pdfFont, "bold");
    pdf.setFontSize(8);
    pdf.text("NOTE", 26, 187);
    pdf.setFont(pdfFont, "normal");
    pdf.setTextColor(...muted);
    pdf.text(document.bill.note, 26, 194, { maxWidth: 95 });
  }

  pdf.setTextColor(...ink);
  pdf.setFont(pdfFont, "normal");
  pdf.setFontSize(14);
  pdf.text("Thank you for your Business!", 26, 226);

  pdf.setFont(pdfFont, "bold");
  pdf.setFontSize(8);
  pdf.text("BUSINESS INFORMATION", 26, 244);
  pdf.setFont(pdfFont, "normal");
  pdf.setFontSize(8.5);
  const businessDetails = [
    issuer.gstin ? `GSTIN: ${issuer.gstin}` : "",
    issuer.pan ? `PAN: ${issuer.pan}` : "",
    issuer.phone,
    issuer.email,
  ].filter(Boolean);
  businessDetails.forEach((line, index) => pdf.text(line, 26, 252 + index * 5.5));
  if (!businessDetails.length) pdf.text("Computer-generated invoice", 26, 252);

  pdf.setFont(pdfFont, "normal");
  pdf.setFontSize(17);
  pdf.text(issuer.businessName || "Bhada Property Management", 185, 253, { align: "right", maxWidth: 82 });
  pdf.setFont(pdfFont, "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...muted);
  if (issuerAddress) pdf.text(issuerAddress, 185, 261, { align: "right", maxWidth: 82 });
  pdf.text("Generated with bhada", 185, 278, { align: "right" });

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
  const rows = invoiceRows(document);
  const issuerAddress = [issuer.address, issuer.city, issuer.state, issuer.pincode].filter(Boolean).join(", ");
  const propertyLine = tenant
    ? `${tenant.propertyName} · Unit ${tenant.unitNumber}`
    : document.kind === "electricity"
      ? `${document.bill.propertyName} · Unit ${document.bill.unitNumber}`
      : "";

  async function download() {
    if (!document) return;
    setWorking("download");
    try {
      const blob = await createPdf(document, issuer);
      downloadBlob(blob, filenameFor(document));
      toast.success("Invoice PDF downloaded");
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
          title: `Invoice ${bill.billNumber}`,
          text: `${bill.tenantName} — ${document.kind === "electricity" ? formatElectricityReadingDate(bill.billingPeriod) : formatBillingMonth(bill.billingPeriod)}`,
          files: [file],
        });
      } else {
        downloadBlob(blob, filenameFor(document));
        toast.info("Sharing isn’t supported here, so the PDF was downloaded.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Couldn’t share this invoice.");
    } finally {
      setWorking(null);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[94vh] max-w-[880px] overflow-y-auto p-0">
        <div className="flex flex-col gap-4 border-b border-white/10 bg-[#171717] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <DialogTitle>Invoice copy</DialogTitle>
            <DialogDescription className="mt-1">Preview, download, or share this invoice as a PDF.</DialogDescription>
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

        <div className="bg-[#dddcd6] p-3 sm:p-7">
          <article className="font-display mx-auto min-h-[900px] max-w-[720px] bg-[#f7f7f3] px-7 py-10 text-[#121210] shadow-[0_14px_45px_rgba(35,40,55,.12)] sm:px-14 sm:py-14">
            <header className="grid grid-cols-2 items-start gap-8">
              <div className="flex w-fit flex-col items-center gap-2.5">
                <span className="grid size-20 place-items-center bg-black sm:size-24">
                  <BhadaMark className="size-[calc(100%-8px)] text-[#f7f7f3]" />
                </span>
                <span className="text-2xl sm:text-3xl">Bhada</span>
              </div>
              <h2 className="text-[clamp(2.7rem,9vw,5.5rem)] font-normal leading-[0.9] tracking-[-0.04em] text-right">
                INVOICE
              </h2>
            </header>

            <section className="mt-9 grid grid-cols-2 gap-8">
              <div className="text-[11px] leading-[1.65] sm:text-sm">
                <p className="font-bold">BILLED TO:</p>
                <p className="mt-1">{tenant?.name || bill.tenantName}</p>
                {tenant?.phone && <p>{tenant.phone}</p>}
                {propertyLine && <p>{propertyLine}</p>}
                {tenant?.email && <p>{tenant.email}</p>}
              </div>
              <div className="text-right text-[11px] leading-[1.65] sm:text-sm">
                <p>Invoice No. {bill.billNumber}</p>
                <p>{formatDate(new Date().toISOString().slice(0, 10))}</p>
                <p className="mt-1 text-[10px] text-black/55 sm:text-xs">Due {formatDate(bill.dueDate)} · {bill.status}</p>
              </div>
            </section>

            <div className="mt-14 overflow-x-auto sm:mt-16">
              <div className="min-w-[520px]">
                <div className="grid grid-cols-[minmax(0,1fr)_76px_100px_100px] border-y border-black px-2 py-3 text-xs font-bold sm:text-sm">
                  <span>Item</span><span className="text-center">Quantity</span><span className="text-center">Unit Price</span><span className="text-right">Total</span>
                </div>
                {rows.map((row) => (
                  <div key={row.item} className="grid grid-cols-[minmax(0,1fr)_76px_100px_100px] items-center border-b border-black/70 px-2 py-4 text-xs sm:text-sm">
                    <span>{row.item}</span><span className="text-center">{row.quantity}</span><span className="text-center">{row.unitPrice.replace("INR ", "₹")}</span><span className="text-right">{row.total.replace("INR ", "₹")}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="ml-auto mt-4 w-full max-w-[265px] text-xs sm:text-sm">
              <InvoiceSummaryLine label="Subtotal" value={formatCurrency(subtotalFor(document))} />
              <InvoiceSummaryLine label="Tax / adjustments" value={formatCurrency(taxFor(document))} />
              {bill.paid > 0 && <InvoiceSummaryLine label="Amount received" value={`− ${formatCurrency(bill.paid)}`} />}
              <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-5 border-t border-black py-4">
                <span className="text-xl font-bold leading-tight sm:text-2xl">Total<br />Due</span>
                <span className="text-xl sm:text-2xl">{formatCurrency(bill.pending)}</span>
              </div>
            </div>

            {document.kind === "electricity" && document.bill.note && (
              <div className="mt-8 max-w-md text-xs leading-5"><span className="font-bold">Note: </span>{document.bill.note}</div>
            )}

            <footer className="mt-24 sm:mt-32">
              <p className="text-xl sm:text-2xl">Thank you for your Business!</p>
              <div className="mt-10 grid gap-8 sm:grid-cols-2 sm:items-end">
                <div className="text-[11px] leading-[1.65] sm:text-xs">
                  <p className="font-bold">BUSINESS INFORMATION</p>
                  {issuer.gstin && <p className="mt-1">GSTIN: {issuer.gstin}</p>}
                  {issuer.pan && <p>PAN: {issuer.pan}</p>}
                  {issuer.phone && <p>{issuer.phone}</p>}
                  {issuer.email && <p>{issuer.email}</p>}
                  {!issuer.gstin && !issuer.pan && !issuer.phone && !issuer.email && <p className="mt-1">Computer-generated invoice</p>}
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-2xl leading-tight sm:text-3xl">{issuer.businessName || "Bhada Property Management"}</p>
                  {issuerAddress && <p className="mt-2 text-[10px] leading-4 sm:text-xs">{issuerAddress}</p>}
                </div>
              </div>
            </footer>
          </article>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceSummaryLine({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-5 px-1 py-2.5"><span className="font-bold">{label}</span><span>{value}</span></div>;
}
