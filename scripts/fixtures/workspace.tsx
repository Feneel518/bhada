import { Dashboard } from "@/components/dashboard";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Dashboard>;
const profile: NonNullable<Props["profile"]> = { businessName: "Shah Rentals", rentBillingPeriod: "previous", showOutstandingOnInvoice: true, phone: "", gstin: "", pan: "", address: "Ahmedabad", city: "Ahmedabad", state: "Gujarat", pincode: "380001" };
const tenants: Props["tenants"] = ["Aarav Mehta", "Priya Shah"].map((name, i) => ({
  id: `tenant-${i}`, unitId: `unit-${i}`, propertyName: "Shanti Residency", unitNumber: `${i + 101}`, name,
  email: "", phone: "", aadhaarMasked: "", panMasked: "", gstin: "", emergencyContact: "", emergencyPhone: "",
  leaseStart: "2026-01-01", leaseEnd: "2027-01-01", monthlyRent: 15000, rentBillingDay: 1, rentDueDay: 5,
  gstEnabled: false, gstRate: 0, gstTaxablePercent: 100, tdsEnabled: false, tdsRate: 0, securityDeposit: 30000,
  lockInMonths: null, noticePeriodMonths: null, rentEscalationPct: null, rentEscalationMonths: null, nextEscalationDate: "", leaseDocUrl: "", isActive: true, openingBalance: 0, creditBalance: 0,
}));
const properties: Props["properties"] = [{ id: "property-1", name: "Shanti Residency", address: "Satellite Road", city: "Ahmedabad", state: "Gujarat", postalCode: "380015", units: tenants.map((tenant, i) => ({ id: tenant.unitId, propertyId: "property-1", unitNumber: tenant.unitNumber, floor: "1", areaSqft: 800, status: "occupied", openingMeterReading: 100, openingMeterReadingDate: "2026-01-01", lastMeterReading: 250 + i * 50, lastMeterReadingDate: "2026-10-01", tenant })) }];
const rentBilling: Props["rentBilling"] = { financialYearLabel: "FY 2026-27", periodLabel: "October 2026", billedThisMonth: 30000, paidThisMonth: 15000, pendingThisMonth: 15000, pendingTotal: 15000, openingBalancePending: 0, overdueTotal: 15000, overdueCount: 1, collectionRate: 50, bills: [{ id: "bill-1", tenantId: tenants[1].id, tenantName: tenants[1].name, billNumber: "RENT-202610-101", billingPeriod: "2026-09", issueDate: "2026-10-01", dueDate: "2026-10-05", baseAmount: 15000, gstRate: 0, gstAmount: 0, tdsRate: 0, tdsAmount: 0, amount: 15000, paid: 0, pending: 15000, status: "Overdue" }] };

export default async function WorkspacePreview({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { state } = await searchParams;
  const expired = state === "expired";
  const trial = state === "trial";
  return <Dashboard
    user={{ id: "ui-test", name: "Neel Shah", email: "test@example.com", image: null }}
    profile={profile} issuer={{ ...profile, email: "test@example.com" }}
    properties={properties} tenants={tenants}
    payments={[{ id: "payment-1", receiptNumber: "RCPT-101", tenant: tenants[0].name, tenantId: tenants[0].id, property: "Shanti Residency", amount: 15000, date: "10 Oct 2026", paidAt: "2026-10-10", status: "Paid", balance: 0, method: "Bank transfer", allocationMode: "lump_sum", summary: "October rent", initials: "AM", color: "#e7e3fb" }]}
    rentBilling={rentBilling} overviewRentBilling={rentBilling} electricityBills={[]}
    financialYearStart={2026} financialYearOptions={[{ value: 2026, label: "FY 2026-27" }]}
    tenantAnalytics={[]} tenantLedgers={[]} notifications={[]} subscriptionReceipts={[]}
    incomeOverview={[4,5,6,7,8,9,10].map((month) => ({ period: `2026-${String(month).padStart(2,"0")}`, label: ["Apr","May","Jun","Jul","Aug","Sep","Oct"][month-4], description: "Rent collected", value: month === 10 ? 15000 : 30000 }))}
    subscription={{ active: trial, status: "none", currentPeriodEnd: null, cancelAtPeriodEnd: false, trialActive: trial, trialEligible: !trial && !expired, trialEndsAt: trial ? "2099-10-21T10:00:00Z" : expired ? "2026-01-01T10:00:00Z" : null }}
    rentalAccess={{ propertyIds: expired ? [] : ["property-1"], unitIds: expired ? [] : ["unit-0", "unit-1"], hasLockedRentals: expired }}
  />;
}
