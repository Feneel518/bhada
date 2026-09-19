"use client";

import { useState } from "react";
import { Download, LoaderCircle, Printer, Share2 } from "lucide-react";
import { toast } from "sonner";
import { BhadaMark } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { BillIssuer } from "@/components/bill-document";
import { drawBhadaPdfLogo, loadGotuPdfFont } from "@/lib/bhada-pdf-logo";
import type { TenantLedgerRecord } from "@/lib/tenant-ledgers";
import type { TenantRecord } from "@/lib/tenants";
import { formatCurrency } from "@/lib/utils";

function dateLabel(value: string) {
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
  }).format(Math.abs(value))}${value < -0.005 ? " CR" : ""}`;

function balanceLabel(value: number) {
  return `${formatCurrency(Math.abs(value))}${value < -0.005 ? " CR" : ""}`;
}

function fileName(tenant: TenantRecord, financialYearLabel: string) {
  const safeName = tenant.name.replace(/[^a-z0-9-]/gi, "-");
  return `Tenant-Ledger-${safeName}-${financialYearLabel.replace(/[^a-z0-9-]/gi, "-")}.pdf`;
}

async function createLedgerPdf(
  tenant: TenantRecord,
  ledger: TenantLedgerRecord,
  financialYearLabel: string,
  issuer: BillIssuer,
) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pdfFont = await loadGotuPdfFont(pdf);
  const paper: [number, number, number] = [247, 247, 243];
  const ink: [number, number, number] = [18, 18, 16];
  const muted: [number, number, number] = [83, 83, 78];
  let pageNumber = 1;

  const pageBase = () => {
    pdf.setFillColor(...paper);
    pdf.rect(0, 0, 210, 297, "F");
    pdf.setTextColor(...muted);
    pdf.setFont(pdfFont, "normal");
    pdf.setFontSize(7.5);
    pdf.text(`${issuer.businessName || "Bhada Property Management"} · ${financialYearLabel}`, 26, 286);
    pdf.text(`Page ${pageNumber}`, 185, 286, { align: "right" });
  };

  const tableHeader = (top: number) => {
    const columns = { date: 27, description: 51, reference: 111, debit: 145, credit: 166, balance: 184 };
    pdf.setDrawColor(...ink);
    pdf.setLineWidth(0.25);
    pdf.line(26, top, 185, top);
    pdf.setFont(pdfFont, "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...ink);
    pdf.text("Date", columns.date, top + 7);
    pdf.text("Description", columns.description, top + 7);
    pdf.text("Reference", columns.reference, top + 7);
    pdf.text("Debit", columns.debit, top + 7, { align: "right" });
    pdf.text("Credit", columns.credit, top + 7, { align: "right" });
    pdf.text("Balance", columns.balance, top + 7, { align: "right" });
    pdf.line(26, top + 11, 185, top + 11);
    return columns;
  };

  pageBase();
  await drawBhadaPdfLogo(pdf, pdfFont);
  pdf.setTextColor(...ink);
  pdf.setFont(pdfFont, "normal");
  pdf.setFontSize(31);
  pdf.text("TENANT LEDGER", 185, 39, { align: "right" });
  pdf.setFont(pdfFont, "bold");
  pdf.setFontSize(8);
  pdf.text("ACCOUNT HOLDER", 26, 68);
  pdf.setFont(pdfFont, "normal");
  pdf.setFontSize(10);
  pdf.text(tenant.name, 26, 76, { maxWidth: 72 });
  pdf.setFontSize(8.5);
  pdf.setTextColor(...muted);
  pdf.text(`${tenant.propertyName}, Unit ${tenant.unitNumber}`, 26, 83, { maxWidth: 72 });
  if (tenant.phone) pdf.text(tenant.phone, 26, 89, { maxWidth: 72 });

  pdf.setTextColor(...ink);
  pdf.setFontSize(9);
  pdf.text(financialYearLabel, 185, 67, { align: "right" });
  pdf.setTextColor(...muted);
  pdf.setFontSize(8);
  pdf.text(`Opening balance  ${money(ledger.openingBalance)}`, 185, 75, { align: "right" });
  pdf.text(`Closing balance  ${money(ledger.closingBalance)}`, 185, 82, { align: "right" });

  let tableTop = 101;
  let columns = tableHeader(tableTop);
  let y = tableTop + 20;

  for (const entry of ledger.entries) {
    if (y > 258) {
      pdf.addPage();
      pageNumber += 1;
      pageBase();
      pdf.setTextColor(...ink);
      pdf.setFont(pdfFont, "normal");
      pdf.setFontSize(17);
      pdf.text("TENANT LEDGER", 26, 24);
      pdf.setFontSize(8);
      pdf.setTextColor(...muted);
      pdf.text(`${tenant.name} · continued`, 185, 24, { align: "right" });
      tableTop = 34;
      columns = tableHeader(tableTop);
      y = tableTop + 20;
    }

    pdf.setFont(pdfFont, "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...ink);
    pdf.text(dateLabel(entry.date), columns.date, y);
    pdf.text(entry.description, columns.description, y, { maxWidth: 54 });
    pdf.setTextColor(...muted);
    pdf.text(entry.reference, columns.reference, y, { maxWidth: 28 });
    pdf.setTextColor(...ink);
    pdf.text(entry.debit ? money(entry.debit) : "—", columns.debit, y, { align: "right" });
    pdf.text(entry.credit ? money(entry.credit) : "—", columns.credit, y, { align: "right" });
    pdf.setFont(pdfFont, "bold");
    pdf.text(money(entry.balance), columns.balance, y, { align: "right" });
    pdf.setDrawColor(145, 145, 138);
    pdf.line(26, y + 5, 185, y + 5);
    y += 11;
  }

  if (y > 244) {
    pdf.addPage();
    pageNumber += 1;
    pageBase();
    y = 34;
  }
  pdf.setDrawColor(...ink);
  pdf.line(101, y + 2, 185, y + 2);
  pdf.setFont(pdfFont, "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...ink);
  pdf.text("Period debits", 104, y + 10);
  pdf.text(money(ledger.totalDebits), 185, y + 10, { align: "right" });
  pdf.text("Period credits", 104, y + 20);
  pdf.text(money(ledger.totalCredits), 185, y + 20, { align: "right" });
  pdf.setFontSize(12);
  pdf.line(101, y + 25, 185, y + 25);
  pdf.text("Closing balance", 104, y + 35);
  pdf.text(money(ledger.closingBalance), 185, y + 35, { align: "right" });

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

export function TenantLedgerDialog({
  tenant,
  ledger,
  financialYearLabel,
  issuer,
  onClose,
}: {
  tenant: TenantRecord | null;
  ledger: TenantLedgerRecord | null;
  financialYearLabel: string;
  issuer: BillIssuer;
  onClose: () => void;
}) {
  const [working, setWorking] = useState<"download" | "share" | "print" | null>(null);
  if (!tenant) return null;

  const statement = ledger ?? {
    tenantId: tenant.id,
    openingBalance: tenant.openingBalance,
    totalDebits: 0,
    totalCredits: 0,
    closingBalance: tenant.openingBalance,
    entries: [],
  };
  const name = fileName(tenant, financialYearLabel);

  async function download() {
    setWorking("download");
    try {
      downloadBlob(await createLedgerPdf(tenant!, statement, financialYearLabel, issuer), name);
      toast.success("Tenant ledger PDF downloaded");
    } catch {
      toast.error("Couldn’t create the ledger PDF. Please try again.");
    } finally {
      setWorking(null);
    }
  }

  async function share() {
    setWorking("share");
    try {
      const blob = await createLedgerPdf(tenant!, statement, financialYearLabel, issuer);
      const file = new File([blob], name, { type: "application/pdf" });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: `${tenant!.name} ledger`, text: financialYearLabel, files: [file] });
      } else {
        downloadBlob(blob, name);
        toast.info("Sharing isn’t supported here, so the PDF was downloaded.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Couldn’t share the tenant ledger.");
    } finally {
      setWorking(null);
    }
  }

  async function print() {
    const printWindow = window.open("about:blank", "_blank");
    if (!printWindow) {
      toast.error("Allow pop-ups to open the printable ledger.");
      return;
    }
    setWorking("print");
    try {
      const blob = await createLedgerPdf(tenant!, statement, financialYearLabel, issuer);
      const url = URL.createObjectURL(blob);
      printWindow.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast.success("Ledger opened for printing");
    } catch {
      printWindow.close();
      toast.error("Couldn’t open the printable ledger.");
    } finally {
      setWorking(null);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[94vh] max-w-[980px] overflow-y-auto p-0">
        <div className="flex flex-col gap-4 border-b border-white/10 bg-[#171717] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <DialogTitle>Tenant ledger</DialogTitle>
            <DialogDescription className="mt-1">Preview, print, download, or share this account statement.</DialogDescription>
          </div>
          <div className="flex flex-wrap gap-2 pr-7 sm:pr-0">
            <Button variant="outline" onClick={share} disabled={working !== null}>
              {working === "share" ? <LoaderCircle className="size-4 animate-spin" /> : <Share2 className="size-4" />} Share
            </Button>
            <Button variant="outline" onClick={print} disabled={working !== null}>
              {working === "print" ? <LoaderCircle className="size-4 animate-spin" /> : <Printer className="size-4" />} Print
            </Button>
            <Button onClick={download} disabled={working !== null}>
              {working === "download" ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />} Download PDF
            </Button>
          </div>
        </div>

        <div className="bg-[#dddcd6] p-3 sm:p-7">
          <article className="font-display mx-auto min-h-[900px] max-w-[820px] bg-[#f7f7f3] px-6 py-9 text-[#121210] shadow-[0_14px_45px_rgba(35,40,55,.12)] sm:px-12 sm:py-12">
            <header className="grid grid-cols-2 items-start gap-6">
              <div className="flex w-fit flex-col items-center gap-2">
                <span className="grid size-20 place-items-center bg-black sm:size-24"><BhadaMark className="size-[calc(100%-8px)] text-[#f7f7f3]" /></span>
                <span className="text-2xl sm:text-3xl">Bhada</span>
              </div>
              <h2 className="text-right text-[clamp(2.2rem,7vw,4.7rem)] font-normal leading-[0.92] tracking-[-0.045em]">TENANT<br />LEDGER</h2>
            </header>

            <section className="mt-9 grid grid-cols-2 gap-6 text-[11px] leading-[1.65] sm:text-sm">
              <div className="min-w-0 break-words">
                <p className="font-bold">ACCOUNT HOLDER</p>
                <p className="mt-1">{tenant.name}</p>
                <p>{tenant.propertyName} · Unit {tenant.unitNumber}</p>
                {tenant.phone && <p>{tenant.phone}</p>}
                {tenant.email && <p>{tenant.email}</p>}
              </div>
              <div className="text-right">
                <p>{financialYearLabel}</p>
                <p className="mt-1 text-black/55">Opening balance {balanceLabel(statement.openingBalance)}</p>
                <p className="font-bold">Closing balance {balanceLabel(statement.closingBalance)}</p>
              </div>
            </section>

            <div className="mt-10 overflow-x-auto">
              <div className="min-w-[690px]">
                <div className="grid grid-cols-[88px_minmax(150px,1fr)_130px_100px_100px_110px] border-y border-black px-2 py-3 text-[11px] font-bold">
                  <span>Date</span><span>Description</span><span>Reference</span><span className="text-right">Debit</span><span className="text-right">Credit</span><span className="text-right">Balance</span>
                </div>
                {statement.entries.map((entry) => (
                  <div key={entry.id} className="grid grid-cols-[88px_minmax(150px,1fr)_130px_100px_100px_110px] items-center border-b border-black/45 px-2 py-3 text-[10px] sm:text-[11px]">
                    <span>{dateLabel(entry.date)}</span><span>{entry.description}</span><span className="truncate text-black/55" title={entry.reference}>{entry.reference}</span><span className="text-right tabular-nums">{entry.debit ? formatCurrency(entry.debit) : "—"}</span><span className="text-right tabular-nums">{entry.credit ? formatCurrency(entry.credit) : "—"}</span><span className="text-right font-bold tabular-nums">{balanceLabel(entry.balance)}</span>
                  </div>
                ))}
                {!statement.entries.length && <p className="border-b border-black/45 px-2 py-10 text-center text-xs text-black/50">No transactions in this financial year.</p>}
              </div>
            </div>

            <div className="ml-auto mt-6 w-full max-w-[310px] text-xs sm:text-sm">
              <SummaryLine label="Period debits" value={formatCurrency(statement.totalDebits)} />
              <SummaryLine label="Period credits" value={formatCurrency(statement.totalCredits)} />
              <div className="mt-2 flex items-center justify-between gap-5 border-t-2 border-black py-4 text-base font-bold sm:text-lg"><span>Closing balance</span><span>{balanceLabel(statement.closingBalance)}</span></div>
            </div>

            <footer className="mt-20 border-t border-black pt-5 text-[10px] text-black/55 sm:text-xs">
              <div className="flex flex-col justify-between gap-2 sm:flex-row"><span>{issuer.businessName || "Bhada Property Management"}</span><span>Generated with bhada</span></div>
            </footer>
          </article>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-5 px-1 py-2.5"><span className="font-bold">{label}</span><span>{value}</span></div>;
}
