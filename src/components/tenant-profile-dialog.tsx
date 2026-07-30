"use client";

import { CalendarDays, CircleDollarSign, FileText, Mail, Phone, ReceiptText, WalletCards, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { ElectricityBillRecord } from "@/lib/electricity-billing";
import { formatBillingMonth } from "@/lib/financial-year";
import type { PaymentRecord } from "@/lib/payments";
import type { RentBillingSummary } from "@/lib/rent-billing";
import type { TenantAnalytics } from "@/lib/tenant-analytics";
import type { TenantRecord } from "@/lib/tenants";
import { cn, formatCurrency } from "@/lib/utils";

function dateLabel(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(`${value}T00:00:00+05:30`));
}

export function TenantProfileDialog({
  tenant,
  analytics,
  payments,
  rentBills,
  electricityBills,
  financialYearLabel,
  onClose,
}: {
  tenant: TenantRecord | null;
  analytics: TenantAnalytics | null;
  payments: PaymentRecord[];
  rentBills: RentBillingSummary["bills"];
  electricityBills: ElectricityBillRecord[];
  financialYearLabel: string;
  onClose: () => void;
}) {
  if (!tenant) return null;
  const tenantPayments = payments.filter((item) => item.tenantId === tenant.id);
  const tenantRentBills = rentBills.filter((item) => item.tenantId === tenant.id);
  const tenantElectricityBills = electricityBills.filter((item) => item.tenantId === tenant.id);
  const balanceStatus = analytics?.balanceStatus ?? "Paid";
  const balance = balanceStatus === "Overpaid"
    ? analytics?.totalOverpaid ?? 0
    : analytics?.totalPending ?? 0;
  const initials = tenant.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[94vh] max-w-[1080px] overflow-y-auto border-white/10 bg-[#111111] p-0 text-[#edede8] shadow-[0_24px_72px_rgba(0,0,0,.55)]">
        <div className="border-b border-white/10 bg-[#171717] px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex items-start gap-4 pr-8">
            <span className="grid size-14 shrink-0 place-items-center border border-[#e4c77a]/35 bg-[#e4c77a]/[0.07] text-sm font-semibold tracking-[0.08em] text-[#e4c77a]">{initials}</span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="font-display text-xl font-medium tracking-[-0.03em] text-[#edede8] sm:text-2xl">{tenant.name}</DialogTitle>
                <span className={cn("border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em]", tenant.isActive ? "border-[#7aa18b]/30 bg-[#7aa18b]/10 text-[#9bc4ab]" : "border-white/10 bg-white/[0.04] text-white/45")}>{tenant.isActive ? "Active tenant" : "Inactive"}</span>
              </div>
              <DialogDescription className="mt-1.5 text-sm text-white/40">{tenant.propertyName} · Unit {tenant.unitNumber} · Financial profile</DialogDescription>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-white/45">
                <span className="flex items-center gap-1.5"><Mail className="size-3.5" />{tenant.email || "No email"}</span>
                <span className="flex items-center gap-1.5"><Phone className="size-3.5" />{tenant.phone || "No phone"}</span>
                <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" />{dateLabel(tenant.leaseStart)} – {dateLabel(tenant.leaseEnd)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ProfileMetric icon={CircleDollarSign} label="Total paid" value={formatCurrency(analytics?.totalPaid ?? 0)} note={`${analytics?.paymentCount ?? 0} payment${analytics?.paymentCount === 1 ? "" : "s"} received`} tone="green" />
            <ProfileMetric
              icon={WalletCards}
              label={balanceStatus === "Overpaid" ? "Overpaid" : balanceStatus === "Pending" ? "Total pending" : "Balance"}
              value={formatCurrency(balance)}
              note={
                balanceStatus === "Overpaid"
                  ? "Credit after rent and electricity bills"
                  : balanceStatus === "Pending"
                    ? "Rent and electricity dues"
                    : "Fully reconciled"
              }
              tone={balanceStatus === "Pending" ? "orange" : "green"}
            />
            <ProfileMetric icon={ReceiptText} label="Lifetime billed" value={formatCurrency(analytics?.totalBilled ?? 0)} note="Includes opening balance" tone="indigo" />
            <ProfileMetric icon={FileText} label="Collection rate" value={`${analytics?.collectionRate ?? 0}%`} note={analytics?.lastPaymentDate ? `Last paid ${dateLabel(analytics.lastPaymentDate)}` : "No payments recorded"} tone="pink" />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <section className="border border-white/10 bg-[#171717] p-5">
              <div>
                <h3 className="font-display text-base font-medium text-[#edede8]">Balance breakdown</h3>
                <p className="mt-1 text-xs text-white/35">Lifetime charges and allocations</p>
              </div>
              <div className="mt-5 space-y-5">
                <BalanceBar label="Rent" icon={FileText} billed={analytics?.rentBilled ?? 0} paid={analytics?.rentPaid ?? 0} pending={analytics?.rentPending ?? 0} color="#e4c77a" />
                <BalanceBar label="Electricity" icon={Zap} billed={analytics?.electricityBilled ?? 0} paid={analytics?.electricityPaid ?? 0} pending={analytics?.electricityPending ?? 0} color="#dda676" />
              </div>
              <dl className="mt-6 grid gap-3 border-t border-white/[0.08] pt-5 text-xs sm:grid-cols-3">
                <Detail label="Monthly rent" value={tenant.monthlyRent === null ? "—" : formatCurrency(tenant.monthlyRent)} />
                <Detail label="Security deposit" value={tenant.securityDeposit === null ? "—" : formatCurrency(tenant.securityDeposit)} />
                <Detail label="Credit balance" value={formatCurrency(tenant.creditBalance)} />
                <Detail label="Billing day" value={`Day ${tenant.rentBillingDay}`} />
                <Detail label="Rent due day" value={`Day ${tenant.rentDueDay}`} />
                <Detail
                  label="GST on rent"
                  value={
                    tenant.gstEnabled
                      ? `${tenant.gstRate}% on ${tenant.gstTaxablePercent}% of rent`
                      : "Not applied"
                  }
                />
                <Detail label="TDS" value={tenant.tdsEnabled ? `${tenant.tdsRate}%` : "Not applied"} />
              </dl>
            </section>

            <section className="overflow-hidden border border-white/10 bg-[#171717]">
              <div className="px-5 py-4">
                <h3 className="font-display text-base font-medium text-[#edede8]">Payment history</h3>
                <p className="mt-1 text-xs text-white/35">All recorded receipts</p>
              </div>
              <div className="max-h-[330px] divide-y divide-white/[0.08] overflow-y-auto">
                {tenantPayments.length ? tenantPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="grid size-9 shrink-0 place-items-center border border-[#7aa18b]/25 bg-[#7aa18b]/10 text-[#9bc4ab]"><CircleDollarSign className="size-4" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-[#edede8]">{payment.receiptNumber}</p>
                      <p className="mt-0.5 text-[10px] text-white/35">{payment.date} · {payment.summary}</p>
                    </div>
                    <p className="text-xs font-semibold text-[#9bc4ab]">{formatCurrency(payment.amount)}</p>
                  </div>
                )) : <EmptyRow text="No payments recorded for this tenant." />}
              </div>
            </section>
          </div>

          <section className="overflow-hidden border border-white/10 bg-[#171717]">
            <div className="flex flex-col gap-1 border-b border-white/[0.08] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display text-base font-medium text-[#edede8]">Bill history</h3>
                <p className="mt-1 text-xs text-white/35">Rent and electricity bills in {financialYearLabel}</p>
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/35">{tenantRentBills.length + tenantElectricityBills.length} bills</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead><tr className="bg-white/[0.025] text-[9px] uppercase tracking-[0.12em] text-white/30"><th className="px-5 py-3">Bill</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Month</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Pending</th><th className="px-4 py-3">Status</th></tr></thead>
                <tbody>
                  {[...tenantRentBills.map((bill) => ({ ...bill, type: "Rent" })), ...tenantElectricityBills.map((bill) => ({ ...bill, type: "Electricity" }))]
                    .sort((a, b) => b.billingPeriod.localeCompare(a.billingPeriod))
                    .map((bill) => (
                      <tr key={`${bill.type}-${bill.id}`} className="border-t border-white/[0.07] text-xs text-white/65 transition-colors hover:bg-white/[0.02]">
                        <td className="px-5 py-3 font-semibold text-[#edede8]">{bill.billNumber}</td>
                        <td className="px-4 py-3 text-white/45">{bill.type}</td>
                        <td className="px-4 py-3 text-white/45">{formatBillingMonth(bill.billingPeriod)}</td>
                        <td className="px-4 py-3 font-medium text-[#edede8]">{formatCurrency(bill.amount)}</td>
                        <td className="px-4 py-3 font-medium text-[#dda676]">{formatCurrency(bill.pending)}</td>
                        <td className="px-4 py-3"><span className={cn("inline-flex border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em]", bill.status === "Paid" ? "border-[#7aa18b]/30 bg-[#7aa18b]/10 text-[#9bc4ab]" : bill.status === "Overdue" ? "border-[#c96a4e]/30 bg-[#c96a4e]/10 text-[#df8a70]" : "border-[#e4c77a]/30 bg-[#e4c77a]/10 text-[#e4c77a]")}>{bill.status}</span></td>
                      </tr>
                    ))}
                  {!tenantRentBills.length && !tenantElectricityBills.length && <tr><td colSpan={6}><EmptyRow text={`No bills found in ${financialYearLabel}.`} /></td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProfileMetric({ icon: Icon, label, value, note, tone }: { icon: typeof CircleDollarSign; label: string; value: string; note: string; tone: "green" | "orange" | "indigo" | "pink" }) {
  const tones = {
    green: "border-[#7aa18b]/25 bg-[#7aa18b]/10 text-[#9bc4ab]",
    orange: "border-[#c99162]/25 bg-[#c99162]/10 text-[#dda676]",
    indigo: "border-[#e4c77a]/25 bg-[#e4c77a]/10 text-[#e4c77a]",
    pink: "border-[#b77f96]/25 bg-[#b77f96]/10 text-[#d29bb2]",
  };
  return (
    <article className="border border-white/10 bg-[#171717] p-4">
      <span className={cn("grid size-9 place-items-center border", tones[tone])}><Icon className="size-4" /></span>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35">{label}</p>
      <p className="mt-1 font-display text-xl font-medium tracking-[-0.04em] text-[#edede8]">{value}</p>
      <p className="mt-2 text-[10px] text-white/30">{note}</p>
    </article>
  );
}

function BalanceBar({ label, icon: Icon, billed, paid, pending, color }: { label: string; icon: typeof FileText; billed: number; paid: number; pending: number; color: string }) {
  const percent = billed > 0 ? Math.min(100, (paid / billed) * 100) : 0;
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon className="size-4" style={{ color }} />
        <span className="text-xs font-semibold text-[#edede8]">{label}</span>
        <span className="ml-auto text-[10px] text-white/35">{percent.toFixed(0)}% collected</span>
      </div>
      <div className="mt-2 h-1 overflow-hidden bg-white/[0.08]">
        <div className="h-full" style={{ width: `${percent}%`, backgroundColor: color }} />
      </div>
      <div className="mt-2 grid grid-cols-3 text-[10px] text-white/35">
        <span>Billed <b className="block text-xs font-semibold text-white/65">{formatCurrency(billed)}</b></span>
        <span className="text-center">Paid <b className="block text-xs font-semibold text-[#9bc4ab]">{formatCurrency(paid)}</b></span>
        <span className="text-right">Pending <b className="block text-xs font-semibold text-[#dda676]">{formatCurrency(pending)}</b></span>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[10px] text-white/30">{label}</dt><dd className="mt-1 font-semibold text-white/65">{value}</dd></div>;
}

function EmptyRow({ text }: { text: string }) {
  return <div className="px-5 py-10 text-center text-xs text-white/35">{text}</div>;
}
