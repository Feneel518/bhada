import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BillPaper, type BillIssuer } from "@/components/bill-document";
import { BhadaMark } from "@/components/brand-logo";
import { rupeesInWords } from "@/lib/amount-words";
import { readShareToken } from "@/lib/share-links";
import { getSharedDocument, type SharedReceipt } from "@/lib/shared-documents";
import { formatCurrency } from "@/lib/utils";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bill from your landlord",
  robots: { index: false, follow: false },
};

function longDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(`${value}T12:00:00+05:30`));
}

export default async function SharedDocumentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const target = await readShareToken(token);
  if (!target) notFound();
  const shared = await getSharedDocument(target.kind, target.id);
  if (!shared) notFound();

  return (
    <main className="share-shell min-h-dvh bg-[#dddcd6] px-2 py-4 text-[#121210] sm:px-6 sm:py-10">
      <div className="share-no-print mx-auto mb-4 flex max-w-[720px] flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-black/60">
          {shared.kind === "receipt" ? "Rent receipt" : "Bill"} from <span className="font-semibold text-black">{shared.issuer.businessName}</span>
        </p>
        <PrintButton />
      </div>

      {shared.kind === "bill" ? (
        <BillPaper document={shared.document} issuer={shared.issuer} />
      ) : (
        <ReceiptPaper receipt={shared.receipt} issuer={shared.issuer} />
      )}

      <footer className="share-no-print mx-auto mt-6 max-w-[720px] border-t border-black/15 pt-5 text-center">
        <p className="text-xs text-black/55">
          Sent via <Link href="/?utm_source=share&utm_medium=bill" className="font-semibold text-black underline underline-offset-2">Bhadaa</Link>
          {" · "}Free rent tracking, bills and UPI reminders for landlords.
        </p>
        <Link
          href="/sign-in?utm_source=share&utm_medium=bill"
          className="mt-3 inline-flex h-9 items-center bg-black px-4 text-xs font-semibold text-white"
        >
          Own a rental? Start free
        </Link>
      </footer>
    </main>
  );
}

function ReceiptPaper({ receipt, issuer }: { receipt: SharedReceipt; issuer: BillIssuer }) {
  const issuerAddress = [issuer.address, issuer.city, issuer.state, issuer.pincode].filter(Boolean).join(", ");
  const premises = [`Unit ${receipt.unitNumber}`, receipt.propertyName, receipt.propertyAddress].filter(Boolean).join(", ");
  const purpose = receipt.lines.length
    ? receipt.lines.map((line) => line.label).join(", ")
    : "rent";

  return (
    <article className="font-display mx-auto w-full max-w-[720px] bg-[#f7f7f3] px-5 py-8 shadow-[0_14px_45px_rgba(35,40,55,.12)] sm:px-14 sm:py-14">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col items-center gap-2">
          <span className="grid size-14 place-items-center bg-black sm:size-20">
            <BhadaMark className="size-[calc(100%-8px)] text-[#f7f7f3]" />
          </span>
        </div>
        <div className="text-right">
          <h1 className="text-[clamp(1.75rem,8vw,3.5rem)] leading-[0.95] tracking-[-0.04em]">RENT<br />RECEIPT</h1>
          <p className="mt-3 text-xs sm:text-sm">No. {receipt.receiptNumber}</p>
          <p className="text-xs sm:text-sm">{longDate(receipt.paidAt)}</p>
        </div>
      </header>

      <p className="mt-10 text-sm leading-7 sm:text-base sm:leading-8">
        Received with thanks from <strong>{receipt.tenantName}</strong> the sum of{" "}
        <strong>{formatCurrency(receipt.amount)}</strong> ({rupeesInWords(receipt.amount)}) by {receipt.method.toLowerCase()}
        {receipt.reference ? ` (ref. ${receipt.reference})` : ""} on {longDate(receipt.paidAt)} towards {purpose.toLowerCase()} for the premises at{" "}
        <strong>{premises}</strong>.
      </p>

      {receipt.lines.length > 1 && (
        <div className="mt-8 border-y border-black text-xs sm:text-sm">
          {receipt.lines.map((line, index) => (
            <div key={`${line.label}-${index}`} className="flex justify-between gap-4 border-b border-black/20 px-1 py-2.5 last:border-b-0">
              <span>{line.label}</span>
              <span className="tabular-nums">{formatCurrency(line.amount)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between border-y-2 border-black px-1 py-4">
        <span className="text-lg font-bold sm:text-xl">Amount received</span>
        <span className="text-lg sm:text-2xl">{formatCurrency(receipt.amount)}</span>
      </div>

      <footer className="mt-14 grid gap-8 sm:grid-cols-2 sm:items-end">
        <div className="text-xs leading-6 sm:text-sm">
          <p className="font-bold">LANDLORD</p>
          <p>{issuer.businessName}</p>
          {issuer.pan ? <p>PAN: {issuer.pan}</p> : <p className="text-black/50">PAN not added</p>}
          {issuerAddress && <p className="text-black/70">{issuerAddress}</p>}
          {issuer.phone && <p>{issuer.phone}</p>}
        </div>
        <div className="text-left sm:text-right">
          <div className="h-12 border-b border-black/60 sm:ml-auto sm:w-56" />
          <p className="mt-2 text-xs">Landlord’s signature</p>
        </div>
      </footer>
      <p className="mt-10 text-[10px] leading-4 text-black/45">
        Computer-generated receipt. Tenants claiming HRA can submit this receipt to their employer.
      </p>
    </article>
  );
}
