import type { BillIssuer } from "@/components/bill-document";
import { BhadaMark } from "@/components/brand-logo";
import { rupeesInWords } from "@/lib/amount-words";
import type { SharedReceipt } from "@/lib/shared-documents";
import { formatCurrency } from "@/lib/utils";

function longDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(`${value}T12:00:00+05:30`));
}

export function ReceiptPaper({ receipt, issuer }: { receipt: SharedReceipt; issuer: BillIssuer }) {
  const issuerAddress = [issuer.address, issuer.city, issuer.state, issuer.pincode].filter(Boolean).join(", ");
  const premises = [`Unit ${receipt.unitNumber}`, receipt.propertyName, receipt.propertyAddress].filter(Boolean).join(", ");
  // "Rent for Nov 2026" reads as "rent for Nov 2026" mid-sentence; keep the rest as entered.
  const purpose = receipt.lines.length
    ? receipt.lines.map((line) => line.label.charAt(0).toLowerCase() + line.label.slice(1)).join(", ")
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
        <strong>{formatCurrency(receipt.amount)}</strong> ({rupeesInWords(receipt.amount)}) by {receipt.method}
        {receipt.reference ? ` (ref. ${receipt.reference})` : ""} on {longDate(receipt.paidAt)} towards {purpose}, for the premises at{" "}
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
