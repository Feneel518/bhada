import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { landlord } from "@/db/schema";
import { Dashboard } from "@/components/dashboard";
import { getProperties } from "@/lib/properties";
import { getTenants } from "@/lib/tenants";
import { getPayments } from "@/lib/payments";
import { getRentBilling } from "@/lib/rent-billing";
import { getElectricityBills } from "@/lib/electricity-billing";
import { resolveFinancialYearStart } from "@/lib/financial-year";
import { getAvailableFinancialYears } from "@/lib/financial-year-server";
import { getTenantAnalytics } from "@/lib/tenant-analytics";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ fy?: string; section?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in?returnTo=/dashboard");
  }

  const params = await searchParams;
  const now = new Date();
  const financialYearStart = resolveFinancialYearStart(params.fy, now);
  const [[profile], properties, tenants, payments, rentBilling, electricityBills, financialYearOptions, tenantAnalytics] = await Promise.all([
    db
      .select()
      .from(landlord)
      .where(eq(landlord.userId, session.user.id))
      .limit(1),
    getProperties(session.user.id),
    getTenants(session.user.id),
    getPayments(session.user.id),
    getRentBilling(session.user.id, now, financialYearStart),
    getElectricityBills(session.user.id, now, financialYearStart),
    getAvailableFinancialYears(session.user.id, financialYearStart, now),
    getTenantAnalytics(session.user.id),
  ]);

  return (
    <Dashboard
      initialSection={params.section === "Payments" ? "Payments" : "Overview"}
      properties={properties}
      tenants={tenants}
      payments={payments}
      rentBilling={rentBilling}
      electricityBills={electricityBills}
      financialYearStart={financialYearStart}
      financialYearOptions={financialYearOptions}
      tenantAnalytics={tenantAnalytics}
      issuer={{
        businessName: profile?.businessName ?? session.user.name,
        email: session.user.email,
        phone: profile?.phone ?? "",
        gstin: profile?.gstin ?? "",
        pan: profile?.pan ?? "",
        address: profile?.address ?? "",
        city: profile?.city ?? "",
        state: profile?.state ?? "",
        pincode: profile?.pincode ?? "",
      }}
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }}
    />
  );
}
