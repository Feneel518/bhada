import Link from "next/link";
import { CheckCircle2, Clock3, FileText, MessageCircle, ReceiptText, XCircle } from "lucide-react";
import { BhadaMark } from "@/components/brand-logo";
import { UpiPayCard } from "@/components/upi-pay-card";
import { ClaimForm } from "@/components/tenant-portal/claim-form";
import { MeterReadingForm } from "@/components/tenant-portal/meter-reading-form";
import { formatBillingMonth, formatElectricityReadingDate } from "@/lib/financial-year";
import { shareKey } from "@/lib/share-keys";
import type { TenantPortal } from "@/lib/tenant-portal";
import { upiPayLink } from "@/lib/upi";
import { formatCurrency } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })
    .format(new Date(`${value}T12:00:00+05:30`));
}

const statusTone: Record<string, string> = {
  Paid: "text-[#2f7d5b]",
  Pending: "text-black/60",
  Overdue: "text-[#b3402a]",
};

const methodLabels: Record<string, string> = { upi: "UPI", bank_transfer: "Bank transfer", cash: "Cash", check: "Cheque" };

export function TenantPortalView({ portal }: { portal: TenantPortal }) {
  const { tenant, landlord } = portal;
  const firstName = tenant.name.trim().split(/\s+/)[0] || tenant.name;
  const pendingClaims = portal.claims.filter((claim) => claim.status === "pending");
  const claimedTotal = pendingClaims.reduce((sum, claim) => sum + claim.amount, 0);
  const owes = portal.outstanding > 0.005;
  // While a claim waits for confirmation, don't ask the tenant to pay it again.
  const stillToPay = Math.max(0, portal.outstanding - claimedTotal);
  const unpaidBills = [
    ...portal.rentBills.map((bill) => ({ kind: "rent" as const, bill })),
    ...portal.electricityBills.map((bill) => ({ kind: "electricity" as const, bill })),
  ].filter((item) => item.bill.pending > 0.005).sort((a, b) => a.bill.dueDate.localeCompare(b.bill.dueDate));
  const nextDue = unpaidBills[0]?.bill;
  const overdue = unpaidBills.some((item) => item.bill.status === "Overdue");
  const payLink = landlord.upiId && stillToPay > 0.005
    ? upiPayLink({ upiId: landlord.upiId, payeeName: landlord.businessName, amount: stillToPay, note: `Rent ${tenant.propertyName} ${tenant.unitNumber}` })
    : null;
  // Readings newer than the last approved one: what's waiting, or what was sent back.
  const meterNotices = [];
  for (const item of portal.meter.submissions) {
    if (item.status === "approved") break;
    meterNotices.push(item);
    if (meterNotices.length === 2) break;
  }
  const bills = [
    ...portal.rentBills.map((bill) => ({ kind: "rent" as const, id: bill.id, label: `Rent · ${formatBillingMonth(bill.billingPeriod)}`, bill })),
    ...portal.electricityBills.map((bill) => ({ kind: "electricity" as const, id: bill.id, label: `Electricity · ${formatElectricityReadingDate(bill.billingPeriod)}`, bill })),
  ].sort((a, b) => b.bill.dueDate.localeCompare(a.bill.dueDate));

  return (
    <main className="share-shell min-h-dvh bg-[#ecebe6] pb-12 text-[#121210]">
      <header className="bg-[#121210] px-5 pb-6 pt-5 text-[#f7f7f3]">
        <div className="mx-auto max-w-[560px]">
          <div className="flex items-center gap-2 text-xs text-white/55">
            <BhadaMark className="size-6 text-white/70" /> {landlord.businessName}
          </div>
          <h1 className="mt-5 text-2xl font-semibold">Hi {firstName}</h1>
          <p className="mt-1 text-sm text-white/60">
            {tenant.propertyName} · Unit {tenant.unitNumber}
            {tenant.propertyAddress ? ` · ${tenant.propertyAddress}` : ""}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[560px] space-y-4 px-3 pt-4 sm:px-0">
        <section aria-label="Your balance" className="bg-[#f7f7f3] p-5 shadow-[0_6px_24px_rgba(0,0,0,.06)]">
          {owes ? (
            <>
              <p className="text-sm text-black/60">{overdue ? "Overdue" : "Amount due"}</p>
              <p className={`mt-1 text-4xl font-semibold tabular-nums ${overdue ? "text-[#b3402a]" : ""}`}>{formatCurrency(portal.outstanding)}</p>
              {nextDue && <p className="mt-1 text-sm text-black/60">{overdue ? "Was due" : "Due"} {shortDate(nextDue.dueDate)}</p>}
            </>
          ) : (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-9 text-[#2f7d5b]" />
              <div>
                <p className="text-xl font-semibold">All paid up</p>
                <p className="text-sm text-black/60">Nothing due right now. Thank you!</p>
              </div>
            </div>
          )}

          {pendingClaims.length > 0 && (
            <p className="mt-4 flex items-start gap-2 border border-[#c9a74a]/50 bg-[#fbf4df] p-3 text-sm text-[#6b5414]">
              <Clock3 className="mt-0.5 size-4 shrink-0" />
              You told {landlord.businessName} you paid {formatCurrency(claimedTotal)}. Waiting for them to confirm.
            </p>
          )}

          {payLink && landlord.upiId && (
            <div className="mt-4">
              <UpiPayCard link={payLink} upiId={landlord.upiId} amount={stillToPay} />
            </div>
          )}

          {tenant.isActive && (
            <div className="mt-4">
              <ClaimForm token={portal.token} suggestedAmount={stillToPay} landlordName={landlord.businessName} />
            </div>
          )}
        </section>

        {portal.claims.some((claim) => claim.status !== "pending") && (
          <section aria-label="Your recent updates" className="bg-[#f7f7f3] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-black/55">Recent updates</h2>
            <ul className="mt-3 space-y-3">
              {portal.claims.filter((claim) => claim.status !== "pending").map((claim) => (
                <li key={claim.id} className="flex items-start gap-3 text-sm">
                  {claim.status === "confirmed"
                    ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#2f7d5b]" />
                    : <XCircle className="mt-0.5 size-4 shrink-0 text-[#b3402a]" />}
                  <span>
                    {formatCurrency(claim.amount)} by {methodLabels[claim.method] ?? claim.method} on {shortDate(claim.paidOn)}:{" "}
                    {claim.status === "confirmed" ? "confirmed" : `not received yet${claim.reviewNote ? ` (“${claim.reviewNote}”)` : ""}`}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {portal.meter.lastReading !== null && (
          <section aria-label="Electricity meter" className="bg-[#f7f7f3] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-black/55">Electricity meter</h2>
            <p className="mt-2 text-sm">
              Last reading <strong className="tabular-nums">{portal.meter.lastReading.toLocaleString("en-IN", { maximumFractionDigits: 3 })}</strong>
              {portal.meter.lastReadingDate ? ` on ${shortDate(portal.meter.lastReadingDate)}` : ""}
              {portal.meter.rate ? ` · ${formatCurrency(portal.meter.rate)} per unit` : ""}
            </p>
            {meterNotices.map((item) => (
              <p
                key={item.id}
                className={item.status === "pending"
                  ? "mt-3 flex items-start gap-2 border border-[#c9a74a]/50 bg-[#fbf4df] p-3 text-sm text-[#6b5414]"
                  : "mt-3 flex items-start gap-2 border border-[#b3402a]/30 bg-[#fbecea] p-3 text-sm text-[#7a2a1c]"}
              >
                {item.status === "pending" ? <Clock3 className="mt-0.5 size-4 shrink-0" /> : <XCircle className="mt-0.5 size-4 shrink-0" />}
                {item.status === "pending"
                  ? `You sent ${item.reading} on ${shortDate(item.readingDate)}. Waiting for ${landlord.businessName} to approve.`
                  : `${landlord.businessName} sent back your reading of ${item.reading}${item.reviewNote ? `: “${item.reviewNote}”.` : "."} Please enter it again.`}
              </p>
            ))}
            {tenant.isActive && !portal.meter.submissions.some((item) => item.status === "pending") && (
              <div className="mt-4">
                <MeterReadingForm
                  token={portal.token}
                  lastReading={portal.meter.lastReading}
                  rate={portal.meter.rate}
                  landlordName={landlord.businessName}
                />
              </div>
            )}
          </section>
        )}

        <section aria-label="Your bills" className="bg-[#f7f7f3] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-black/55">Bills this year</h2>
          {bills.length ? (
            <ul className="mt-2 divide-y divide-black/10">
              {bills.map((item) => {
                const href = portal.shareLinks[shareKey(item.kind, item.id)];
                return (
                  <li key={`${item.kind}-${item.id}`} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.label}</p>
                      <p className={`text-xs ${statusTone[item.bill.status] ?? "text-black/60"}`}>
                        {item.bill.status === "Paid" ? "Paid" : `${item.bill.status} · ${formatCurrency(item.bill.pending)} left`} · due {shortDate(item.bill.dueDate)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm tabular-nums">{formatCurrency(item.bill.amount)}</span>
                      {href && (
                        <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2">
                          <FileText className="size-3.5" /> View
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-black/55">No bills yet this year.</p>
          )}
        </section>

        <section aria-label="Your payments" className="bg-[#f7f7f3] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-black/55">Payments and receipts</h2>
          {portal.payments.length ? (
            <ul className="mt-2 divide-y divide-black/10">
              {portal.payments.map((payment) => {
                const href = portal.shareLinks[shareKey("receipt", payment.id)];
                return (
                  <li key={payment.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium tabular-nums">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-black/55">{payment.date}</p>
                    </div>
                    {href && (
                      <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2">
                        <ReceiptText className="size-3.5" /> Receipt
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-black/55">Payments your landlord confirms will show here with a receipt you can use for HRA.</p>
          )}
        </section>

        {landlord.phone && (
          <a
            href={whatsappLink(landlord.phone, `Hi, this is ${tenant.name} from ${tenant.propertyName}, Unit ${tenant.unitNumber}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center gap-2 border border-black/25 bg-[#f7f7f3] text-sm font-semibold"
          >
            <MessageCircle className="size-4" /> Message {landlord.businessName}
          </a>
        )}

        <p className="px-2 pt-2 text-center text-xs leading-5 text-black/50">
          This page is private to you. Keep the link to yourself, and bookmark it or add it to your home screen.
          <br />
          Powered by <Link href="/?utm_source=tenant_portal" className="font-semibold text-black underline underline-offset-2">Bhadaa</Link>. Own a rental?{" "}
          <Link href="/sign-in?utm_source=tenant_portal" className="font-semibold text-black underline underline-offset-2">Start free</Link>
        </p>
      </div>
    </main>
  );
}
