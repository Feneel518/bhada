import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { landlord } from "@/db/schema";
import { getElectricityBills } from "@/lib/electricity-billing";
import { resolveFinancialYearStart } from "@/lib/financial-year";
import { getPayments } from "@/lib/payments";
import { hasPortfolioAccess } from "@/lib/plans";
import { getProperties } from "@/lib/properties";
import { getRentBilling } from "@/lib/rent-billing";
import { getTenants } from "@/lib/tenants";

type CsvValue = string | number | boolean | null | undefined;
type ExportSection = "Properties" | "Tenants" | "Payments";

function csvCell(value: CsvValue) {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@]/.test(text.trimStart())) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function csvResponse(filename: string, headers: string[], rows: CsvValue[][]) {
  const csv = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ].join("\r\n");

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/csv; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function errorResponse(message: string, status: number) {
  return Response.json({ message }, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return errorResponse("Authentication required.", 401);

  const [account] = await db
    .select({
      plan: landlord.plan,
      subscriptionStatus: landlord.subscriptionStatus,
      subscriptionCurrentPeriodEnd: landlord.subscriptionCurrentPeriodEnd,
      subscriptionCancelAtPeriodEnd: landlord.subscriptionCancelAtPeriodEnd,
    })
    .from(landlord)
    .where(eq(landlord.userId, session.user.id))
    .limit(1);

  if (!account || !hasPortfolioAccess(account)) {
    return errorResponse("CSV export is included with Portfolio.", 403);
  }

  const url = new URL(request.url);
  const section = url.searchParams.get("section") as ExportSection | null;
  if (!section || !["Properties", "Tenants", "Payments"].includes(section)) {
    return errorResponse("Choose a valid export section.", 400);
  }

  const today = new Date().toISOString().slice(0, 10);

  if (section === "Properties") {
    const properties = await getProperties(session.user.id);
    const rows = properties.flatMap<CsvValue[]>((property) => {
      const propertyValues: CsvValue[] = [
        property.name,
        property.address,
        property.city,
        property.state,
        property.postalCode,
      ];
      if (!property.units.length) {
        return [[...propertyValues, "", "", "", "", "", "", ""]];
      }
      return property.units.map((unit) => [
        ...propertyValues,
        unit.unitNumber,
        unit.floor,
        unit.areaSqft,
        unit.status,
        unit.tenant?.name ?? "",
        unit.tenant?.email ?? "",
        unit.tenant?.phone ?? "",
      ]);
    });

    return csvResponse(
      `bhada-properties-${today}.csv`,
      ["Property", "Address", "City", "State", "Postal code", "Unit", "Floor", "Area (sq ft)", "Status", "Tenant", "Tenant email", "Tenant phone"],
      rows,
    );
  }

  if (section === "Tenants") {
    const tenants = await getTenants(session.user.id);
    return csvResponse(
      `bhada-tenants-${today}.csv`,
      ["Tenant", "Property", "Unit", "Status", "Email", "Phone", "Lease start", "Lease end", "Monthly rent", "Billing day", "Due day", "GST enabled", "GST rate", "TDS enabled", "TDS rate", "Security deposit", "Opening balance", "Credit balance", "Next escalation"],
      tenants.map((tenant) => [
        tenant.name,
        tenant.propertyName,
        tenant.unitNumber,
        tenant.isActive ? "Active" : "Inactive",
        tenant.email,
        tenant.phone,
        tenant.leaseStart,
        tenant.leaseEnd,
        tenant.monthlyRent,
        tenant.rentBillingDay,
        tenant.rentDueDay,
        tenant.gstEnabled ? "Yes" : "No",
        tenant.gstRate,
        tenant.tdsEnabled ? "Yes" : "No",
        tenant.tdsRate,
        tenant.securityDeposit,
        tenant.openingBalance,
        tenant.creditBalance,
        tenant.nextEscalationDate,
      ]),
    );
  }

  const now = new Date();
  const financialYearStart = resolveFinancialYearStart(url.searchParams.get("fy") ?? undefined, now);
  const financialYearEnd = financialYearStart + 1;
  const [payments, rentBilling, electricityBills, tenants] = await Promise.all([
    getPayments(session.user.id),
    getRentBilling(session.user.id, now, financialYearStart),
    getElectricityBills(session.user.id, now, financialYearStart),
    getTenants(session.user.id),
  ]);
  const tenantById = new Map(tenants.map((tenant) => [tenant.id, tenant]));
  const paymentRows = payments
    .filter((payment) =>
      payment.paidAt >= `${financialYearStart}-04-01`
      && payment.paidAt < `${financialYearEnd}-04-01`)
    .map<CsvValue[]>((payment) => [
      "Payment",
      payment.receiptNumber,
      payment.tenant,
      payment.property,
      "",
      "",
      payment.paidAt,
      "",
      "",
      "",
      "",
      payment.amount,
      payment.amount,
      payment.balance,
      payment.status,
      payment.method,
      payment.summary,
    ]);
  const rentRows = rentBilling.bills.map<CsvValue[]>((bill) => {
    const tenant = tenantById.get(bill.tenantId);
    return [
      "Rent bill",
      bill.billNumber,
      bill.tenantName,
      tenant?.propertyName ?? "",
      tenant?.unitNumber ?? "",
      bill.billingPeriod,
      "",
      bill.dueDate,
      bill.baseAmount,
      bill.gstAmount,
      bill.tdsAmount,
      bill.amount,
      bill.paid,
      bill.pending,
      bill.status,
      "",
      "",
    ];
  });
  const electricityRows = electricityBills.map<CsvValue[]>((bill) => [
    "Electricity bill",
    bill.billNumber,
    bill.tenantName,
    bill.propertyName,
    bill.unitNumber,
    bill.billingPeriod,
    "",
    bill.dueDate,
    "",
    "",
    "",
    bill.amount,
    bill.paid,
    bill.pending,
    bill.status,
    "",
    bill.note,
  ]);

  return csvResponse(
    `bhada-payments-FY${financialYearStart}-${String(financialYearEnd).slice(-2)}.csv`,
    ["Record type", "Reference", "Tenant", "Property", "Unit", "Billing period", "Payment date", "Due date", "Base amount", "GST amount", "TDS amount", "Total amount", "Paid", "Pending / balance", "Status", "Payment method", "Notes"],
    [...rentRows, ...electricityRows, ...paymentRows],
  );
}
