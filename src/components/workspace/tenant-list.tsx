"use client";

import { useTransition } from "react";
import { ArrowUpRight, MessageCircle, Eye, LoaderCircle, Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteTenant } from "@/app/dashboard/tenants/actions";
import type { TenantRecord } from "@/lib/tenants";
import { cn, formatCurrency } from "@/lib/utils";
import { formatInr } from "@/components/workspace/shared";

export function TenantList({
  tenants,
  onAdd,
  onEdit,
  onView,
  remindHref,
}: {
  tenants: TenantRecord[];
  remindHref?: (tenant: TenantRecord) => string | null;
  onAdd: () => void;
  onEdit: (tenant: TenantRecord) => void;
  onView: (tenant: TenantRecord) => void;
}) {
  if (!tenants.length) {
    return (
      <div className="grid min-h-[360px] place-items-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
        <div>
          <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-[#e4c77a]/25 bg-[#e4c77a]/[0.08] text-[#e4c77a]"><Users className="size-6" /></span>
          <h2 className="mt-5 font-display text-lg font-bold text-white/75">No tenants found</h2>
          <p className="mt-2 text-sm text-white/40">Add a tenant or clear your search to see tenant records.</p>
          <Button className="mt-5" onClick={onAdd}><Plus className="size-4" /> Add tenant</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {tenants.map((item) => (
        <TenantCard key={item.id} tenant={item} onEdit={onEdit} onView={onView} remindHref={remindHref?.(item) ?? null} />
      ))}
    </div>
  );
}

export function TenantCard({
  tenant: item,
  onEdit,
  onView,
  remindHref = null,
}: {
  tenant: TenantRecord;
  remindHref?: string | null;
  onEdit: (tenant: TenantRecord) => void;
  onView: (tenant: TenantRecord) => void;
}) {
  const [deleting, startDeleteTransition] = useTransition();

  function remove() {
    if (!window.confirm(`Delete ${item.name}? Related leases and payments will also be deleted.`)) return;
    startDeleteTransition(async () => {
      const result = await deleteTenant(item.id);
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <article className="rounded-[20px] border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#e4c77a]/25 bg-[#e4c77a]/[0.08] text-sm font-extrabold text-[#e4c77a]">
          {item.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-display text-lg font-bold text-white/75">{item.name}</h2>
            <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-bold", item.isActive ? "border-[#7aa18b]/30 bg-[#7aa18b]/10 text-[#9bc4ab]" : "border-white/10 bg-white/[0.04] text-white/45")}>
              {item.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-white/40">
            {item.propertyName} · Unit {item.unitNumber}
          </p>
        </div>
        <button type="button" onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`} className="grid size-8 place-items-center rounded-lg text-white/35 hover:bg-white/[0.05] hover:text-[#e4c77a]">
          <Pencil className="size-4" />
        </button>
        <button type="button" onClick={remove} disabled={deleting} aria-label={`Delete ${item.name}`} className="grid size-8 place-items-center rounded-lg text-[#c96a4e]/55 hover:bg-[#c96a4e]/10 hover:text-[#c96a4e] disabled:opacity-50">
          {deleting ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        </button>
      </div>
      <div className="mt-5 grid gap-3 border-t border-white/[0.07] pt-4 text-xs text-white/40 sm:grid-cols-2">
        <p className="truncate"><span className="font-bold text-white/60">Email:</span> {item.email || "Not provided"}</p>
        <p className="truncate"><span className="font-bold text-white/60">Phone:</span> {item.phone || "Not provided"}</p>
        <p><span className="font-bold text-white/60">Lease:</span> {item.leaseStart || "—"} to {item.leaseEnd || "—"}</p>
        <p><span className="font-bold text-white/60">Monthly rent:</span> {item.monthlyRent === null ? "—" : formatInr(item.monthlyRent)}</p>
        <p><span className="font-bold text-white/60">Billing:</span> Day {item.rentBillingDay} · due day {item.rentDueDay}</p>
        <p>
          <span className="font-bold text-white/60">Tax on rent:</span>{" "}
          {item.gstEnabled
            ? `${item.gstRate}% GST on ${item.gstTaxablePercent}% of rent`
            : "No GST"}
          {" · "}
          {item.tdsEnabled ? `${item.tdsRate}% TDS` : "No TDS"}
        </p>
        <p><span className="font-bold text-white/60">Opening balance:</span> {formatCurrency(item.openingBalance)}</p>
        <p><span className="font-bold text-white/60">Deposit:</span> {item.securityDeposit === null ? "—" : formatInr(item.securityDeposit)}</p>
      </div>
      {remindHref && (
        <a
          href={remindHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex h-11 w-full items-center justify-center gap-2 border border-[#e4c77a]/40 bg-[#e4c77a]/[0.06] text-xs font-semibold text-[#e4c77a] hover:bg-[#e4c77a]/[0.12]"
        >
          <MessageCircle className="size-4" /> Remind on WhatsApp
        </a>
      )}
      <button
        type="button"
        onClick={() => onView(item)}
        className="group mt-5 flex h-11 w-full items-center justify-between border border-white/10 bg-white/[0.018] px-4 text-xs font-semibold tracking-[0.01em] text-white/55 transition-[border-color,background-color,color] hover:border-[#e4c77a]/55 hover:bg-[#e4c77a]/[0.06] hover:text-[#e4c77a]"
      >
        <span className="flex items-center gap-2.5">
          <Eye className="size-4 text-white/40 transition-colors group-hover:text-[#e4c77a]" />
          View analytics
        </span>
        <ArrowUpRight className="size-4 text-white/25 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#e4c77a]" />
      </button>
    </article>
  );
}
