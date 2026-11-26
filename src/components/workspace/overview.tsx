"use client";

import dynamic from "next/dynamic";
import { ArrowUpRight, Building2, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-controls";
import type { IncomeOverviewPoint } from "@/lib/dashboard-analytics";
import type { PaymentRecord } from "@/lib/payments";
import type { RentBillingSummary } from "@/lib/rent-billing";
import type { PropertyRecord } from "@/lib/properties";
import { formatCurrency } from "@/lib/utils";
import styles from "@/components/dashboard.module.css";
import { Badge } from "@/components/ui/badge";
import { filterIncomePeriod } from "@/lib/income-period";
import { PaymentTable } from "@/components/workspace/payment-table";
import { propertyColor } from "@/components/workspace/shared";

export const LineChart = dynamic(() => import("@/components/ui/line-chart").then((module) => module.LineChart));

export function Overview({
  period,
  setPeriod,
  payments: rows,
  rentBilling,
  properties,
  totalProperties,
  incomeOverview,
  onAddProperty,
  onRecordPayment,
  onViewPayments,
  onViewProperties,
  firstName,
}: {
  period: string;
  setPeriod: (value: string) => void;
  payments: PaymentRecord[];
  rentBilling: RentBillingSummary;
  properties: PropertyRecord[];
  totalProperties: number;
  incomeOverview: IncomeOverviewPoint[];
  onAddProperty: () => void;
  onRecordPayment: () => void;
  onViewPayments: () => void;
  onViewProperties: () => void;
  firstName: string;
}) {
  const todayLabel = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const hour = Number(
    new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date()),
  );
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end sm:gap-5">
        <div>
          <p className="mb-1 text-xs font-medium text-[#888e9d] sm:text-sm">{todayLabel}</p>
          <h1 className="font-display text-[27px] leading-tight tracking-[-0.045em] text-[#222836] sm:text-[34px]">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1.5 text-[13px] text-[#747b8b] sm:text-sm">A clear view of your rent, all in one place.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button variant="outline" onClick={onAddProperty}><Plus data-icon="inline-start" />Set up rental</Button>
          <Button onClick={onRecordPayment}><Plus data-icon="inline-start" />Record payment</Button>
        </div>
      </div>

      <section className={styles.rentSummary} aria-label="This month's rent summary">
        <div className={styles.collectionHeadline}>
          <div><p>Rent collected / {rentBilling.periodLabel}</p><h2>{formatCurrency(rentBilling.paidThisMonth)}</h2></div>
          <Badge variant="secondary">{rentBilling.collectionRate}% collected</Badge>
        </div>
        <div className={styles.collectionTrack} role="progressbar" aria-label="Rent collected" aria-valuenow={Math.min(100, Math.max(0, rentBilling.collectionRate))} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${Math.min(100, Math.max(0, rentBilling.collectionRate))}%` }} />
        </div>
        <div className={styles.rentSummaryDetails}>
          <div><span>Billed this month</span><strong>{formatCurrency(rentBilling.billedThisMonth)}</strong></div>
          <div><span>Total pending</span><strong>{formatCurrency(rentBilling.pendingTotal)}</strong></div>
          <div><span>Properties</span><strong>{totalProperties}</strong></div>
        </div>
        <Button variant="ghost" onClick={onViewPayments} className="mt-4 w-full justify-between">
          {rentBilling.overdueCount ? `${rentBilling.overdueCount} overdue bill${rentBilling.overdueCount === 1 ? "" : "s"} to review` : "View bills and payments"}<ArrowUpRight data-icon="inline-end" />
        </Button>
      </section>

      <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <PaymentTable rows={rows} onViewAll={onViewPayments} />
        <section className="min-w-0 overflow-hidden rounded-[20px] border border-[#e7e9ef] bg-white p-5 shadow-[0_1px_2px_rgba(25,29,41,.02)] sm:p-6">
          <div className="flex flex-col gap-3 min-[380px]:flex-row min-[380px]:items-start min-[380px]:justify-between min-[380px]:gap-4">
            <div>
              <h2 className="font-display text-base font-bold tracking-[-0.025em]">Income overview</h2>
              <p className="mt-1 text-xs text-[#8b91a0]">Rent collected across all properties</p>
            </div>
            <FormSelect
              value={period}
              onValueChange={setPeriod}
              className="h-9 w-full rounded-lg border-[#e3e5ec] bg-white px-3 text-xs font-semibold text-[#5f6676] min-[380px]:w-[132px]"
              options={[
                { value: "This year", label: "This year" },
                { value: "Last 6 months", label: "Last 6 months" },
                { value: "This quarter", label: "This quarter" },
              ]}
            />
          </div>
          <IncomeChart period={period} data={incomeOverview} />
        </section>

      </div>

      <div className="mt-4">
        <PropertyList properties={properties} onAdd={onAddProperty} onViewAll={onViewProperties} />
      </div>
    </>
  );
}

export function IncomeChart({
  period,
  data,
}: {
  period: string;
  data: IncomeOverviewPoint[];
}) {
  const visibleData = filterIncomePeriod(data, period);
  return <LineChart key={period} data={visibleData} />;
}

export function PropertyList({
  properties,
  onAdd,
  onViewAll,
}: {
  properties: PropertyRecord[];
  onAdd: () => void;
  onViewAll: () => void;
}) {
  return (
    <section className="rounded-[20px] border border-[#e7e9ef] bg-white p-5 shadow-[0_1px_2px_rgba(25,29,41,.02)] sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-bold tracking-[-0.025em]">Properties</h2>
          <p className="mt-1 text-xs text-[#8b91a0]">Your active portfolio</p>
        </div>
        <button onClick={onAdd} className="grid size-8 place-items-center rounded-lg border border-[#e4e6ed] text-[#6f7686] hover:bg-[#f7f7fa]"><Plus className="size-4" /></button>
      </div>
      <div className="mt-3 divide-y divide-white/[0.075]">
        {properties.slice(0, 3).map((property) => (
          <div key={property.id} className="flex items-center gap-3 py-3.5">
            <span
              className="grid size-10 place-items-center rounded-xl border"
              style={propertyColor(property.id)}
            >
              <Building2 className="size-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-[#343a48]">{property.name}</p>
              <p className="mt-0.5 truncate text-[10px] text-[#969cab]">{property.city}{property.state ? `, ${property.state}` : ""}</p>
            </div>
            <MapPin className="size-4 shrink-0 text-[#a0a5b2]" />
          </div>
        ))}
        {!properties.length && (
          <div className="py-8 text-center text-xs text-[#8b91a0]">
            No properties yet. Add your first one to get started.
          </div>
        )}
      </div>
      <button onClick={onViewAll} className="mt-3 w-full rounded-xl bg-[#f7f7fb] py-2.5 text-xs font-bold text-[#5d6474] hover:bg-[#f0f1f6]">View all properties</button>
    </section>
  );
}
