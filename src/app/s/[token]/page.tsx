import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BillPaper } from "@/components/bill-document";
import { ReceiptPaper } from "@/components/receipt-paper";
import { readShareToken } from "@/lib/share-links";
import { getSharedDocument } from "@/lib/shared-documents";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bill from your landlord",
  robots: { index: false, follow: false },
};

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
