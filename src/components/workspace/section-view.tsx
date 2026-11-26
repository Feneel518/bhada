"use client";

import { Building2, Download, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-controls";
import type { PaymentRecord } from "@/lib/payments";
import type { RentBillingSummary } from "@/lib/rent-billing";
import type { ElectricityBillRecord } from "@/lib/electricity-billing";
import { type FinancialYearOption } from "@/lib/financial-year";
import type { PropertyRecord, UnitRecord } from "@/lib/properties";
import type { TenantRecord } from "@/lib/tenants";
import { PaymentTable } from "@/components/workspace/payment-table";
import { ElectricityBillTable, RentBillTable } from "@/components/workspace/bill-tables";
import { TenantList } from "@/components/workspace/tenant-list";
import { PropertyCard } from "@/components/workspace/property-card";

export function SectionView({
  section,
  payments: rows,
  focusedPaymentId,
  rentBilling,
  electricityBills,
  financialYearStart,
  financialYearOptions,
  properties,
  tenants,
  portfolioActive,
  allowedPropertyIds,
  onAddProperty,
  onEditProperty,
  onAddUnit,
  onEditUnit,
  onRecordPayment,
  onAddElectricityBill,
  onAddTenant,
  onEditTenant,
  onViewTenant,
  onViewRentBill,
  onViewElectricityBill,
  remindHref,
  onImport,
}: {
  section: string;
  payments: PaymentRecord[];
  focusedPaymentId?: string;
  rentBilling: RentBillingSummary;
  electricityBills: ElectricityBillRecord[];
  financialYearStart: number;
  financialYearOptions: FinancialYearOption[];
  properties: PropertyRecord[];
  tenants: TenantRecord[];
  portfolioActive: boolean;
  allowedPropertyIds: string[];
  onAddProperty: () => void;
  onEditProperty: (property: PropertyRecord) => void;
  onAddUnit: (property: PropertyRecord) => void;
  onEditUnit: (property: PropertyRecord, unit: UnitRecord) => void;
  onRecordPayment: () => void;
  onAddElectricityBill: () => void;
  onAddTenant: () => void;
  onEditTenant: (tenant: TenantRecord) => void;
  onViewTenant: (tenant: TenantRecord) => void;
  onViewRentBill: (bill: RentBillingSummary["bills"][number]) => void;
  onViewElectricityBill: (bill: ElectricityBillRecord) => void;
  remindHref?: (tenant: TenantRecord) => string | null;
  onImport?: () => void;
}) {
  const descriptions: Record<string, string> = {
    Properties: "Manage buildings, units, and occupancy.",
    Tenants: "Keep every tenant and lease in one place.",
    Payments: "Track paid, pending, and overdue rent.",
  };
  function exportSection() {
    const params = new URLSearchParams({ section });
    if (section === "Payments") params.set("fy", String(financialYearStart));
    const anchor = document.createElement("a");
    anchor.href = `/api/export?${params.toString()}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  const hasExportData =
    section === "Properties"
      ? properties.length > 0
      : section === "Tenants"
        ? tenants.length > 0
        : rentBilling.bills.length > 0 || electricityBills.length > 0 || rows.length > 0;
  const canExport = portfolioActive && hasExportData;

  return (
    <div className="animate-rise">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs text-[#8a909f] sm:text-sm">Portfolio</p>
          <h1 className="mt-1 font-display text-[29px] font-extrabold tracking-[-0.045em] sm:text-[34px]">{section}</h1>
          <p className="mt-1 text-[13px] text-[#747b8b] sm:text-sm">{descriptions[section]}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={exportSection}
            disabled={!canExport}
            title={!portfolioActive ? "CSV export is included with Portfolio." : undefined}
          >
            <Download className="size-4" /> Export CSV
          </Button>
          {(section === "Properties" || section === "Tenants") && onImport && (
            <Button variant="outline" onClick={onImport}>
              <Upload className="size-4" /> Import from Excel
            </Button>
          )}
          {section === "Payments" && (
            <Button variant="outline" onClick={onAddElectricityBill}>
              <Plus className="size-4" /> Add electricity bill
            </Button>
          )}
          <Button
            onClick={section === "Properties" ? onAddProperty : section === "Tenants" ? onAddTenant : onRecordPayment}
            className="col-span-2 sm:col-auto"
          >
            <Plus className="size-4" /> {section === "Properties" ? "Add property" : section === "Payments" ? "Record payment" : `Add ${section.slice(0, -1).toLowerCase()}`}
          </Button>
        </div>
      </div>
      <div className="mt-7">
        {section === "Properties" ? (
          properties.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  readOnly={!allowedPropertyIds.includes(property.id)}
                  onEdit={onEditProperty}
                  onAddUnit={onAddUnit}
                  onEditUnit={onEditUnit}
                />
              ))}
            </div>
          ) : (
            <div className="grid min-h-[360px] place-items-center rounded-[24px] border border-dashed border-[#dcdfe8] bg-white p-8 text-center">
              <div>
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#efeffd] text-[#5b5bd6]"><Building2 className="size-6" /></span>
                <h2 className="mt-5 font-display text-lg font-bold">No properties found</h2>
                <p className="mt-2 text-sm text-[#858b9a]">Add a property or clear your search to see your portfolio.</p>
                <Button className="mt-5" onClick={onAddProperty}><Plus className="size-4" /> Add property</Button>
              </div>
            </div>
          )
        ) : section === "Tenants" ? (
          <TenantList
            tenants={tenants}
            onAdd={onAddTenant}
            onEdit={onEditTenant}
            remindHref={remindHref}
            onView={onViewTenant}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-[20px] border border-[#e7e9ef] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <p className="text-xs font-bold text-[#4d5362]">Financial year</p>
                <p className="mt-1 text-[11px] text-[#8b91a0]">Only the selected April–March period is loaded.</p>
              </div>
              <FormSelect
                className="h-10 w-full rounded-xl border border-[#dfe2e9] bg-[#fafafd] px-3 text-sm font-semibold outline-none focus:border-[#aaaaf0] sm:w-44"
                value={String(financialYearStart)}
                onValueChange={(value) => {
                  window.location.assign(`/dashboard?section=Payments&fy=${value}`);
                }}
                options={financialYearOptions.map((option) => ({
                  value: String(option.value),
                  label: option.label,
                }))}
              />
            </div>
            <RentBillTable
              bills={rentBilling.bills}
              financialYearLabel={rentBilling.financialYearLabel}
              onViewBill={onViewRentBill}
            />
            <ElectricityBillTable
              bills={electricityBills}
              financialYearLabel={rentBilling.financialYearLabel}
              onViewBill={onViewElectricityBill}
            />
            <PaymentTable rows={rows} focusedPaymentId={focusedPaymentId} />
          </div>
        )}
      </div>
    </div>
  );
}
