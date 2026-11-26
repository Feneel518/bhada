"use client";

import { Building2, CreditCard, Users } from "lucide-react";
import type { PaymentRecord } from "@/lib/payments";
import type { PropertyRecord } from "@/lib/properties";
import type { TenantRecord } from "@/lib/tenants";
import { cn, formatCurrency } from "@/lib/utils";

export function DashboardSearchResults({
  id,
  className,
  count,
  results,
  onNavigate,
}: {
  id?: string;
  className?: string;
  count: number;
  results: {
    properties: PropertyRecord[];
    tenants: TenantRecord[];
    payments: PaymentRecord[];
  };
  onNavigate: (section: "Properties" | "Tenants" | "Payments") => void;
}) {
  return (
    <div
      id={id}
      className={cn(
        "z-50 overflow-y-auto border border-white/10 bg-[#181816] p-2 shadow-[0_18px_55px_rgba(0,0,0,.42)]",
        className,
      )}
    >
      {count ? (
        <>
          {results.properties.length > 0 && (
            <SearchResultGroup label="Properties">
              {results.properties.map((property) => (
                <SearchResultButton
                  key={property.id}
                  icon={Building2}
                  title={property.name}
                  description={[property.address, property.city].filter(Boolean).join(", ") || "Property"}
                  onClick={() => onNavigate("Properties")}
                />
              ))}
            </SearchResultGroup>
          )}
          {results.tenants.length > 0 && (
            <SearchResultGroup label="Tenants">
              {results.tenants.map((tenant) => (
                <SearchResultButton
                  key={tenant.id}
                  icon={Users}
                  title={tenant.name}
                  description={`${tenant.propertyName} · Unit ${tenant.unitNumber}`}
                  onClick={() => onNavigate("Tenants")}
                />
              ))}
            </SearchResultGroup>
          )}
          {results.payments.length > 0 && (
            <SearchResultGroup label="Payments">
              {results.payments.map((payment) => (
                <SearchResultButton
                  key={payment.id}
                  icon={CreditCard}
                  title={payment.tenant}
                  description={`${payment.receiptNumber} · ${formatCurrency(payment.amount)} · ${payment.status}`}
                  onClick={() => onNavigate("Payments")}
                />
              ))}
            </SearchResultGroup>
          )}
        </>
      ) : (
        <div className="px-3 py-7 text-center">
          <p className="text-sm font-semibold text-[#edede8]">No results found</p>
          <p className="mt-1 text-xs text-white/40">Try a name, property, unit, or receipt number.</p>
        </div>
      )}
    </div>
  );
}

export function SearchResultGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-1">
      <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">
        {label}
      </p>
      {children}
    </section>
  );
}

export function SearchResultButton({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof Building2;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/[0.06] focus:bg-white/[0.06] focus:outline-none"
    >
      <span className="grid size-8 shrink-0 place-items-center border border-[#e4c77a]/20 bg-[#e4c77a]/[0.07] text-[#e4c77a]">
        <Icon className="size-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-[#edede8]">{title}</span>
        <span className="mt-0.5 block truncate text-[11px] text-white/40">{description}</span>
      </span>
    </button>
  );
}
